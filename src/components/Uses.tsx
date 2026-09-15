const USES = [
  {
    icon: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 11-8 0 4 4 0 018 0zm6 0a4 4 0 11-8 0 4 4 0 018 0z',
    title: 'Réunions',
    desc: 'Réunions d\'équipe, comités, rendez-vous clients dans un cadre neutre et pratique.',
  },
  {
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m4-4h1m-1 4h1',
    title: 'Associations',
    desc: 'Assemblées générales, ateliers, permanences, activités associatives locales.',
  },
  {
    icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16v4m-2-2h4m-4 14v4m-2-2h4M21 3v4m-2-2h4',
    title: 'Événements locaux',
    desc: 'Petits événements de proximité : expositions, formations, soirées de quartier.',
  },
  {
    icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    title: 'Besoins professionnels',
    desc: 'Bureau temporaire, base chantier, poste de travail déporté, stockage de matériel.',
  },
  {
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    title: 'Formations et ateliers',
    desc: 'Sessions de formation, ateliers pratiques, coaching en petit comité.',
  },
  {
    icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z M3 7l2-2h14l2 2',
    title: 'Ponctuel et flexible',
    desc: 'Quelques heures, une journée, une semaine — la location s\'adapte à votre besoin.',
  },
];

export function Uses() {
  return (
    <section id="usages" className="py-20 bg-white">
      <div className="container-page">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold mb-4">
            Usages possibles
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 text-balance">
            Un espace pensé pour les besoins ponctuels
          </h2>
          <p className="text-slate-600">
            L'Algéco fixe de Rochetoirin convient à de nombreux usages de petite et moyenne taille.
            Il n'est pas conçu pour les grands mariages ou festivals, mais brille pour les besoins locaux et pratiques.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {USES.map((u, i) => (
            <div
              key={i}
              className="group p-6 rounded-2xl border border-slate-200 bg-white hover:bg-brand-50/50 hover:border-brand-200 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-brand-100 group-hover:bg-brand-200 flex items-center justify-center flex-shrink-0 transition-colors">
                  <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={u.icon} />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 mb-1">{u.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{u.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center">
          <p className="text-slate-600 text-sm max-w-2xl mx-auto">
            <strong className="text-slate-800">Bon à savoir :</strong> cet espace est particulièrement adapté
            aux besoins de petite et moyenne taille. Pour les grands événements (mariages, festivals),
            d'autres lieux du secteur seront plus appropriés.
          </p>
        </div>
      </div>
    </section>
  );
}
