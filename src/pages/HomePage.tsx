import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { Presentation } from '@/components/Presentation';
import { Characteristics } from '@/components/Characteristics';
import { Uses } from '@/components/Uses';
import { HowItWorks } from '@/components/HowItWorks';
import { LocationMap } from '@/components/LocationMap';
import { AvailabilitySection } from '@/components/AvailabilitySection';
import { BookingForm } from '@/components/BookingForm';
import { FAQ } from '@/components/FAQ';
import { Footer } from '@/components/Footer';

export function HomePage() {
  return (
    <div>
      <Navbar />
      <Hero />
      <Presentation />
      <Characteristics />
      <Uses />
      <HowItWorks />
      <LocationMap />
      <AvailabilitySection />

      <section id="reservation" className="py-20 bg-white">
        <div className="container-page">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-block px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold mb-4">
              Réservation
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 text-balance">
              Faire une demande de réservation
            </h2>
            <p className="text-slate-600">
              Remplissez le formulaire ci-dessous pour soumettre votre demande.
              ETS Laurent Mathieu étudiera votre demande et vous recontactera pour confirmation.
            </p>
          </div>

          <div className="max-w-xl mx-auto">
            <BookingForm />
          </div>
        </div>
      </section>

      <FAQ />
      <Footer />
    </div>
  );
}
