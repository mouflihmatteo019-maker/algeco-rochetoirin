import { useState } from 'react';

const FAQ_ITEMS = [
  {
    q: `Quels types d'événements peut-on organiser dans cet espace ?`,
    a: `L'Algéco fixe de Rochetoirin est idéal pour les réunions, les activités associatives, les formations, les petits événements locaux et les besoins professionnels ponctuels. Il n'est pas adapté aux grands mariages ou festivals.`,
  },
  {
    q: `Combien de personnes peut accueillir l'espace ?`,
    a: `L'espace peut confortablement accueillir entre 15 et 30 personnes selon la configuration souhaitée (réunion en salle, atelier, etc.).`,
  },
  {
    q: `Comment réserver l'espace ?`,
    a: `Vous remplissez le formulaire de demande de réservation en ligne. Votre demande est ensuite étudiée par ETS Laurent Mathieu, qui vous recontacte pour valider la réservation selon les disponibilités.`,
  },
  {
    q: `La demande en ligne vaut-elle réservation ?`,
    a: `Non. La demande ne constitue pas une réservation définitive. Elle sera étudiée et validée par ETS Laurent Mathieu selon les disponibilités. Vous recevrez une confirmation avant que la réservation ne soit effective.`,
  },
  {
    q: `Faut-il payer en ligne ?`,
    a: `Non, aucun paiement ne s'effectue en ligne. Aucun acompte n'est demandé lors de la demande. Les modalités sont convenues directement avec ETS Laurent Mathieu après validation.`,
  },
  {
    q: `L'espace est-il équipé ?`,
    a: `Oui. L'Algéco fixe dispose de l'électricité, du chauffage, d'une connexion Wi-Fi, de tables et chaises. Le mobilier peut être adapté selon votre besoin.`,
  },
  {
    q: `Où se trouve l'espace ?`,
    a: `Au 36 route de Lyon, 38110 Rochetoirin. Il est facilement accessible depuis La Tour-du-Pin (5 min), Bourgoin-Jallieu (15 min) et l'autoroute A43.`,
  },
  {
    q: `Puis-je venir visiter avant de réserver ?`,
    a: `Bien sûr. Vous pouvez demander une visite en précisant votre souhait dans le champ message du formulaire de réservation.`,
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 bg-slate-50">
      <div className="container-page">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold mb-4">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 text-balance">
            Questions fréquentes
          </h2>
          <p className="text-slate-600">
            Tout ce qu'il faut savoir avant de faire une demande de réservation.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <div
              key={i}
              className={`card overflow-hidden transition-all ${openIndex === i ? 'shadow-md' : ''}`}
              data-testid={`faq-item-${i}`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 p-5 text-left"
                data-testid={`faq-question-button-${i}`}
              >
                <span className="font-semibold text-slate-900 text-sm sm:text-base">{item.q}</span>
                <svg
                  className={`w-5 h-5 text-brand-600 flex-shrink-0 transition-transform duration-300 ${openIndex === i ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${openIndex === i ? 'max-h-60' : 'max-h-0'}`}
              >
                <p className="px-5 pb-5 text-sm text-slate-600 leading-relaxed">
                  {item.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
