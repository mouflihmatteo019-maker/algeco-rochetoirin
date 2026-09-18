"""Idempotent seed: admin account + demo booking requests + demo calendar blocks.

Run: cd /app/backend && python seed.py
"""
import asyncio
from datetime import datetime, timedelta, timezone

from lib.db import client, db, ensure_indexes
from lib.security import hash_password

ADMIN_EMAIL = "admin@ets-mathieu.fr"
ADMIN_PASSWORD = "Algeco2024!"

OWNER_EMAIL = "admin@ets-mathieu.fr"


def iso(d: datetime) -> str:
    return d.strftime("%Y-%m-%d")


async def seed() -> None:
    await ensure_indexes()

    # ── Admin account (upsert — stays in sync if the password changes here) ──
    await db.admin_users.update_one(
        {"email": ADMIN_EMAIL},
        {
            "$set": {
                "email": ADMIN_EMAIL,
                "password_hash": hash_password(ADMIN_PASSWORD),
                "role": "admin",
            }
        },
        upsert=True,
    )
    print(f"admin ready: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")

    # ── Demo booking requests (fixed ids → re-runnable) ──
    now = datetime.now(timezone.utc)
    today = datetime.now(timezone.utc)

    def d(offset: int) -> str:
        return iso(today + timedelta(days=offset))

    demo_bookings = [
        {
            "id": "demo-booking-accepted",
            "requested_dates": f"Du {format_fr(d(10))} au {format_fr(d(11))}",
            "start_date": d(10),
            "end_date": d(11),
            "start_time": "09:00",
            "end_time": "17:00",
            "need_type": "reunion",
            "people_count": 12,
            "name": "Marie Dubois",
            "phone": "06 12 34 56 78",
            "email": "marie.dubois@exemple.fr",
            "message": "Réunion trimestrielle d'équipe, besoin d'un vidéoprojecteur si possible.",
            "status": "accepted",
            "admin_notes": "Confirmée par téléphone le jour même.",
            "created_at": now - timedelta(days=3),
        },
        {
            "id": "demo-booking-pending",
            "requested_dates": format_fr(d(18)),
            "start_date": d(18),
            "end_date": d(18),
            "start_time": "14:00",
            "end_time": "18:00",
            "need_type": "association",
            "people_count": 20,
            "name": "Comité des Fêtes de Rochetoirin",
            "phone": "07 98 76 54 32",
            "email": "contact@comite-rochetoirin.fr",
            "message": "Assemblée générale annuelle de l'association.",
            "status": "pending",
            "admin_notes": None,
            "created_at": now - timedelta(days=1),
        },
        {
            "id": "demo-booking-refused",
            "requested_dates": f"Du {format_fr(d(25))} au {format_fr(d(27))}",
            "start_date": d(25),
            "end_date": d(27),
            "start_time": "08:00",
            "end_time": "20:00",
            "need_type": "professionnel",
            "people_count": 8,
            "name": "Julien Martin",
            "phone": "06 45 67 89 01",
            "email": "j.martin@exemple.fr",
            "message": "Base chantier pendant intervention route de Lyon.",
            "status": "refused",
            "admin_notes": "Créneau déjà retenu pour maintenance.",
            "created_at": now - timedelta(days=5),
        },
    ]
    for doc in demo_bookings:
        await db.booking_requests.update_one({"id": doc["id"]}, {"$set": doc}, upsert=True)
    print(f"booking_requests: {len(demo_bookings)} demandes de démo")

    # ── Demo calendar blocks ──
    demo_blocks = [
        {
            "id": "demo-block-reserved",
            "start_date": d(10),
            "end_date": d(11),
            "label": None,
            "status": "reserved",
            "created_at": now - timedelta(days=2),
        },
        {
            "id": "demo-block-maintenance",
            "start_date": d(25),
            "end_date": d(27),
            "label": "Maintenance",
            "status": "blocked",
            "created_at": now - timedelta(days=2),
        },
    ]
    for doc in demo_blocks:
        await db.calendar_blocks.update_one({"id": doc["id"]}, {"$set": doc}, upsert=True)
    print(f"calendar_blocks: {len(demo_blocks)} périodes de démo")


def format_fr(iso_date: str) -> str:
    from datetime import date as _date

    MONTHS = [
        "janvier", "février", "mars", "avril", "mai", "juin",
        "juillet", "août", "septembre", "octobre", "novembre", "décembre",
    ]
    d = _date.fromisoformat(iso_date)
    return f"{d.day} {MONTHS[d.month - 1]} {d.year}"


if __name__ == "__main__":
    asyncio.run(seed())
    client.close()
