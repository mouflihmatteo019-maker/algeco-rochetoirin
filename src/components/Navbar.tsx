import { useState, useEffect } from 'react';

const NAV_LINKS = [
  { href: '#presentation', label: 'L\'espace' },
  { href: '#caracteristiques', label: 'Équipements' },
  { href: '#usages', label: 'Usages' },
  { href: '#etapes', label: 'Comment ça marche' },
  { href: '#disponibilites', label: 'Disponibilités' },
  { href: '#faq', label: 'FAQ' },
  { href: '#reservation', label: 'Réserver' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-transparent'}`}>
      <nav className="container-page">
        <div className="flex items-center justify-between h-16">
          <a href="#top" className="flex items-center gap-2">
            <span className={`font-display font-bold text-lg transition-colors ${scrolled ? 'text-slate-900' : 'text-white'}`}>
              ETS Laurent Mathieu
            </span>
          </a>

          <div className="hidden lg:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-brand-500 ${scrolled ? 'text-slate-600' : 'text-white/90'}`}
              >
                {link.label}
              </a>
            ))}
            <a href="#reservation" className="btn-primary text-xs">
              Demander une réservation
            </a>
          </div>

          <button
            className="lg:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            <svg className={`w-6 h-6 ${scrolled ? 'text-slate-900' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>

        {mobileOpen && (
          <div className="lg:hidden pb-4 animate-fade-in">
            <div className="flex flex-col gap-1 bg-white rounded-xl shadow-lg p-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
