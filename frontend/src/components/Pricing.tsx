const PRICING = [
  { duration: '2 heures', price: '50 €' },
  { duration: 'Demi-Journée (4 heures)', price: '90 €' },
  { duration: 'Journée (8 heures)', price: '150 €' },
  { duration: 'Soirée', price: '120 €' },
  { duration: 'Journée + soirée', price: '199 €' },
  { duration: 'Week-end', price: '329 €' },
];

export default function Pricing() {
  return (
    <section id="tarifs" className="py-20 bg-slate-50">
      <div className="container-page">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold mb-4">
            Tarifs
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 text-balance">
            Des tarifs simples et transparents
          </h2>
          <p className="text-slate-600">
            Une grille claire, adaptée aux besoins ponctuels : quelques heures, une journée,
            une soirée ou un week-end.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PRICING.map((p, i) => (
            <div
              key={i}
              className="card p-6 text-center hover:shadow-md transition-all hover:-translate-y-1 duration-300"
              data-testid={`pricing-card-${i}`}
            >
              <div className="w-12 h-12 mx-auto rounded-xl bg-brand-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-900">{p.duration}</h3>
              <p className="text-3xl font-bold text-brand-600 mt-2">{p.price}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-slate-500 mt-8 max-w-2xl mx-auto">
          Aucun paiement en ligne lors de la demande : un acompte peut être demandé par
          ETS Laurent Mathieu à l'acceptation de votre réservation.
        </p>
      </div>
    </section>
  );
}
