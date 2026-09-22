// Mirror of backend/models/booking.py — keep the two in sync in the same edit.
export type BookingStatus =
  | 'nouvelle'
  | 'a_valider'
  | 'en_attente_acompte'
  | 'confirmee'
  | 'refusee'
  | 'expiree'
  | 'annulee';

export type NeedType =
  | 'reunion'
  | 'association'
  | 'evenement'
  | 'professionnel'
  | 'autre';

export interface BookingRequest {
  id: string;
  requested_dates: string;
  start_date: string | null;
  end_date: string | null;
  start_time: string;
  end_time: string;
  need_type: NeedType;
  people_count: number;
  name: string;
  phone: string;
  email: string;
  message: string | null;
  status: BookingStatus;
  deposit_amount_eur: number | null;
  option_expires_at: string | null;
  paid_at: string | null;
  admin_notes: string | null;
  created_at: string;
}

export interface PaymentInfo {
  booking_id: string;
  requested_dates: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  deposit_amount_eur: number | null;
  option_expires_at: string | null;
}

export interface CalendarBlock {
  id: string;
  start_date: string;
  end_date: string;
  label: string | null;
  status: 'blocked' | 'reserved';
  created_at: string;
}

export const NEED_TYPE_LABELS: Record<NeedType, string> = {
  reunion: 'Réunion',
  association: 'Association',
  evenement: 'Événement local',
  professionnel: 'Besoin professionnel',
  autre: 'Autre',
};

export const STATUS_LABELS: Record<BookingStatus, string> = {
  nouvelle: 'Nouvelle demande',
  a_valider: 'À valider',
  en_attente_acompte: "En attente d'acompte",
  confirmee: 'Confirmée',
  refusee: 'Refusée',
  expiree: 'Expirée',
  annulee: 'Annulée',
};

export const STATUS_COLORS: Record<BookingStatus, string> = {
  nouvelle: 'bg-sky-100 text-sky-800 border-sky-200',
  a_valider: 'bg-blue-100 text-blue-800 border-blue-200',
  en_attente_acompte: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmee: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  refusee: 'bg-rose-100 text-rose-800 border-rose-200',
  expiree: 'bg-slate-100 text-slate-600 border-slate-200',
  annulee: 'bg-slate-100 text-slate-500 border-slate-200',
};

export const formatEur = (amount: number | null | undefined): string =>
  amount == null
    ? '—'
    : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

export const formatDateTimeFr = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
