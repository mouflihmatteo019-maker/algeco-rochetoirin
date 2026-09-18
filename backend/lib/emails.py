"""Transactional emails via Resend — fire-and-forget.

A missing RESEND_API_KEY or a provider error is logged and swallowed: email is a
side channel, the booking flow itself must never fail because of it.
"""
import asyncio
import logging
import os
from typing import Optional

import resend

logger = logging.getLogger(__name__)

SENDER_DEFAULT = "onboarding@resend.dev"


def _from_address() -> str:
    return os.environ.get("SENDER_EMAIL", SENDER_DEFAULT)


def _esc(text: Optional[str]) -> str:
    import html

    return html.escape(text or "")


def _send_sync(to: str, subject: str, html: str) -> None:
    api_key = os.environ.get("RESEND_API_KEY")
    if not api_key:
        logger.info("RESEND_API_KEY absent — email ignoré (%s → %s)", subject, to)
        return
    resend.api_key = api_key
    params: dict = {
        "from": _from_address(),
        "to": [to],
        "subject": subject,
        "html": html,
    }
    try:
        result = resend.Emails.send(params)
        logger.info("Email envoyé (%s → %s) id=%s", subject, to, result)
    except Exception:
        logger.exception("Envoi email échoué (%s → %s)", subject, to)


def send_email(to: str, subject: str, html: str) -> None:
    """Schedule the blocking Resend call off the event loop; never raises."""
    try:
        asyncio.get_running_loop().create_task(asyncio.to_thread(_send_sync, to, subject, html))
    except RuntimeError:
        logger.warning("Pas de boucle async active — email non envoyé (%s)", subject)


def _layout(title: str, body_html: str) -> str:
    return f"""
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f1f5f9;padding:24px;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:#1d5be0;padding:20px 28px;">
          <h1 style="color:#ffffff;font-size:18px;margin:0;">ETS Laurent Mathieu</h1>
          <p style="color:#bcd9ff;font-size:12px;margin:4px 0 0;">Location espace Algéco — Rochetoirin</p>
        </div>
        <div style="padding:28px;">
          <h2 style="font-size:16px;color:#0f172a;margin:0 0 12px;">{title}</h2>
          {body_html}
        </div>
        <div style="padding:16px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;">
          <p style="font-size:11px;color:#94a3b8;margin:0;">
            36 route de Lyon, 38110 Rochetoirin · Cet email concerne une demande de réservation.
          </p>
        </div>
      </div>
    </div>
    """


def _detail_table(rows: list[tuple[str, str]]) -> str:
    cells = "".join(
        f'<tr><td style="padding:6px 12px 6px 0;color:#64748b;font-size:13px;width:160px;">{_esc(label)}</td>'
        f'<td style="padding:6px 0;color:#0f172a;font-size:13px;font-weight:600;">{_esc(value)}</td></tr>'
        for label, value in rows
    )
    return f'<table style="border-collapse:collapse;">{cells}</table>'


def booking_owner_notification(booking: dict) -> None:
    """Nouvelle demande de réservation → notification de l'exploitant."""
    to = os.environ.get("OWNER_EMAIL", "admin@ets-mathieu.fr")
    subject = f"Nouvelle demande de réservation — {booking.get('name', 'visiteur')}"
    rows = [
        ("Nom", booking.get("name", "")),
        ("Dates", booking.get("requested_dates", "")),
        ("Horaires", f"{booking.get('start_time', '')} — {booking.get('end_time', '')}"),
        ("Type de besoin", str(booking.get("need_type", ""))),
        ("Nombre de personnes", str(booking.get("people_count", ""))),
        ("Téléphone", booking.get("phone", "")),
        ("Email", booking.get("email", "")),
    ]
    message = booking.get("message")
    if message:
        rows.append(("Message", message))
    body = (
        f'<p style="font-size:14px;color:#334155;margin:0 0 12px;">Une nouvelle demande de réservation '
        f"a été soumise depuis le site. Connectez-vous à l'espace administrateur pour la traiter.</p>"
        f"{_detail_table(rows)}"
    )
    send_email(to, subject, _layout("Nouvelle demande de réservation", body))


def booking_status_update(booking: dict) -> None:
    """Changement de statut → email au demandeur."""
    to = booking.get("email", "")
    if not to:
        return
    status = booking.get("status", "pending")
    if status == "accepted":
        subject = "Votre demande de réservation a été acceptée"
        verdict = (
            "<p style=\"font-size:14px;color:#047857;font-weight:600;margin:0 0 12px;\">Bonne nouvelle : "
            "votre demande a été acceptée.</p>"
        )
    elif status == "refused":
        subject = "Votre demande de réservation a été refusée"
        verdict = (
            "<p style=\"font-size:14px;color:#be123c;font-weight:600;margin:0 0 12px;\">Nous sommes désolés : "
            "votre demande n'a pas pu être acceptée.</p>"
        )
    else:
        subject = "Votre demande de réservation est en attente"
        verdict = (
            '<p style="font-size:14px;color:#b45309;font-weight:600;margin:0 0 12px;">Votre demande est '
            "de nouveau en attente d'étude.</p>"
        )
    rows = [
        ("Dates", booking.get("requested_dates", "")),
        ("Horaires", f"{booking.get('start_time', '')} — {booking.get('end_time', '')}"),
    ]
    body = (
        f"{verdict}"
        f'<p style="font-size:14px;color:#334155;margin:0 0 12px;">Rappel de votre demande :</p>'
        f"{_detail_table(rows)}"
        f'<p style="font-size:13px;color:#64748b;margin:16px 0 0;">ETS Laurent Mathieu vous recontactera '
        f"si besoin. Aucun paiement n'est effectué en ligne.</p>"
    )
    send_email(to, subject, _layout("Mise à jour de votre demande", body))
