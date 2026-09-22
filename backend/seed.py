"""Idempotent seed: admin account + demo bookings (deposit flow) + demo calendar blocks.

Run: cd /app/backend && python seed.py
"""
import asyncio
from datetime import datetime, timedelta, timezone

from lib.db import client, db, ensure_indexes
from lib.security import hash_password

ADMIN_EMAIL = "admin@ets-mathieu.fr"
ADMIN_PASSWORD = "Algeco2024!"

MONTHS_FR = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre",
]


def format_fr(iso_date: str) -> str:
    d = datetime.strptime(iso_date, "%Y-%m-%d")
    return f"{d.day} {MONTHS_FR[d.month - 1]} {d.year}"


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

    now = datetime.now(timezone.utc)
    today = now

    def d(offset: int) -> str:
        return (today + timedelta(days=offset)).strftime("%Y-%m-%d")

    # ── Nettoyage des anciennes démos (ids fixes) avant réinsertion ──
    await db.booking_requests.delete_many(
        {"id": {"$in": ["demo-booking-accepted", "demo-booking-pending", "demo-booking-refused"]}}
    )
    await db.calendar_blocks.delete_many(
        {"id": {"$in": ["demo-block-reserved", "demo-block-maintenance"]}}
    )

    # ── Démo : couvre les statuts principaux du flux avec acompte ──
    demo_bookings = [
        {
            "id": "demo-booking-nouvelle",
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
            "status": "nouvelle",
            "deposit_amount_eur": None,
            "option_expires_at": None,
            "paid_at": None,
            "admin_notes": None,
            "created_at": now - timedelta(days=3),
        },
        {
            "id": "demo-booking-option",
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
            "status": "en_attente_acompte",
            "deposit_amount_eur": 150.0,
            "option_expires_at": now + timedelta(hours=20),  # option en cours
            "paid_at": None,
            "admin_notes": "Lien de paiement envoyé, relance prévue si besoin.",
            "created_at": now - timedelta(days=1),
        },
        {
            "id": "demo-booking-confirmee",
            "requested_dates": f"Du {format_fr(d(25))} au {format_fr(d(26))}",
            "start_date": d(25),
            "end_date": d(26),
            "start_time": "08:00",
            "end_time": "20:00",
            "need_type": "professionnel",
            "people_count": 8,
            "name": "Julien Martin",
            "phone": "06 45 67 89 01",
            "email": "j.martin@exemple.fr",
            "message": "Base chantier pendant intervention route de Lyon.",
            "status": "confirmee",
            "deposit_amount_eur": 150.0,
            "option_expires_at": now - timedelta(days=2),
            "paid_at": now - timedelta(days=2, hours=-1),
            "admin_notes": "Acompte reçu via Stripe.",
            "created_at": now - timedelta(days=5),
        },
        {
            "id": "demo-booking-refusee",
            "requested_dates": format_fr(d(30)),
            "start_date": d(30),
            "end_date": d(30),
            "start_time": "10:00",
            "end_time": "22:00",
            "need_type": "evenement",
            "people_count": 35,
            "name": "Association Les Saveurs du Bugey",
            "phone": "06 88 44 22 11",
            "email": "saveursdubugey@exemple.fr",
            "message": "Repas annuel, 35 personnes attendues.",
            "status": "refusee",
            "deposit_amount_eur": None,
            "option_expires_at": None,
            "paid_at": None,
            "admin_notes": "Capacité maximale dépassée (35 pers.).",
            "created_at": now - timedelta(days=4),
        },
    ]
    for doc in demo_bookings:
        await db.booking_requests.update_one({"id": doc["id"]}, {"$set": doc}, upsert=True)
    print(f"booking_requests: {len(demo_bookings)} demandes de démo")

    # ── Blocs calendrier : option (24h) + réservation confirmée + maintenance ──
    demo_blocks = [
        {
            "id": f"reserved-{d(18)}-{d(18)}",
            "start_date": d(18),
            "end_date": d(18),
            "label": None,
            "status": "reserved",
            "created_at": now - timedelta(days=1),
        },
        {
            "id": f"reserved-{d(25)}-{d(26)}",
            "start_date": d(25),
            "end_date": d(26),
            "label": None,
            "status": "reserved",
            "created_at": now - timedelta(days=2),
        },
        {
            "id": "demo-block-maintenance",
            "start_date": d(40),
            "end_date": d(42),
            "label": "Maintenance",
            "status": "blocked",
            "created_at": now - timedelta(days=2),
        },
    ]
    for doc in demo_blocks:
        await db.calendar_blocks.update_one({"id": doc["id"]}, {"$set": doc}, upsert=True)
    print(f"calendar_blocks: {len(demo_blocks)} périodes de démo")


if __name__ == "__main__":
    asyncio.run(seed())
    client.close()
