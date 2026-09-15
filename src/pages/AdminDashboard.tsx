import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import type { BookingRequest, BookingStatus } from '@/lib/types';
import { NEED_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS } from '@/lib/types';
import { AvailabilityCalendar } from '@/components/AvailabilityCalendar';
import type { CalendarBlock } from '@/lib/types';

type Tab = 'requests' | 'calendar';

export function AdminDashboard() {
  const { signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('requests');
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [blocks, setBlocks] = useState<CalendarBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all');
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null);

  const fetchRequests = useCallback(async () => {
    const { data } = await supabase
      .from('booking_requests')
      .select('*')
      .order('created_at', { ascending: false });
    setRequests(data || []);
  }, []);

  const fetchBlocks = useCallback(async () => {
    const { data } = await supabase
      .from('calendar_blocks')
      .select('*')
      .order('start_date', { ascending: true });
    setBlocks(data || []);
  }, []);

  useEffect(() => {
    Promise.all([fetchRequests(), fetchBlocks()]).then(() => setLoading(false));
  }, [fetchRequests, fetchBlocks]);

  const updateStatus = async (id: string, status: BookingStatus) => {
    await supabase.from('booking_requests').update({ status }).eq('id', id);

    const req = requests.find((r) => r.id === id);

    if (status === 'accepted' && req?.start_date) {
      const endDate = req.end_date || req.start_date;
      await supabase.from('calendar_blocks').insert({
        start_date: req.start_date,
        end_date: endDate,
        label: null,
        status: 'reserved',
      });
      await fetchBlocks();
    } else if (status !== 'accepted' && req?.start_date) {
      const endDate = req.end_date || req.start_date;
      await supabase.from('calendar_blocks')
        .delete()
        .eq('status', 'reserved')
        .eq('start_date', req.start_date)
        .eq('end_date', endDate);
      await fetchBlocks();
    }

    await fetchRequests();
    setSelectedRequest((prev) => (prev && prev.id === id ? { ...prev, status } : prev));

    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-status-update`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bookingId: id, status }),
    }).catch(() => {});
  };

  const updateNotes = async (id: string, admin_notes: string) => {
    await supabase.from('booking_requests').update({ admin_notes }).eq('id', id);
    await fetchRequests();
  };

  const deleteRequest = async (id: string) => {
    const req = requests.find((r) => r.id === id);
    if (req?.start_date) {
      const endDate = req.end_date || req.start_date;
      await supabase.from('calendar_blocks')
        .delete()
        .eq('status', 'reserved')
        .eq('start_date', req.start_date)
        .eq('end_date', endDate);
      await fetchBlocks();
    }
    await supabase.from('booking_requests').delete().eq('id', id);
    await fetchRequests();
    setSelectedRequest(null);
  };

  const filteredRequests = filter === 'all' ? requests : requests.filter((r) => r.status === filter);

  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    accepted: requests.filter((r) => r.status === 'accepted').length,
    refused: requests.filter((r) => r.status === 'refused').length,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container-page">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <span className="font-display font-bold text-lg text-slate-900">ETS Laurent Mathieu</span>
              <span className="px-2 py-0.5 rounded-md bg-brand-100 text-brand-700 text-xs font-semibold">Admin</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="/" className="text-sm text-slate-500 hover:text-brand-600 transition-colors">Voir le site</a>
              <button onClick={signOut} className="text-sm text-rose-600 hover:text-rose-700 font-medium transition-colors">
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
          >
            Demandes ({counts.all})
          </button>
          <button
            onClick={() => setTab('calendar')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'calendar' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
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
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>

            {filteredRequests.length === 0 ? (
              <div className="card p-12 text-center">
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
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="font-semibold text-slate-900">{req.name}</p>
                          <p className="text-sm text-slate-500">{NEED_TYPE_LABELS[req.need_type]} · {req.people_count} pers.</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[req.status]}`}>
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
                    <div className="card p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{selectedRequest.name}</h3>
                          <p className="text-sm text-slate-500">
                            {new Date(selectedRequest.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[selectedRequest.status]}`}>
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
                        />
                      </div>

                      <div className="flex flex-wrap gap-2 mt-4">
                        <button
                          onClick={() => updateStatus(selectedRequest.id, 'accepted')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedRequest.status === 'accepted' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'}`}
                        >
                          Accepter
                        </button>
                        <button
                          onClick={() => updateStatus(selectedRequest.id, 'refused')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedRequest.status === 'refused' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'}`}
                        >
                          Refuser
                        </button>
                        <button
                          onClick={() => updateStatus(selectedRequest.id, 'pending')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedRequest.status === 'pending' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'}`}
                        >
                          En attente
                        </button>
                        <button
                          onClick={() => deleteRequest(selectedRequest.id)}
                          className="px-4 py-2 rounded-lg text-sm font-medium text-slate-500 border border-slate-200 hover:bg-slate-100 transition-colors ml-auto"
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
            <AvailabilityCalendar adminMode blocks={blocks} onBlocksChange={fetchBlocks} />
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
