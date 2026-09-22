"""Pydantic models — booking requests with deposit flow (acompte via Stripe).

Statuts : nouvelle / a_valider / en_attente_acompte / confirmee / refusee / expiree / annulee
Mirrored in frontend/src/lib/types.ts — keep the two in sync in the same edit.
"""
from datetime import datetime, timezone
from typing import Literal, Optional
from uuid import uuid4

from pydantic import BaseModel, EmailStr, Field

NeedType = Literal["reunion", "association", "evenement", "professionnel", "autre"]
BookingStatus = Literal[
    "nouvelle",
    "a_valider",
    "en_attente_acompte",
    "confirmee",
    "refusee",
    "expiree",
    "annulee",
]
BlockStatus = Literal["blocked", "reserved"]


def _aware_utc_now() -> datetime:
    # Store aware UTC so Pydantic serialises with the offset and JS Date() parses it.
    return datetime.now(timezone.utc)


class BookingRequestCreate(BaseModel):
    start_date: str = Field(min_length=10, max_length=10)  # YYYY-MM-DD
    end_date: Optional[str] = None  # null → single day
    start_time: str = "09:00"
    end_time: str = "17:00"
    need_type: NeedType = "reunion"
    people_count: int = Field(ge=1, le=50)
    name: str = Field(min_length=1, max_length=120)
    phone: str = Field(min_length=1, max_length=40)
    email: EmailStr
    message: Optional[str] = Field(default=None, max_length=2000)


class BookingRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    requested_dates: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    start_time: str
    end_time: str
    need_type: NeedType
    people_count: int
    name: str
    phone: str
    email: str
    message: Optional[str] = None
    status: BookingStatus = "nouvelle"
    deposit_amount_eur: Optional[float] = None
    option_expires_at: Optional[datetime] = None  # 24h après acceptation
    paid_at: Optional[datetime] = None
    admin_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=_aware_utc_now)


class BookingStatusUpdate(BaseModel):
    status: BookingStatus
    deposit_amount_eur: Optional[float] = Field(default=None, ge=0, le=10000)


class AdminNotesUpdate(BaseModel):
    admin_notes: str = ""


class PaymentInfo(BaseModel):
    """Vue publique minimale d'une réservation pour la page de paiement."""

    booking_id: str
    requested_dates: str
    start_time: str
    end_time: str
    status: BookingStatus
    deposit_amount_eur: Optional[float] = None
    option_expires_at: Optional[datetime] = None


class CalendarBlockCreate(BaseModel):
    start_date: str = Field(min_length=10, max_length=10)
    end_date: Optional[str] = None
    label: Optional[str] = Field(default=None, max_length=120)
    status: BlockStatus = "blocked"


class CalendarBlock(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    start_date: str
    end_date: str
    label: Optional[str] = None
    status: BlockStatus = "blocked"
    created_at: datetime = Field(default_factory=_aware_utc_now)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class MeResponse(BaseModel):
    authenticated: bool
    email: Optional[str] = None
