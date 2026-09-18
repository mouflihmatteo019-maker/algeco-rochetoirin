"""Availability calendar blocks — public read, admin write."""
import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException

from lib.db import db
from models.booking import CalendarBlock, CalendarBlockCreate
from routers.auth import require_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/calendar", tags=["calendar"])


def _to_model(doc: dict) -> CalendarBlock:
    doc.pop("_id", None)
    return CalendarBlock(**doc)


@router.get("", response_model=List[CalendarBlock])
async def list_blocks() -> List[CalendarBlock]:
    docs = await db.calendar_blocks.find().sort("start_date", 1).to_list(1000)
    return [_to_model(doc) for doc in docs]


@router.post("", response_model=CalendarBlock)
async def create_block(input: CalendarBlockCreate, admin: str = Depends(require_admin)) -> CalendarBlock:
    end_date = input.end_date or input.start_date
    if end_date < input.start_date:
        end_date = input.start_date  # original client-side coercion: single day
    block = CalendarBlock(
        start_date=input.start_date,
        end_date=end_date,
        label=input.label or None,
        status=input.status,
    )
    await db.calendar_blocks.insert_one(block.model_dump())
    return block


@router.delete("/{block_id}", status_code=204)
async def delete_block(block_id: str, admin: str = Depends(require_admin)) -> None:
    result = await db.calendar_blocks.delete_one({"id": block_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Période introuvable")
    return None
