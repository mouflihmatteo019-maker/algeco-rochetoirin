"""Transactional emails via Resend — fire-and-forget.

A missing RESEND_API_KEY or a provider error is logged and swallowed: email is a
side channel, the booking flow itself must never fail because of it.
"""
import asyncio
import html
import logging
import os
from datetime import datetime, timezone
from typing import Optional
from zoneinfo import ZoneInfo

import resend

logger = logging.getLogger(__name__)

SENDER_DEFAULT = "onboarding@resend.dev"
PARIS_TZ = ZoneInfo("Europe/Paris")

MONTHS_FR = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre",
]


def _from_address() -> str:
    return os.environ.get("SENDER_EMAIL", SENDER_DEFAULT)


def app_url() -> str:
    return os.environ.get("APP_URL", "").rstrip("/") or "https://exact-clone-97.preview.emergentagent.com"


def format_dt_fr(dt: datetime) -> str:
    """'18 septembre 2026 à 10:05 (heure de Paris)' — le pod est en UTC."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    local = dt.astimezone(PARIS_TZ)
    return (
        f"{local.day} {MONTHS_FR[local.month - 1]} {local.year} "
        f"à {local.hour:02d}:{local.minute:02d}"
    )


def format_eur(amount: Optional[float]) -> str:
    if amount is None:
        return "—"
    return f"{amount:.2f}".rstrip("0").rstrip(".").replace(".", ",") + " €"


def _esc(text: Optional[str]) -> str:
    return html.escape(str(text or ""))


def _send_sync(to: str, subject: str, html_body: str) -> None:
    api_key = os.environ.get("RESEND_API_KEY")
    if not api_key:
        logger.info("RESEND_API_KEY absent — email ignoré (%s → %s)", subject, to)
        return
    resend.api_key = api_key
    params: dict = {
        "from": _from_address(),
        "to": [to],
        "subject": subject,
        "html": html_body,
    }
    try:
        result = resend.Emails.send(params)
        logger.info("Email envoyé (%s → %s) id=%s", subject, to, result)
    except Exception:
        logger.exception("Envoi email échoué (%s → %s)", subject, to)


def send_email(to: str, subject: str, html_body: str) -> None:
    try:
        loop = asyncio.get_running_loop()
        # Depuis la boucle : l'appel Resend (bloquant) part en worker thread.
        loop.create_task(asyncio.to_thread(_send_sync, to, subject, html_body))
    except RuntimeError:
        # Depuis un worker thread (schedule_email) : on est déjà hors boucle,
        # envoi direct — jamais bloquant pour l'event loop.
        _send_sync(to, subject, html_body)


def schedule_email(builder, booking: dict) -> None:
    """Construit ET envoie l'email hors de la boucle d'événements.

    Ni bloquant ni fatal : une erreur de template est loguée, le flux de
    réservation continue. `builder` reçoit le dict de la réservation.
    """
    def _job() -> None:
        try:
            builder(booking)
        except Exception:
            logger.exception("Construction d'email échouée (%s)", builder.__name__)

    try:
        asyncio.get_running_loop().create_task(asyncio.to_thread(_job))
    except RuntimeError:
        logger.warning("Pas de boucle async active — email %s non envoyé", builder.__name__)


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


def _button(href: str, label: str) -> str:
    return (
        f'<p style="margin:20px 0 8px;text-align:center;">'
        f'<a href="{href}" style="display:inline-block;background:#1d5be0;color:#ffffff;'
        f'text-decoration:none;padding:12px 28px;border-radius:12px;font-size:14px;font-weight:600;">{label}</a></p>'
    )


def booking_owner_notification(booking: dict) -> None:
    """Nouvelle demande de réservation → notification de l'exploitant."""
    to = os.environ.get("OWNER_EMAIL", "admin@ets-mathieu.fr")
    subject = f"Nouvelle demande de réservation — {booking.get('name', 'visiteur')}"
    rows = [
        ("Nom", booking.get("name", "")),
        ("Dates", booking.get("requested_dates", "")),
        ("Horaires", f"{booking.get('start_time', '')} — {booking.get('end_time', '')}"),
        ("Type de besoin", booking.get("need_type", "")),
        ("Nombre de personnes", str(booking.get("people_count", ""))),
        ("Téléphone", booking.get("phone", "")),
        ("Email", booking.get("email", "")),
    ]
    message = booking.get("message")
    if message:
        rows.append(("Message", message))
    body = (
        '<p style="font-size:14px;color:#334155;margin:0 0 12px;">Une nouvelle demande de réservation '
        "a été soumise depuis le site. Connectez-vous à l'espace administrateur pour la traiter.</p>"
        f"{_detail_table(rows)}"
    )
    send_email(to, subject, _layout("Nouvelle demande de réservation", body))


