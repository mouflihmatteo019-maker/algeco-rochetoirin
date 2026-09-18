import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiPost } from '@/lib/api';
import type { CalendarBlock } from '@/lib/types';

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

interface AvailabilityCalendarProps {
  adminMode?: boolean;
  blocks: CalendarBlock[];
  onBlocksChange?: () => void;
}

export default function AvailabilityCalendar({ adminMode = false, blocks, onBlocksChange }: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [newBlockStart, setNewBlockStart] = useState('');
  const [newBlockEnd, setNewBlockEnd] = useState('');
  const [newBlockLabel, setNewBlockLabel] = useState('');
  const queryClient = useQueryClient();

  const refreshBlocks = () => {
    queryClient.invalidateQueries({ queryKey: ['calendar'] });
    onBlocksChange?.();
  };

  const addBlockMutation = useMutation({
    mutationFn: (payload: { start_date: string; end_date: string; label: string | null }) =>
      apiPost<CalendarBlock>('/calendar', payload),
    onSuccess: () => {
      setShowAddBlock(false);
      setNewBlockStart('');
      setNewBlockEnd('');
      setNewBlockLabel('');
      refreshBlocks();
    },
  });

  const deleteBlockMutation = useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/calendar/${id}`),
    onSuccess: () => refreshBlocks(),
  });

  const blockedDates = useMemo(() => {
    const map = new Map<string, CalendarBlock>();
    blocks.forEach((b) => {
      const start = new Date(b.start_date + 'T00:00:00');
      const end = new Date(b.end_date + 'T00:00:00');
      const cur = new Date(start);
      while (cur <= end) {
        map.set(formatDateKey(cur), b);
        cur.setDate(cur.getDate() + 1);
      }
    });
    return map;
  }, [blocks]);

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];
    const startOffset = (firstDay.getDay() + 6) % 7;
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  }, [currentMonth]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const handleAddBlock = () => {
    if (!newBlockStart) return;
    const end = !newBlockEnd || newBlockEnd < newBlockStart ? newBlockStart : newBlockEnd;
    addBlockMutation.mutate({ start_date: newBlockStart, end_date: end, label: newBlockLabel || null });
  };

  const handleDeleteBlock = (id: string) => {
    deleteBlockMutation.mutate(id);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900" data-testid="calendar-month-label">
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            {adminMode ? 'Gérez les dates indisponibles' : "Consultez les disponibilités de l'espace"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors" aria-label="Mois précédent" data-testid="calendar-prev-month-button">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={nextMonth} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors" aria-label="Mois suivant" data-testid="calendar-next-month-button">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-slate-400 py-2">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map((date, i) => {
          if (!date) return <div key={i} />;
          const key = formatDateKey(date);
          const block = blockedDates.get(key);
          const isPast = date < today;
          const isToday = formatDateKey(date) === formatDateKey(today);

          return (
            <div
              key={i}
              data-testid={`calendar-day-${key}`}
              data-blocked={block ? 'true' : 'false'}
              className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all
                ${block ? 'bg-rose-50 border border-rose-200 text-rose-700' : isPast ? 'bg-slate-50 text-slate-300' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}
                ${isToday ? 'ring-2 ring-brand-500 ring-offset-1' : ''}
              `}
            >
              <span className="font-medium">{date.getDate()}</span>
              {block && (
                <span className="text-[10px] leading-none mt-0.5 px-1 truncate max-w-full">
                  {block.status === 'reserved' ? 'Réservé' : (block.label || 'Indispo.')}
                </span>
              )}
              {!block && !isPast && (
                <span className="text-[10px] leading-none mt-0.5 text-emerald-600">Libre</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-4 text-xs text-slate-500 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-50 border border-emerald-200"></span>
          Disponible
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-rose-50 border border-rose-200"></span>
          Indisponible
        </div>
      </div>

      {adminMode && (
        <div className="mt-6 border-t border-slate-200 pt-4">
          {!showAddBlock ? (
            <button onClick={() => setShowAddBlock(true)} className="btn-primary text-xs" data-testid="admin-block-dates-button">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Bloquer des dates
            </button>
          ) : (
            <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="label-field">Date de début</label>
                  <input type="date" value={newBlockStart} onChange={(e) => setNewBlockStart(e.target.value)} className="input-field" data-testid="admin-block-start-input" />
                </div>
                <div>
                  <label className="label-field">Date de fin</label>
                  <input type="date" value={newBlockEnd} onChange={(e) => setNewBlockEnd(e.target.value)} className="input-field" data-testid="admin-block-end-input" />
                </div>
                <div>
                  <label className="label-field">Libellé (optionnel)</label>
                  <input type="text" value={newBlockLabel} onChange={(e) => setNewBlockLabel(e.target.value)} placeholder="Maintenance, Congé..." className="input-field" data-testid="admin-block-label-input" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddBlock} disabled={addBlockMutation.isPending || !newBlockStart} className="btn-primary text-xs" data-testid="admin-block-confirm-button">
                  {addBlockMutation.isPending ? 'Enregistrement...' : 'Confirmer'}
                </button>
                <button onClick={() => setShowAddBlock(false)} className="btn-secondary text-xs" data-testid="admin-block-cancel-button">Annuler</button>
              </div>
            </div>
          )}

          {blocks.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold text-slate-700">Périodes bloquées :</p>
              {blocks.filter((b) => b.status === 'blocked').map((b) => (
                <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-rose-50 border border-rose-200" data-testid={`admin-blocked-period-${b.id}`}>
                  <div className="text-sm">
                    <span className="font-medium text-slate-800">
                      {new Date(b.start_date + 'T00:00:00').toLocaleDateString('fr-FR')} — {new Date(b.end_date + 'T00:00:00').toLocaleDateString('fr-FR')}
                    </span>
                    {b.label && <span className="text-slate-500 ml-2">({b.label})</span>}
                  </div>
                  <button onClick={() => handleDeleteBlock(b.id)} className="text-rose-600 hover:text-rose-800 text-sm font-medium" data-testid={`admin-block-delete-button-${b.id}`}>
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
