"""Booking requests — public submission, admin workflow, deposit option lifecycle.

Statuts : nouvelle / a_valider / en_attente_acompte / confirmee / refusee / expiree / annulee.
L'acceptation crée une option de 24h (créneau bloqué) et envoie le lien de paiement ;
la confirmation passe par le webhook Stripe (routers/payments.py).
"""
import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pymongo import ReturnDocument

from lib.booking_flow import (
    ALLOWED_TRANSITIONS,
    DEFAULT_DEPOSIT_EUR,
    accept_booking,
    confirm_booking,
    expire_stale_options,
    release_reserved_block,
    to_model,
)
from lib.db import db
from lib.emails import booking_owner_notification, booking_status_update, schedule_email
from models.booking import (
    AdminNotesUpdate,
    BookingRequest,
    BookingRequestCreate,
    BookingStatus,
    BookingStatusUpdate,
    PaymentInfo,
)
from routers.auth import require_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/bookings", tags=["bookings"])

MONTHS_FR = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre",
]


def format_date_fr(iso_date: str) -> str:
    """'2025-09-12' → '12 septembre 2025' (équivalent client toLocaleDateString fr-FR)."""
    from datetime import date

    try:
        d = date.fromisoformat(iso_date)
    except ValueError:
        return iso_date
    return f"{d.day} {MONTHS_FR[d.month - 1]} {d.year}"


def requested_dates_label(start_date: str, end_date: str) -> str:
    if start_date == end_date:
        return format_date_fr(start_date)
    return f"Du {format_date_fr(start_date)} au {format_date_fr(end_date)}"


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
        status="nouvelle",
    )
    await db.booking_requests.insert_one(booking.model_dump())
    schedule_email(booking_owner_notification, booking.model_dump())
    return booking


@router.get("", response_model=List[BookingRequest])
async def list_bookings(admin: str = Depends(require_admin)) -> List[BookingRequest]:
    await expire_stale_options()
    docs = await db.booking_requests.find().sort("created_at", -1).to_list(1000)
    return [to_model(doc) for doc in docs]


@router.get("/{booking_id}/payment-info", response_model=PaymentInfo)
async def get_payment_info(booking_id: str) -> PaymentInfo:
    """Vue publique minimale pour la page de paiement — aucune donnée personnelle."""
    await expire_stale_options()
    doc = await db.booking_requests.find_one({"id": booking_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Réservation introuvable")
    return PaymentInfo(
        booking_id=doc["id"],
        requested_dates=doc.get("requested_dates", ""),
        start_time=doc.get("start_time", ""),
        end_time=doc.get("end_time", ""),
        status=doc.get("status", "nouvelle"),
        deposit_amount_eur=doc.get("deposit_amount_eur"),
        option_expires_at=doc.get("option_expires_at"),
    )


@router.patch("/{booking_id}/status", response_model=BookingRequest)
async def update_status(
    booking_id: str, input: BookingStatusUpdate, admin: str = Depends(require_admin)
) -> BookingRequest:
    doc = await db.booking_requests.find_one({"id": booking_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Demande introuvable")

    current: BookingStatus = doc.get("status", "nouvelle")
    new_status: BookingStatus = input.status
    allowed = ALLOWED_TRANSITIONS.get(current, set())
    if new_status not in allowed:
        raise HTTPException(
            status_code=422,
            detail=f"Transition non autorisée : {current} → {new_status}",
        )

    if new_status == "en_attente_acompte":
        # Acceptation (ou relance d'option) : montant + fenêtre de 24h + lien de paiement
        return await accept_booking(doc, input.deposit_amount_eur)

    if new_status == "a_valider":
        updated = await db.booking_requests.find_one_and_update(
            {"id": booking_id}, {"$set": {"status": "a_valider"}},
            return_document=ReturnDocument.AFTER,
        )
        return to_model(updated)

    if new_status == "confirmee":
        # Confirmation manuelle (acompte reçu hors ligne) — même effet que le webhook
        booking = await confirm_booking(booking_id)
        if booking is None:
            raise HTTPException(status_code=404, detail="Demande introuvable")
        return booking

    # refusee / annulee : libère le créneau réservé par l'option ou la confirmation
    await release_reserved_block(doc)
    updated = await db.booking_requests.find_one_and_update(
        {"id": booking_id}, {"$set": {"status": new_status}},
        return_document=ReturnDocument.AFTER,
    )
    booking = to_model(updated)
    schedule_email(booking_status_update, booking.model_dump())
    return booking


@router.patch("/{booking_id}/notes", response_model=BookingRequest)
async def update_notes(
    booking_id: str, input: AdminNotesUpdate, admin: str = Depends(require_admin)
) -> BookingRequest:
    updated = await db.booking_requests.find_one_and_update(
        {"id": booking_id},
        {"$set": {"admin_notes": input.admin_notes or None}},
        return_document=ReturnDocument.AFTER,
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Demande introuvable")
    return to_model(updated)


@router.delete("/{booking_id}", status_code=204)
async def delete_booking(booking_id: str, admin: str = Depends(require_admin)) -> None:
    doc = await db.booking_requests.find_one({"id": booking_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Demande introuvable")
    await release_reserved_block(doc)
    await db.booking_requests.delete_one({"id": booking_id})
    return None
