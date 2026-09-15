export function LocationMap() {
  return (
    <section id="localisation" className="py-20 bg-slate-50">
      <div className="container-page">
        <div className="grid lg:grid-cols-5 gap-8 items-stretch">
          <div className="lg:col-span-2 flex flex-col justify-center">
            <span className="inline-block px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold mb-4 w-fit">
              Localisation
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6 text-balance">
              Au 36 route de Lyon, à Rochetoirin
            </h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              L'espace est idéalement situé à Rochetoirin, au cœur du Nord-Isère, facilement accessible
              depuis La Tour-du-Pin (5 min), Bourgoin-Jallieu (15 min) et l'autoroute A43.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Adresse</p>
                  <p className="text-sm text-slate-600">36 route de Lyon, 38110 Rochetoirin</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Proximité</p>
                  <p className="text-sm text-slate-600">La Tour-du-Pin (5 min) · Bourgoin-Jallieu (15 min) · A43</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Stationnement</p>
                  <p className="text-sm text-slate-600">Places de stationnement à proximité immédiate</p>
                </div>
              </div>
            </div>

            <a
              href="https://www.google.com/maps/search/?api=1&query=36+route+de+Lyon+38110+Rochetoirin"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary mt-8 w-fit"
            >
              Ouvrir dans Google Maps
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
          </div>

          <div className="lg:col-span-3">
            <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200 h-full min-h-[400px]">
              <iframe
                title="Carte — 36 route de Lyon, 38110 Rochetoirin"
                src="https://www.google.com/maps?q=36+route+de+Lyon,+38110+Rochetoirin&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '400px' }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