def deposit_option_email(booking: dict) -> None:
    """Acceptation → email au client avec le lien de paiement de l'acompte (option 24h)."""
    to = booking.get("email", "")
    if not to:
        return
    expires = booking.get("option_expires_at")
    deadline = format_dt_fr(expires) if isinstance(expires, datetime) else "sous 24 heures"
    link = f"{app_url()}/paiement/{booking.get('id', '')}"
    rows = [
        ("Dates", booking.get("requested_dates", "")),
        ("Horaires", f"{booking.get('start_time', '')} — {booking.get('end_time', '')}"),
        ("Acompte à régler", format_eur(booking.get("deposit_amount_eur"))),
        ("Option valable jusqu'au", deadline),
    ]
    body = (
        '<p style="font-size:14px;color:#047857;font-weight:600;margin:0 0 12px;">Bonne nouvelle : '
        "votre demande a été acceptée.</p>"
        '<p style="font-size:14px;color:#334155;margin:0 0 12px;">Pour confirmer votre réservation, '
        "réglez l'acompte en ligne via notre paiement sécurisé. Le créneau est réservé pour vous "
        f"jusqu'au {deadline} ; passé ce délai, l'option expire et le créneau redevient disponible.</p>"
        f"{_detail_table(rows)}"
        f"{_button(link, 'Payer mon acompte')}"
        '<p style="font-size:12px;color:#64748b;margin:8px 0 0;">Si le bouton ne fonctionne pas, '
        f"copiez ce lien : {_esc(link)}</p>"
    )
    send_email(to, "Votre réservation est acceptée — réglez l'acompte", _layout("Acompte à régler", body))


def payment_confirmation_emails(booking: dict) -> None:
    """Acompte reçu → email de confirmation au client + à l'entreprise."""
    rows = [
        ("Nom", booking.get("name", "")),
        ("Dates", booking.get("requested_dates", "")),
        ("Horaires", f"{booking.get('start_time', '')} — {booking.get('end_time', '')}"),
        ("Acompte réglé", format_eur(booking.get("deposit_amount_eur"))),
        ("Payé le", format_dt_fr(booking["paid_at"]) if isinstance(booking.get("paid_at"), datetime) else "—"),
    ]
    table = _detail_table(rows)

    client_to = booking.get("email", "")
    if client_to:
        body = (
            '<p style="font-size:14px;color:#047857;font-weight:600;margin:0 0 12px;">Paiement confirmé : '
            "votre réservation est confirmée.</p>"
            '<p style="font-size:14px;color:#334155;margin:0 0 12px;">Nous avons bien reçu votre acompte. '
            "Le créneau vous est réservé. ETS Laurent Mathieu vous recontactera si besoin.</p>"
            f"{table}"
        )
        send_email(client_to, "Paiement confirmé — votre réservation est confirmée", _layout("Réservation confirmée", body))

    owner_to = os.environ.get("OWNER_EMAIL", "admin@ets-mathieu.fr")
    body_owner = (
        '<p style="font-size:14px;color:#334155;margin:0 0 12px;">Un acompte vient d\'être réglé : '
        "la réservation correspondante est automatiquement passée en <strong>Confirmée</strong> "
        "et le créneau est désormais indisponible dans le calendrier.</p>"
        f"{table}"
    )
    send_email(owner_to, "Acompte reçu — réservation confirmée", _layout("Acompte reçu", body_owner))


def booking_status_update(booking: dict) -> None:
    """Changement de statut admin (refus, annulation) → email au demandeur."""
    to = booking.get("email", "")
    if not to:
        return
    status = booking.get("status", "")
    if status == "refusee":
        subject = "Votre demande de réservation a été refusée"
        verdict = (
            "<p style=\"font-size:14px;color:#be123c;font-weight:600;margin:0 0 12px;\">Nous sommes désolés : "
            "votre demande n'a pas pu être acceptée.</p>"
        )
    elif status == "annulee":
        subject = "Votre réservation a été annulée"
        verdict = (
            '<p style="font-size:14px;color:#475569;font-weight:600;margin:0 0 12px;">Votre réservation '
            "a été annulée par ETS Laurent Mathieu.</p>"
        )
    else:
        return  # pas d'email pour les autres transitions manuelles
    rows = [
        ("Dates", booking.get("requested_dates", "")),
        ("Horaires", f"{booking.get('start_time', '')} — {booking.get('end_time', '')}"),
    ]
    body = (
        f"{verdict}"
        '<p style="font-size:14px;color:#334155;margin:0 0 12px;">Rappel de votre demande :</p>'
        f"{_detail_table(rows)}"
        '<p style="font-size:13px;color:#64748b;margin:16px 0 0;">Aucun paiement n\'est effectué en ligne '
        "lors d'une simple demande. Pour toute question, contactez ETS Laurent Mathieu.</p>"
    )
    send_email(to, subject, _layout("Mise à jour de votre demande", body))
