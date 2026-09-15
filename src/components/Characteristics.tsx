const FEATURES = [
  {
    icon: 'M5 13l4 4L19 7',
    title: 'Électricité et éclairage',
    desc: 'Prises électriques disponibles, éclairage intérieur adapté pour travailler confortablement.',
  },
  {
    icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    title: 'Chauffage et isolation',
    desc: 'Algéco fixe isolé et chauffé, utilisable confortablement en toute saison.',
  },
  {
    icon: 'M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0',
    title: 'Accès Internet Wi-Fi',
    desc: 'Connexion Wi-Fi disponible pour vos réunions et besoins professionnels.',
  },
  {
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    title: 'Mobilier inclus',
    desc: 'Tables et chaises disponibles, configuration adaptable selon votre besoin.',
  },
  {
    icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
    title: 'Espace de stockage',
    desc: 'Possibilité de laisser du matériel temporairement selon les arrangements convenus.',
  },
  {
    icon: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14',
    title: 'Accès et parking',
    desc: 'Accès facile depuis la route de Lyon, stationnement à proximité immédiate.',
  },
];

export function Characteristics() {
  return (
    <section id="caracteristiques" className="py-20 bg-slate-50">
      <div className="container-page">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold mb-4">
            Équipements
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 text-balance">
            Caractéristiques et équipements de l'espace
          </h2>
          <p className="text-slate-600">
            Un espace fonctionnel et équipé pour répondre à vos besoins ponctuels.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="card p-6 hover:shadow-md transition-all hover:-translate-y-1 duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.icon} />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
