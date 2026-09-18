export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="container-page py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-3">ETS Laurent Mathieu</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Location d'un espace Algéco fixe à Rochetoirin pour vos besoins ponctuels :
              réunions, associations, événements locaux et besoins professionnels.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Coordonnées</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                36 route de Lyon, 38110 Rochetoirin
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                Sur demande
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#presentation" className="text-slate-400 hover:text-white transition-colors">L'espace</a></li>
              <li><a href="#caracteristiques" className="text-slate-400 hover:text-white transition-colors">Équipements</a></li>
              <li><a href="#usages" className="text-slate-400 hover:text-white transition-colors">Usages</a></li>
              <li><a href="#disponibilites" className="text-slate-400 hover:text-white transition-colors">Disponibilités</a></li>
              <li><a href="#reservation" className="text-slate-400 hover:text-white transition-colors">Demande de réservation</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} ETS Laurent Mathieu — Location espace Algéco Rochetoirin, Nord-Isère
          </p>
          <a href="/admin" className="text-xs text-slate-500 hover:text-slate-300 transition-colors" data-testid="footer-admin-link">
            Espace administrateur
          </a>
        </div>
      </div>
    </footer>
  );
}
