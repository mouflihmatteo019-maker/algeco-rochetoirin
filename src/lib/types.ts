export type BookingStatus = 'pending' | 'accepted' | 'refused';

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
  admin_notes: string | null;
  created_at: string;
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
  pending: 'En attente',
  accepted: 'Acceptée',
  refused: 'Refusée',
};

export const STATUS_COLORS: Record<BookingStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  accepted: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  refused: 'bg-rose-100 text-rose-800 border-rose-200',
};
