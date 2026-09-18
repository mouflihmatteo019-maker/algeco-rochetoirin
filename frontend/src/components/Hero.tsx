export default function Hero() {
  return (
    <section id="top" className="relative min-h-[600px] lg:min-h-[700px] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="/images/image-1.jpeg"
          alt="Espace Algéco fixe à louer à Rochetoirin — ETS Laurent Mathieu"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-brand-900/50" />
      </div>

      <div className="container-page relative z-10 pt-20">
        <div className="max-w-2xl animate-fade-up">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white text-sm font-medium mb-6 border border-white/20">
            Rochetoirin — Nord-Isère
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 text-balance leading-tight">
            Location d'un espace Algéco fixe à Rochetoirin
          </h1>
          <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-xl leading-relaxed">
            Un espace pratique et modulable pour vos réunions, activités associatives, événements locaux et besoins professionnels ponctuels. Au 36 route de Lyon, 38110 Rochetoirin.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a href="#reservation" className="btn-primary" data-testid="hero-booking-cta">
              Faire une demande de réservation
            </a>
            <a href="#presentation" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 backdrop-blur-sm px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/20 active:scale-95" data-testid="hero-discover-cta">
              Découvrir l'espace
            </a>
          </div>

          <div className="flex flex-wrap gap-6 mt-10 text-white/80 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-brand-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              36 route de Lyon, 38110 Rochetoirin
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-brand-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
