import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { CalendarBlock } from '@/lib/types';
import { AvailabilityCalendar } from '@/components/AvailabilityCalendar';

export function AvailabilitySection() {
  const [blocks, setBlocks] = useState<CalendarBlock[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBlocks = async () => {
    const { data } = await supabase
      .from('calendar_blocks')
      .select('*')
      .order('start_date', { ascending: true });
    setBlocks(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchBlocks();
  }, []);

  return (
    <section id="disponibilites" className="py-20 bg-slate-50">
      <div className="container-page">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold mb-4">
            Disponibilités
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 text-balance">
            Consultez le calendrier de l'espace
          </h2>
          <p className="text-slate-600">
            Les dates en vert sont a priori disponibles. Les dates en rouge sont déjà réservées ou indisponibles.
            Ce calendrier est mis à jour régulièrement par ETS Laurent Mathieu.
          </p>
        </div>

        <div className="max-w-2xl mx-auto card p-6 sm:p-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin w-8 h-8 text-brand-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : (
            <AvailabilityCalendar blocks={blocks} />
          )}
        </div>
      </div>
    </section>
  );
}
