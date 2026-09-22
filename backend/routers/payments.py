"""Paiement de l'acompte via Stripe Checkout (sandbox réclamable, Flow A).

- POST /api/payments/checkout      → crée la session Checkout (montant lu côté serveur
  dans la réservation, jamais depuis le front) et l'enregistre avant redirection.
- GET  /api/payments/status/{sid}  → statut public minimal ; bascule la réservation en
  'confirmée' si Stripe confirme le paiement (filet de sécurité si le webhook tarde).
- POST /api/stripe/webhook         → webhook signé ; source de vérité de la confirmation.
"""
import logging
import os
from datetime import datetime, timezone
from typing import Optional

import stripe
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from lib.booking_flow import confirm_booking, expire_stale_options, now_utc
from lib.db import db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["payments"])
webhook_router = APIRouter()

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY") or "sk_test_emergent"
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")


class CheckoutRequest(BaseModel):
    booking_id: str
    origin_url: str


@router.post("/checkout")
async def create_checkout(req: CheckoutRequest):
    await expire_stale_options()
    doc = await db.booking_requests.find_one({"id": req.booking_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Réservation introuvable")
    if doc.get("status") != "en_attente_acompte":
        raise HTTPException(status_code=400, detail="Cette réservation n'attend pas d'acompte.")
    amount_eur = doc.get("deposit_amount_eur") or 0
    if amount_eur <= 0:
        raise HTTPException(status_code=400, detail="Montant de l'acompte non défini.")

    unit_amount = int(round(amount_eur * 100))
    kwargs = dict(
        mode="payment",
        line_items=[
            {
                "quantity": 1,
                "price_data": {
                    "currency": "eur",
                    "unit_amount": unit_amount,
                    "product_data": {
                        "name": f"Acompte réservation — espace Algéco ({doc.get('requested_dates', '')})",
                    },
                },
            }
        ],
        customer_email=doc.get("email"),
        metadata={"booking_id": req.booking_id, "purpose": "acompte"},
        success_url=f"{req.origin_url}/paiement/{req.booking_id}?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{req.origin_url}/paiement/{req.booking_id}?canceled=1",
    )
    # Impôts : Stripe calcule lorsque c'est possible (acompte = prestation) ; sinon session simple.
    try:
        session = stripe.checkout.Session.create(**kwargs, automatic_tax={"enabled": True})
        tax_mode = "calc_only"
    except stripe.error.InvalidRequestError:
        session = stripe.checkout.Session.create(**kwargs)
        tax_mode = "diy"
    logger.info("Checkout %s créé pour %s (%.2f €, taxe: %s)", session.id, req.booking_id, amount_eur, tax_mode)

    await db.payment_transactions.insert_one(
        {
            "session_id": session.id,
            "booking_id": req.booking_id,
            "amount": unit_amount,
            "currency": "eur",
            "status": "initiated",
            "payment_status": "pending",
            "created_at": now_utc(),
            "updated_at": now_utc(),
        }
    )
    return {"checkout_url": session.url, "session_id": session.id}


@router.get("/status/{session_id}")
async def payment_status(session_id: str):
    """Public minimal — jamais de données personnelles ici."""
    rec = await db.payment_transactions.find_one({"session_id": session_id})
    if not rec:
        raise HTTPException(status_code=404, detail="Transaction introuvable")
    if rec.get("payment_status") != "paid":
        # Le webhook peut tarder : on demande directement à Stripe (même garde idempotent).
        try:
            s = stripe.checkout.Session.retrieve(session_id)
            if s.payment_status == "paid" or s.status == "complete":
                await db.payment_transactions.update_one(
                    {"session_id": session_id, "payment_status": {"$ne": "paid"}},
                    {"$set": {"status": "completed", "payment_status": "paid", "updated_at": now_utc()}},
                )
                await confirm_booking(rec["booking_id"])
                rec = await db.payment_transactions.find_one({"session_id": session_id})
        except stripe.error.StripeError:
            pass  # erreur Stripe transitoire — on renvoie l'état connu
    return {
        "session_id": rec["session_id"],
        "status": rec["status"],
        "payment_status": rec["payment_status"],
    }


@webhook_router.post("/stripe/webhook")  # chemin exact attendu par la plateforme
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    if not STRIPE_WEBHOOK_SECRET:
        logger.error("STRIPE_WEBHOOK_SECRET absent — webhook refusé")
        raise HTTPException(status_code=500, detail="Webhook non configuré")
    try:
        event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
    except (stripe.error.SignatureVerificationError, ValueError):
        raise HTTPException(status_code=400, detail="Signature invalide")

    obj = event["data"]["object"]
    event_type = event["type"]
    logger.info("Webhook Stripe reçu : %s", event_type)

    if event_type in ("checkout.session.completed", "checkout.session.async_payment_succeeded"):
        paid = event_type == "checkout.session.async_payment_succeeded" or obj.get("payment_status") == "paid"
        await db.payment_transactions.update_one(
            {"session_id": obj["id"], "payment_status": {"$ne": "paid"}},
            {
                "$set": {
                    "status": "completed" if paid else "pending",
                    "payment_status": "paid" if paid else obj.get("payment_status", "pending"),
                    "stripe_payment_intent_id": obj.get("payment_intent"),
                    "updated_at": now_utc(),
                }
            },
        )
        booking_id = (obj.get("metadata") or {}).get("booking_id")
        if booking_id and paid:
            await confirm_booking(booking_id)
    elif event_type in ("checkout.session.async_payment_failed", "checkout.session.expired"):
        await db.payment_transactions.update_one(
            {"session_id": obj["id"]},
            {"$set": {"status": "failed" if "failed" in event_type else "expired",
                      "payment_status": "failed" if "failed" in event_type else "expired",
                      "updated_at": now_utc()}},
        )
    elif event_type == "charge.refunded":
        await db.payment_transactions.update_one(
            {"stripe_payment_intent_id": obj.get("payment_intent")},
            {"$set": {"status": "refunded", "payment_status": "refunded", "updated_at": now_utc()}},
        )

    return {"status": "ok"}
