"""Transitions partagées du flux de réservation avec acompte.

Utilisé par routers/bookings.py (actions admin), routers/payments.py (webhook + statut)
et la tâche d'expiration lancée par server.py.
"""
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from pymongo import ReturnDocument

from lib.db import db
from lib.emails import deposit_option_email, payment_confirmation_emails, schedule_email
from models.booking import BookingRequest, CalendarBlock

logger = logging.getLogger(__name__)

OPTION_HOURS = 24
DEFAULT_DEPOSIT_EUR = 150.0

# Transitions autorisées (statut courant → statuts atteignables)
ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    "nouvelle": {"a_valider", "en_attente_acompte", "refusee"},
    "a_valider": {"en_attente_acompte", "refusee"},
    "en_attente_acompte": {"confirmee", "refusee", "annulee", "expiree"},
    "confirmee": {"annulee"},
    "refusee": {"en_attente_acompte"},  # relance de l'option
    "expiree": {"en_attente_acompte"},  # relance de l'option
    "annulee": {"en_attente_acompte"},  # relance de l'option
}


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def as_aware_utc(dt: datetime) -> datetime:
    """motor rend les dates BSON naïves — normalise avant toute comparaison Python."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def to_model(doc: dict) -> BookingRequest:
    doc.pop("_id", None)
    return BookingRequest(**doc)


def reserved_block_id(start_date: str, end_date: str) -> str:
    return f"reserved-{start_date}-{end_date}"


async def ensure_reserved_block(doc: dict) -> None:
    """Bloque le créneau (créneau → indisponible dans le calendrier). Idempotent."""
    start = doc.get("start_date")
    if not start:
        return
    end = doc.get("end_date") or start
    block = CalendarBlock(
        id=reserved_block_id(start, end), start_date=start, end_date=end,
        label=None, status="reserved",
    )
    await db.calendar_blocks.update_one(
        {"id": block.id}, {"$set": block.model_dump()}, upsert=True
    )


async def release_reserved_block(doc: dict) -> None:
    """Libère le créneau réservé au titre de cette réservation, s'il existe."""
    start = doc.get("start_date")
    if not start:
        return
    end = doc.get("end_date") or start
    await db.calendar_blocks.delete_one({"id": reserved_block_id(start, end)})


async def accept_booking(doc: dict, deposit_amount_eur: Optional[float]) -> BookingRequest:
    """Acceptation → option d'acompte 24h, créneau bloqué, lien de paiement envoyé au client."""
    amount = round(float(deposit_amount_eur or DEFAULT_DEPOSIT_EUR), 2)
    expires = now_utc() + timedelta(hours=OPTION_HOURS)

    await ensure_reserved_block(doc)
    updated = await db.booking_requests.find_one_and_update(
        {"id": doc["id"]},
        {
            "$set": {
                "status": "en_attente_acompte",
                "deposit_amount_eur": amount,
                "option_expires_at": expires,
                "paid_at": None,
            }
        },
        return_document=ReturnDocument.AFTER,
    )
    booking = to_model(updated)
    logger.info("Réservation %s acceptée — acompte %.2f €, option jusqu'à %s", booking.id, amount, expires)
    schedule_email(deposit_option_email, booking.model_dump())
    return booking


async def confirm_booking(booking_id: str) -> Optional[BookingRequest]:
    """Paiement d'acompte confirmé (webhook Stripe ou vérification directe).

    Idempotent : seul le premier appel qui trouve le statut 'en_attente_acompte' agit
    et déclenche les emails de confirmation.
    """
    updated = await db.booking_requests.find_one_and_update(
        {"id": booking_id, "status": "en_attente_acompte"},
        {"$set": {"status": "confirmee", "paid_at": now_utc()}},
        return_document=ReturnDocument.AFTER,
    )
    if not updated:
        doc = await db.booking_requests.find_one({"id": booking_id})
        if not doc:
            return None
        logger.info("confirm_booking(%s): statut déjà %s — ignoré", booking_id, doc.get("status"))
        return to_model(doc)

    booking = to_model(updated)
    await ensure_reserved_block(booking.model_dump())
    logger.info("Réservation %s confirmée (acompte payé)", booking_id)
    schedule_email(payment_confirmation_emails, booking.model_dump())
    return booking


async def expire_stale_options() -> int:
    """Options d'acompte non réglées sous 24h → 'expiree', créneau libéré.

    Appelée par le sweeper (lifespan, toutes les 60 s) et en tête des lectures
    concernées, pour un état cohérent même sans passage du sweeper.
    """
    stale = await db.booking_requests.find(
        {"status": "en_attente_acompte", "option_expires_at": {"$ne": None, "$lt": now_utc()}}
    ).to_list(1000)
    for doc in stale:
        result = await db.booking_requests.update_one(
            {"id": doc["id"], "status": "en_attente_acompte"},
            {"$set": {"status": "expiree"}},
        )
        if result.modified_count:
            await release_reserved_block(doc)
            logger.info("Option d'acompte expirée pour %s — créneau libéré", doc["id"])
    return len(stale)
