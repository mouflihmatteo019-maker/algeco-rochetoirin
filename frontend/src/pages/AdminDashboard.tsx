import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiGet, apiPatch } from '@/lib/api';
import { useAuth } from '@/lib/session';
import type { BookingRequest, BookingStatus, CalendarBlock } from '@/lib/types';
import {
  NEED_TYPE_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  formatDateTimeFr,
  formatEur,
} from '@/lib/types';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';

type Tab = 'requests' | 'calendar';

const FILTERS: { key: BookingStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'nouvelle', label: 'Nouvelles' },
  { key: 'a_valider', label: 'À valider' },
  { key: 'en_attente_acompte', label: "En attente d'acompte" },
  { key: 'confirmee', label: 'Confirmées' },
  { key: 'refusee', label: 'Refusées' },
  { key: 'expiree', label: 'Expirées' },
  { key: 'annulee', label: 'Annulées' },
];

const DEFAULT_DEPOSIT = 150;

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('requests');
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all');
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null);
  const [depositInput, setDepositInput] = useState<string>(String(DEFAULT_DEPOSIT));
  const [copied, setCopied] = useState(false);

  const requestsQuery = useQuery({
    queryKey: ['bookings'],
    queryFn: () => apiGet<BookingRequest[]>('/bookings'),
  });
  const blocksQuery = useQuery({
    queryKey: ['calendar'],
    queryFn: () => apiGet<CalendarBlock[]>('/calendar'),
  });

  const requests = requestsQuery.data ?? [];
  const blocks = blocksQuery.data ?? [];
  const loading = requestsQuery.isPending || blocksQuery.isPending;

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
    queryClient.invalidateQueries({ queryKey: ['calendar'] });
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, deposit_amount_eur }: { id: string; status: BookingStatus; deposit_amount_eur?: number }) =>
      apiPatch<BookingRequest>(`/bookings/${id}/status`, { status, deposit_amount_eur }),
    onSuccess: (updated) => {
      refreshAll();
      setSelectedRequest((prev) => (prev && prev.id === updated.id ? updated : prev));
      setCopied(false);
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: ({ id, admin_notes }: { id: string; admin_notes: string }) =>
      apiPatch<BookingRequest>(`/bookings/${id}/notes`, { admin_notes }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
  });

  const deleteRequestMutation = useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/bookings/${id}`),
    onSuccess: () => {
      refreshAll();
      setSelectedRequest(null);
    },
  });

  const changeStatus = (id: string, status: BookingStatus, deposit_amount_eur?: number) =>
    updateStatusMutation.mutate({ id, status, deposit_amount_eur });

  const updateNotes = (id: string, admin_notes: string) => {
    const req = requests.find((r) => r.id === id);
    if (req && (req.admin_notes ?? '') === admin_notes) return;
    updateNotesMutation.mutate({ id, admin_notes });
  };

  const deleteRequest = (id: string) => deleteRequestMutation.mutate(id);

  const paymentLink = (req: BookingRequest) => `${window.location.origin}/paiement/${req.id}`;

  const copyPaymentLink = (req: BookingRequest) => {
    navigator.clipboard?.writeText(paymentLink(req)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const filteredRequests = filter === 'all' ? requests : requests.filter((r) => r.status === filter);

  const counts = FILTERS.reduce(
    (acc, f) => {
      acc[f.key] = f.key === 'all' ? requests.length : requests.filter((r) => r.status === f.key).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  const canAccept = (s: BookingStatus) =>
    ['nouvelle', 'a_valider', 'refusee', 'expiree', 'annulee'].includes(s);
  const canRefuse = (s: BookingStatus) =>
    ['nouvelle', 'a_valider', 'en_attente_acompte'].includes(s);
  const canCancel = (s: BookingStatus) => ['en_attente_acompte', 'confirmee'].includes(s);

  const acceptAmount = parseFloat(depositInput.replace(',', '.'));

  const acceptBlock = (req: BookingRequest) => (
    <div className="mt-4 p-4 rounded-xl bg-brand-50 border border-brand-200">
      <p className="text-sm font-semibold text-brand-800 mb-2">
        {req.status === 'en_attente_acompte' || req.status === 'confirmee'
          ? null
          : 'Accepter la demande — envoyer le lien de paiement'}
      </p>
      <label className="label-field">Montant de l'acompte (€)</label>
      <div className="flex gap-2">
        <input
          type="number"
          min="0"
          step="10"
          value={depositInput}
          onChange={(e) => setDepositInput(e.target.value)}
          className="input-field max-w-[140px]"
          data-testid="admin-deposit-amount-input"
        />
        <button
          onClick={() => changeStatus(req.id, 'en_attente_acompte', acceptAmount)}
          disabled={updateStatusMutation.isPending || !(acceptAmount > 0)}
          className="btn-primary text-sm flex-1"
          data-testid="admin-accept-with-deposit-button"
        >
          {updateStatusMutation.isPending
            ? 'Envoi...'
            : `Accepter — acompte ${formatEur(acceptAmount)} (option 24h)`}
        </button>
      </div>
      <p className="text-xs text-brand-700/80 mt-2">
        Le créneau est bloqué 24h et le client reçoit un email avec le lien de paiement sécurisé.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50" data-testid="admin-dashboard">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container-page">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <span className="font-display font-bold text-lg text-slate-900">ETS Laurent Mathieu</span>
              <span className="px-2 py-0.5 rounded-md bg-brand-100 text-brand-700 text-xs font-semibold">Admin</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="/" className="text-sm text-slate-500 hover:text-brand-600 transition-colors" data-testid="admin-view-site-link">Voir le site</a>
              <button onClick={signOut} className="text-sm text-rose-600 hover:text-rose-700 font-medium transition-colors" data-testid="admin-logout-button">
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container-page py-8">
        <div className="flex gap-1 mb-6 border-b border-slate-200">
          <button
            onClick={() => setTab('requests')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'requests' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            data-testid="admin-tab-requests-button"
          >
            Demandes ({counts.all ?? 0})
          </button>
          <button
            onClick={() => setTab('calendar')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'calendar' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            data-testid="admin-tab-calendar-button"
          >
            Calendrier
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin w-8 h-8 text-brand-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : tab === 'requests' ? (
          <div>
            <div className="flex flex-wrap gap-2 mb-6">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f.key ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  data-testid={`admin-filter-button-${f.key}`}
                >
                  {f.label} ({counts[f.key] ?? 0})
                </button>
              ))}
            </div>

            {filteredRequests.length === 0 ? (
              <div className="card p-12 text-center" data-testid="admin-empty-state">
                <p className="text-slate-500">Aucune demande à afficher.</p>
              </div>
            ) : (
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  {filteredRequests.map((req) => (
                    <button
                      key={req.id}
                      onClick={() => {
                        setSelectedRequest(req);
                        if (req.deposit_amount_eur) setDepositInput(String(req.deposit_amount_eur));
                      }}
                      className={`w-full text-left card p-4 transition-all hover:shadow-md ${selectedRequest?.id === req.id ? 'ring-2 ring-brand-500' : ''}`}
                      data-testid={`admin-request-card-${req.id}`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="font-semibold text-slate-900">{req.name}</p>
                          <p className="text-sm text-slate-500">{NEED_TYPE_LABELS[req.need_type]} · {req.people_count} pers.</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[req.status]}`} data-testid={`admin-request-status-badge-${req.id}`}>
                          {STATUS_LABELS[req.status]}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600 space-y-0.5">
                        <p><span className="text-slate-400">Dates :</span> {req.requested_dates}</p>
                        <p><span className="text-slate-400">Horaires :</span> {req.start_time} — {req.end_time}</p>
                        <p><span className="text-slate-400">Contact :</span> {req.phone} · {req.email}</p>
                        {req.deposit_amount_eur != null && (
                          <p><span className="text-slate-400">Acompte :</span> {formatEur(req.deposit_amount_eur)}</p>
                        )}
                        {req.status === 'en_attente_acompte' && req.option_expires_at && (
                          <p className="text-amber-700 font-medium">
                            Option jusqu'au {formatDateTimeFr(req.option_expires_at)}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        {new Date(req.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="lg:sticky lg:top-24 h-fit">
                  {selectedRequest ? (
                    <div className="card p-6" data-testid="admin-request-detail-panel">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{selectedRequest.name}</h3>
                          <p className="text-sm text-slate-500">
                            {new Date(selectedRequest.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[selectedRequest.status]}`} data-testid="admin-detail-status-badge">
                          {STATUS_LABELS[selectedRequest.status]}
                        </span>
                      </div>

                      <div className="space-y-3 text-sm border-t border-slate-100 pt-4">
                        <DetailRow label="Dates souhaitées" value={selectedRequest.requested_dates} />
                        <DetailRow label="Heure de début" value={selectedRequest.start_time} />
                        <DetailRow label="Heure de fin" value={selectedRequest.end_time} />
                        <DetailRow label="Type de besoin" value={NEED_TYPE_LABELS[selectedRequest.need_type]} />
                        <DetailRow label="Nombre de personnes" value={String(selectedRequest.people_count)} />
                        <DetailRow label="Téléphone" value={selectedRequest.phone} />
                        <DetailRow label="Email" value={selectedRequest.email} />
                        <DetailRow label="Acompte" value={formatEur(selectedRequest.deposit_amount_eur)} />
                        {selectedRequest.paid_at && (
                          <DetailRow label="Acompte payé le" value={formatDateTimeFr(selectedRequest.paid_at)} />
                        )}
                        {selectedRequest.status === 'en_attente_acompte' && selectedRequest.option_expires_at && (
                          <DetailRow label="Option (24h) jusqu'au" value={formatDateTimeFr(selectedRequest.option_expires_at)} />
                        )}
                        {selectedRequest.message && (
                          <div>
                            <p className="text-slate-400 text-xs mb-1">Message</p>
                            <p className="text-slate-700 whitespace-pre-wrap p-3 rounded-lg bg-slate-50 border border-slate-100">{selectedRequest.message}</p>
                          </div>
                        )}
                      </div>

                      {selectedRequest.status === 'en_attente_acompte' && (
                        <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
                          <p className="text-sm font-medium text-amber-800">
                            Option en cours — créneau bloqué jusqu'au {formatDateTimeFr(selectedRequest.option_expires_at)}.
                            Passé ce délai, l'option expirera automatiquement et le créneau sera libéré.
                          </p>
                          <p className="text-xs text-slate-500 mt-2 mb-1">Lien de paiement du client :</p>
                          <div className="flex gap-2">
                            <code className="flex-1 text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 truncate" data-testid="admin-payment-link">
                              {paymentLink(selectedRequest)}
                            </code>
                            <button
                              onClick={() => copyPaymentLink(selectedRequest)}
                              className="btn-secondary text-xs whitespace-nowrap"
                              data-testid="admin-copy-payment-link-button"
                            >
                              {copied ? 'Copié !' : 'Copier'}
                            </button>
                          </div>
                        </div>
                      )}

                      {selectedRequest.status === 'confirmee' && (
                        <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                          <p className="text-sm font-medium text-emerald-800" data-testid="admin-confirmed-info">
                            Acompte reçu{selectedRequest.paid_at ? ` le ${formatDateTimeFr(selectedRequest.paid_at)}` : ''} —
                            réservation confirmée, créneau indisponible dans le calendrier.
                          </p>
                        </div>
                      )}

                      {canAccept(selectedRequest.status) && acceptBlock(selectedRequest)}

                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <label className="label-field">Notes internes</label>
                        <textarea
                          defaultValue={selectedRequest.admin_notes || ''}
                          onBlur={(e) => updateNotes(selectedRequest.id, e.target.value)}
                          rows={2}
                          placeholder="Notes pour usage interne..."
                          className="input-field resize-none"
                          data-testid="admin-notes-textarea"
                        />
                      </div>

                      <div className="flex flex-wrap gap-2 mt-4">
                        {selectedRequest.status === 'nouvelle' && (
                          <button
                            onClick={() => changeStatus(selectedRequest.id, 'a_valider')}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                            data-testid="admin-mark-review-button"
                          >
                            À valider
                          </button>
                        )}
                        {selectedRequest.status === 'en_attente_acompte' && (
                          <button
                            onClick={() => changeStatus(selectedRequest.id, 'confirmee')}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                            data-testid="admin-confirm-manual-button"
                          >
                            Confirmer (paiement reçu hors ligne)
                          </button>
                        )}
                        {canRefuse(selectedRequest.status) && (
                          <button
                            onClick={() => changeStatus(selectedRequest.id, 'refusee')}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
                            data-testid="admin-refuse-button"
                          >
                            Refuser
                          </button>
                        )}
                        {canCancel(selectedRequest.status) && (
                          <button
                            onClick={() => changeStatus(selectedRequest.id, 'annulee')}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition-colors"
                            data-testid="admin-cancel-button"
                          >
                            Annuler
                          </button>
                        )}
                        <button
                          onClick={() => deleteRequest(selectedRequest.id)}
                          className="px-4 py-2 rounded-lg text-sm font-medium text-slate-500 border border-slate-200 hover:bg-slate-100 transition-colors ml-auto"
                          data-testid="admin-delete-request-button"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="card p-12 text-center">
                      <p className="text-slate-400">Sélectionnez une demande pour voir les détails.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto card p-6 sm:p-8">
            <AvailabilityCalendar adminMode blocks={blocks} onBlocksChange={refreshAll} />
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-slate-400 text-xs w-32 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-slate-700">{value}</span>
    </div>
  );
}
