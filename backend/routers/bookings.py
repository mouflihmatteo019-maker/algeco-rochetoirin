"""Booking requests — public submission, admin listing/status/notes/delete.

Ports the original Supabase tables + edge-function behaviour:
- POST creates a request (status pending) and emails the owner (fire-and-forget)
- PATCH status to accepted inserts a 'reserved' calendar block; any other status
  removes it — matching the original client-side logic, but server-side.
"""
import logging
from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pymongo import ReturnDocument

from lib.db import db
from lib.emails import booking_owner_notification, booking_status_update
from models.booking import (
    AdminNotesUpdate,
    BookingRequest,
    BookingRequestCreate,
    BookingStatus,
    BookingStatusUpdate,
)
from routers.auth import require_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/bookings", tags=["bookings"])

MONTHS_FR = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre",
]


def format_date_fr(iso_date: str) -> str:
    """'2025-09-12' → '12 septembre 2025' (client-side equivalent of toLocaleDateString fr-FR)."""
    try:
        d = date.fromisoformat(iso_date)
    except ValueError:
        return iso_date
    return f"{d.day} {MONTHS_FR[d.month - 1]} {d.year}"


def requested_dates_label(start_date: str, end_date: str) -> str:
    if start_date == end_date:
        return format_date_fr(start_date)
    return f"Du {format_date_fr(start_date)} au {format_date_fr(end_date)}"


def _to_model(doc: dict) -> BookingRequest:
    doc.pop("_id", None)
    return BookingRequest(**doc)


@router.post("", response_model=BookingRequest)
async def create_booking(input: BookingRequestCreate) -> BookingRequest:
    end_date = input.end_date or input.start_date
    if end_date < input.start_date:
        raise HTTPException(status_code=422, detail="La date de départ précède la date d'arrivée.")

    booking = BookingRequest(
        requested_dates=requested_dates_label(input.start_date, end_date),
        start_date=input.start_date,
        end_date=end_date,
        start_time=input.start_time,
        end_time=input.end_time,
        need_type=input.need_type,
        people_count=input.people_count,
        name=input.name,
        phone=input.phone,
        email=input.email,
        message=input.message or None,
        status="pending",
        admin_notes=None,
    )
    await db.booking_requests.insert_one(booking.model_dump())
    booking_owner_notification(booking.model_dump(mode="json"))
    return booking


@router.get("", response_model=List[BookingRequest])
async def list_bookings(admin: str = Depends(require_admin)) -> List[BookingRequest]:
    docs = await db.booking_requests.find().sort("created_at", -1).to_list(1000)
    return [_to_model(doc) for doc in docs]


@router.patch("/{booking_id}/status", response_model=BookingRequest)
async def update_status(booking_id: str, input: BookingStatusUpdate, admin: str = Depends(require_admin)) -> BookingRequest:
    doc = await db.booking_requests.find_one({"id": booking_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Demande introuvable")

    new_status: BookingStatus = input.status
    if doc.get("start_date"):
        end_date = doc.get("end_date") or doc["start_date"]
        if new_status == "accepted":
            # replace any previous reserved block for this exact range, then reserve it
            await db.calendar_blocks.delete_many(
                {"status": "reserved", "start_date": doc["start_date"], "end_date": end_date}
            )
            from models.booking import CalendarBlock

            block = CalendarBlock(
                start_date=doc["start_date"], end_date=end_date, label=None, status="reserved"
            )
            await db.calendar_blocks.insert_one(block.model_dump())
        else:
            await db.calendar_blocks.delete_many(
                {"status": "reserved", "start_date": doc["start_date"], "end_date": end_date}
            )

    updated = await db.booking_requests.find_one_and_update(
        {"id": booking_id},
        {"$set": {"status": new_status}},
        return_document=ReturnDocument.AFTER,
    )
    booking = _to_model(updated)

    booking_status_update(booking.model_dump(mode="json"))
    return booking


@router.patch("/{booking_id}/notes", response_model=BookingRequest)
async def update_notes(booking_id: str, input: AdminNotesUpdate, admin: str = Depends(require_admin)) -> BookingRequest:
    updated = await db.booking_requests.find_one_and_update(
        {"id": booking_id},
        {"$set": {"admin_notes": input.admin_notes or None}},
        return_document=ReturnDocument.AFTER,
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Demande introuvable")
    return _to_model(updated)


@router.delete("/{booking_id}", status_code=204)
async def delete_booking(booking_id: str, admin: str = Depends(require_admin)) -> None:
    doc = await db.booking_requests.find_one({"id": booking_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Demande introuvable")
    if doc.get("start_date"):
        end_date = doc.get("end_date") or doc["start_date"]
        await db.calendar_blocks.delete_many(
            {"status": "reserved", "start_date": doc["start_date"], "end_date": end_date}
        )
    await db.booking_requests.delete_one({"id": booking_id})
    return None
