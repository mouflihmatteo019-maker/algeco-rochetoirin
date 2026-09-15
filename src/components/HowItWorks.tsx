const STEPS = [
  {
    num: '1',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    title: 'Consultez les disponibilités',
    desc: 'Regardez le calendrier pour identifier les dates encore libres. Les dates en vert sont disponibles.',
  },
  {
    num: '2',
    icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    title: 'Envoyez votre demande',
    desc: 'Remplissez le formulaire de réservation avec vos dates, horaires et coordonnées. Aucun paiement en ligne.',
  },
  {
    num: '3',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.623 5.176-1.333 9-6.032 9-11.623 0-1.063-.138-2.095-.388-3.066z',
    title: 'Validation par ETS Laurent Mathieu',
    desc: 'Votre demande est étudiée. Vous êtes recontacté(e) pour confirmation selon les disponibilités.',
  },
];

export function HowItWorks() {
  return (
    <section id="etapes" className="py-20 bg-white">
      <div className="container-page">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold mb-4">
            Comment ça marche
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 text-balance">
            Louer en 3 étapes
          </h2>
          <p className="text-slate-600">
            Un processus simple et transparent, sans paiement en ligne ni réservation automatique.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 lg:gap-8 relative">
          {STEPS.map((step, i) => (
            <div key={i} className="relative">
              {i < STEPS.length - 1 && (
                <div className="hidden sm:block absolute top-12 left-[60%] w-full h-0.5 bg-gradient-to-r from-brand-200 to-transparent" />
              )}
              <div className="card p-6 text-center relative z-10 hover:shadow-md transition-all hover:-translate-y-1 duration-300">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full bg-brand-600 text-white flex items-center justify-center text-xl font-bold">
                    {step.num}
                  </div>
                </div>
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-brand-50 flex items-center justify-center">
                  <svg className="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={step.icon} />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <a href="#reservation" className="btn-primary">
            Commencer ma demande
          </a>
        </div>
      </div>
    </section>
  );
}
