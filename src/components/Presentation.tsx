export function Presentation() {
  return (
    <section id="presentation" className="py-20 bg-white">
      <div className="container-page">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-up">
            <span className="inline-block px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold mb-4">
              L'espace
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6 text-balance">
              Un Algéco fixe, modulable et fonctionnel au cœur du Nord-Isère
            </h2>
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>
                Situé au <strong className="text-slate-800">36 route de Lyon à Rochetoirin</strong>, cet Algéco fixe
                offre un espace intérieur pratique et lumineux, idéal pour répondre à des besoins
                ponctuels sans engager la location d'une salle traditionnelle.
              </p>
              <p>
                Accessible facilement depuis <strong className="text-slate-800">La Tour-du-Pin</strong> et{' '}
                <strong className="text-slate-800">Bourgoin-Jallieu</strong>, l'espace est pensé pour
                les professionnels, les associations et les habitants du secteur qui recherchent
                un lieu de réunion, de travail ou de rassemblement à taille humaine.
              </p>
              <p>
                L'aménagement intérieur peut être adapté selon votre besoin : tables et chaises
                pour une réunion, espace plus ouvert pour un atelier ou une activité associative.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="text-center p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-2xl font-bold text-brand-600">~30m²</p>
                <p className="text-xs text-slate-500 mt-1">Surface utile</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-2xl font-bold text-brand-600">15-20</p>
                <p className="text-xs text-slate-500 mt-1">Personnes</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-2xl font-bold text-brand-600">7j/7</p>
                <p className="text-xs text-slate-500 mt-1">Sur demande</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 animate-fade-up">
            <img
              src="/images/1657bf4e-1d28-466e-8e60-f17f26e57d04.jpg"
              alt="Vue extérieure de l'Algéco fixe à Rochetoirin"
              className="rounded-2xl shadow-lg object-cover w-full h-64 sm:h-80"
            />
            <img
              src="/images/84d86b5c-cf00-476d-982c-b29062bf4374.jpg"
              alt="Espace intérieur modulable pour réunions"
              className="rounded-2xl shadow-lg object-cover w-full h-64 sm:h-80 mt-8"
            />
            <img
              src="/images/a8785e99-63c8-48c3-b35b-9b12d8a24474.jpg"
              alt="Salle de réunion équipée dans l'Algéco"
              className="rounded-2xl shadow-lg object-cover w-full h-64 sm:h-80"
            />
            <img
              src="/images/image-1.jpeg"
              alt="Vue intérieure lumineuse de l'Algéco fixe à Rochetoirin"
              className="rounded-2xl shadow-lg object-cover w-full h-64 sm:h-80 mt-8"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
