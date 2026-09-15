import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { NeedType } from '@/lib/types';
import { NEED_TYPE_LABELS } from '@/lib/types';

export function BookingForm() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    start_date: '',
    end_date: '',
    start_time: '09:00',
    end_time: '17:00',
    need_type: 'reunion' as NeedType,
    people_count: '',
    name: '',
    phone: '',
    email: '',
    message: '',
  });

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const formatDateFR = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.start_date || !form.name || !form.phone || !form.email || !form.people_count) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const endDate = form.end_date || form.start_date;
    const dateRange = form.start_date === endDate
      ? formatDateFR(form.start_date)
      : `Du ${formatDateFR(form.start_date)} au ${formatDateFR(endDate)}`;

    setSubmitting(true);
    const bookingId = crypto.randomUUID();
    const { error: insertError } = await supabase.from('booking_requests').insert({
      id: bookingId,
      requested_dates: dateRange,
      start_date: form.start_date,
      end_date: endDate,
      start_time: form.start_time,
      end_time: form.end_time,
      need_type: form.need_type,
      people_count: parseInt(form.people_count, 10),
      name: form.name,
      phone: form.phone,
      email: form.email,
      message: form.message || null,
    });

    setSubmitting(false);

    if (insertError) {
      setError('Une erreur est survenue lors de l\'envoi de votre demande. Veuillez réessayer.');
      return;
    }

    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-booking-notification`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bookingId }),
    }).catch(() => {});

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="card p-8 text-center animate-fade-in">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Demande envoyée !</h3>
        <p className="text-slate-600 max-w-md mx-auto">
          Votre demande de réservation a bien été transmise à ETS Laurent Mathieu.
          Vous serez recontacté(e) pour confirmation selon les disponibilités.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setForm({ start_date: '', end_date: '', start_time: '09:00', end_time: '17:00', need_type: 'reunion', people_count: '', name: '', phone: '', email: '', message: '' });
          }}
          className="btn-secondary mt-6"
        >
          Faire une nouvelle demande
        </button>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="card p-6 sm:p-8">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label-field">Date d'arrivée <span className="text-rose-500">*</span></label>
            <input
              type="date"
              value={form.start_date}
              min={todayStr}
              onChange={(e) => handleChange('start_date', e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="label-field">Date de départ</label>
            <input
              type="date"
              value={form.end_date}
              min={form.start_date || todayStr}
              onChange={(e) => handleChange('end_date', e.target.value)}
              className="input-field"
            />
            <p className="text-xs text-slate-400 mt-1">Laissez vide si c'est pour une seule journée</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-field">Heure d'arrivée <span className="text-rose-500">*</span></label>
            <input
              type="time"
              value={form.start_time}
              onChange={(e) => handleChange('start_time', e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="label-field">Heure de départ <span className="text-rose-500">*</span></label>
            <input
              type="time"
              value={form.end_time}
              onChange={(e) => handleChange('end_time', e.target.value)}
              className="input-field"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-field">Type de besoin</label>
            <select
              value={form.need_type}
              onChange={(e) => handleChange('need_type', e.target.value)}
              className="input-field"
            >
              {Object.entries(NEED_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field">Nb de personnes <span className="text-rose-500">*</span></label>
            <input
              type="number"
              min="1"
              max="50"
              value={form.people_count}
              onChange={(e) => handleChange('people_count', e.target.value)}
              placeholder="Ex : 12"
              className="input-field"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-field">Nom <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Votre nom"
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="label-field">Téléphone <span className="text-rose-500">*</span></label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="06 12 34 56 78"
              className="input-field"
              required
            />
          </div>
        </div>

        <div>
          <label className="label-field">Email <span className="text-rose-500">*</span></label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="vous@exemple.fr"
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="label-field">Message (optionnel)</label>
          <textarea
            value={form.message}
            onChange={(e) => handleChange('message', e.target.value)}
            rows={3}
            placeholder="Questions, contraintes particulières..."
            className="input-field resize-none"
          />
        </div>
      </div>

      <div className="mt-5 p-4 rounded-xl bg-amber-50 border border-amber-200">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-amber-800 font-medium">
            Cette demande ne constitue pas une réservation définitive. Elle sera étudiée et validée par ETS Laurent Mathieu selon les disponibilités.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="btn-primary w-full mt-5"
      >
        {submitting ? (
          <>
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Envoi en cours...
          </>
        ) : (
          'Envoyer ma demande'
        )}
      </button>
    </form>
  );
}
