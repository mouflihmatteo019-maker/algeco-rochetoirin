import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiGet, apiPatch } from '@/lib/api';
import { useAuth } from '@/lib/session';
import type { BookingRequest, BookingStatus, CalendarBlock } from '@/lib/types';
import { NEED_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS } from '@/lib/types';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';

type Tab = 'requests' | 'calendar';

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('requests');
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all');
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null);

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
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) =>
      apiPatch<BookingRequest>(`/bookings/${id}/status`, { status }),
    onSuccess: (updated) => {
      refreshAll();
      setSelectedRequest((prev) => (prev && prev.id === updated.id ? updated : prev));
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

  const updateStatus = (id: string, status: BookingStatus) =>
    updateStatusMutation.mutate({ id, status });

  const updateNotes = (id: string, admin_notes: string) => {
    const req = requests.find((r) => r.id === id);
    if (req && (req.admin_notes ?? '') === admin_notes) return;
    updateNotesMutation.mutate({ id, admin_notes });
  };

  const deleteRequest = (id: string) => deleteRequestMutation.mutate(id);

  const filteredRequests = filter === 'all' ? requests : requests.filter((r) => r.status === filter);

  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    accepted: requests.filter((r) => r.status === 'accepted').length,
    refused: requests.filter((r) => r.status === 'refused').length,
  };

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
            Demandes ({counts.all})
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
              {([
                { key: 'all', label: 'Toutes', count: counts.all },
                { key: 'pending', label: 'En attente', count: counts.pending },
                { key: 'accepted', label: 'Acceptées', count: counts.accepted },
                { key: 'refused', label: 'Refusées', count: counts.refused },
              ] as const).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f.key ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  data-testid={`admin-filter-button-${f.key}`}
                >
                  {f.label} ({f.count})
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
                      onClick={() => setSelectedRequest(req)}
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
                        {selectedRequest.message && (
                          <div>
                            <p className="text-slate-400 text-xs mb-1">Message</p>
                            <p className="text-slate-700 whitespace-pre-wrap p-3 rounded-lg bg-slate-50 border border-slate-100">{selectedRequest.message}</p>
                          </div>
                        )}
                      </div>

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
                        <button
                          onClick={() => updateStatus(selectedRequest.id, 'accepted')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedRequest.status === 'accepted' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'}`}
                          data-testid="admin-accept-button"
                        >
                          Accepter
                        </button>
                        <button
                          onClick={() => updateStatus(selectedRequest.id, 'refused')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedRequest.status === 'refused' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'}`}
                          data-testid="admin-refuse-button"
                        >
                          Refuser
                        </button>
                        <button
                          onClick={() => updateStatus(selectedRequest.id, 'pending')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedRequest.status === 'pending' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'}`}
                          data-testid="admin-pending-button"
                        >
                          En attente
                        </button>
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
