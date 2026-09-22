import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api';
import type { PaymentInfo } from '@/lib/types';
import { formatDateTimeFr, formatEur } from '@/lib/types';

type PaymentStatusResponse = {
  session_id: string;
  status: string;
  payment_status: string;
};

function Spinner() {
  return (
    <svg className="animate-spin w-8 h-8 text-brand-500" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function PaymentPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const canceled = searchParams.get('canceled') === '1';
  const queryClient = useQueryClient();

  const infoQuery = useQuery({
    queryKey: ['payment-info', id],
    queryFn: () => apiGet<PaymentInfo>(`/bookings/${id}/payment-info`),
    retry: 1,
  });

  const paidFromPoll = useQuery({
    queryKey: ['payment-status', sessionId ?? 'none'],
    queryFn: () => apiGet<PaymentStatusResponse>(`/payments/status/${sessionId}`),
    refetchInterval: (query) =>
      (query.state.data as PaymentStatusResponse | undefined)?.payment_status === 'paid'
        ? false
        : 2500,
    retry: 1,
    enabled: Boolean(sessionId),
  });

  // Dès que le poll (ou le webhook) confirme, on rafraîchit la réservation.
  const pollPaid = paidFromPoll.data?.payment_status === 'paid';
  useEffect(() => {
    if (pollPaid && id) {
      queryClient.invalidateQueries({ queryKey: ['payment-info', id] });
    }
  }, [pollPaid, id, queryClient]);

  const checkoutMutation = useMutation({
    mutationFn: () =>
      apiPost<{ checkout_url: string; session_id: string }>('/payments/checkout', {
        booking_id: id,
        origin_url: window.location.origin,
      }),
    onSuccess: (data) => {
      window.location.href = data.checkout_url;
    },
  });

  const info = infoQuery.data;
  const status = info?.status;
  const paidConfirmed = status === 'confirmee';

  const summaryRows = info ? (
    <div className="space-y-3 text-sm border-t border-slate-100 pt-4 mt-4 text-left">
      <div className="flex justify-between gap-4">
        <span className="text-slate-400 text-xs pt-0.5">Dates</span>
        <span className="text-slate-700 font-medium text-right">{info.requested_dates}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-slate-400 text-xs pt-0.5">Horaires</span>
        <span className="text-slate-700 font-medium">{info.start_time} — {info.end_time}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-slate-400 text-xs pt-0.5">Acompte</span>
        <span className="text-slate-900 font-bold text-lg">{formatEur(info.deposit_amount_eur)}</span>
      </div>
      {info.option_expires_at && status === 'en_attente_acompte' && (
        <div className="flex justify-between gap-4">
          <span className="text-slate-400 text-xs pt-0.5">Option valable jusqu'au</span>
          <span className="text-amber-700 font-medium">{formatDateTimeFr(info.option_expires_at)}</span>
        </div>
      )}
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="container-page h-16 flex items-center justify-between">
          <Link to="/" className="font-display font-bold text-lg text-slate-900" data-testid="payment-page-brand">
            ETS Laurent Mathieu
          </Link>
          <span className="text-xs text-slate-400">Paiement sécurisé Stripe</span>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="max-w-lg w-full">
          {canceled && !paidConfirmed && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800" data-testid="payment-canceled-banner">
              Paiement annulé — vous pouvez réessayer tant que l'option est valable.
            </div>
          )}

          {infoQuery.isPending ? (
            <div className="card p-12 flex items-center justify-center">
              <Spinner />
            </div>
          ) : infoQuery.isError ? (
            <div className="card p-8 text-center" data-testid="payment-not-found">
              <h1 className="text-xl font-bold text-slate-900 mb-2">Réservation introuvable</h1>
              <p className="text-slate-600 text-sm">
                Ce lien de paiement n'est pas valide ou la réservation n'existe plus.
              </p>
            </div>
          ) : paidConfirmed ? (
            <div className="card p-8 text-center" data-testid="payment-success-card">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mb-2">Réservation confirmée !</h1>
              <p className="text-slate-600 text-sm mb-2">
                Votre acompte a bien été reçu. Votre réservation est confirmée et le créneau vous est réservé.
                Un email de confirmation vous a été envoyé.
              </p>
              {summaryRows}
            </div>
          ) : status === 'en_attente_acompte' && sessionId && paidFromPoll && !paidFromPoll.isError ? (
            <div className="card p-12 flex flex-col items-center justify-center text-center" data-testid="payment-verifying">
              <Spinner />
              <p className="text-slate-600 text-sm mt-4">Vérification de votre paiement en cours...</p>
            </div>
          ) : status === 'en_attente_acompte' ? (
            <div className="card p-6 sm:p-8" data-testid="payment-pending-card">
              <h1 className="text-xl font-bold text-slate-900 mb-1">Régler l'acompte</h1>
              <p className="text-slate-600 text-sm mb-2">
                Votre demande a été acceptée. Réglez l'acompte ci-dessous pour confirmer définitivement
                votre réservation.
              </p>
              {summaryRows}
              {info && info.option_expires_at && (
                <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800 font-medium">
                  Créneau bloqué temporairement pour vous jusqu'au {formatDateTimeFr(info.option_expires_at)}.
                  Passé ce délai, l'option expire et le créneau redevient disponible.
                </div>
              )}
              {checkoutMutation.isError && (
                <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700" data-testid="payment-error">
                  Une erreur est survenue lors de la création du paiement. Veuillez réessayer.
                </div>
              )}
              <button
                onClick={() => checkoutMutation.mutate()}
                disabled={checkoutMutation.isPending}
                className="btn-primary w-full mt-6"
                data-testid="payment-pay-button"
              >
                {checkoutMutation.isPending
                  ? 'Redirection...'
                  : `Payer l'acompte — ${formatEur(info?.deposit_amount_eur)}`}
              </button>
              <p className="text-xs text-slate-400 text-center mt-3">
                Paiement sécurisé via Stripe · Aucune donnée bancaire ne transite par ce site
              </p>
            </div>
          ) : status === 'expiree' ? (
            <div className="card p-8 text-center" data-testid="payment-expired-card">
              <h1 className="text-xl font-bold text-slate-900 mb-2">Option expirée</h1>
              <p className="text-slate-600 text-sm">
                Le délai de 24h pour régler l'acompte est dépassé : le créneau a été libéré.
                Contactez ETS Laurent Mathieu pour relancer une demande.
              </p>
            </div>
          ) : status === 'refusee' || status === 'annulee' ? (
            <div className="card p-8 text-center" data-testid="payment-unavailable-card">
              <h1 className="text-xl font-bold text-slate-900 mb-2">Réservation indisponible</h1>
              <p className="text-slate-600 text-sm">
                Cette réservation a été {status === 'refusee' ? 'refusée' : 'annulée'}.
                Aucun paiement n'est demandé.
              </p>
            </div>
          ) : (
            <div className="card p-8 text-center" data-testid="payment-review-card">
              <h1 className="text-xl font-bold text-slate-900 mb-2">Demande en cours d'examen</h1>
              <p className="text-slate-600 text-sm">
                Votre demande est étudiée par ETS Laurent Mathieu. Vous recevrez un email avec le lien
                de paiement de l'acompte dès son acceptation.
              </p>
            </div>
          )}

          <p className="text-center mt-6">
            <Link to="/" className="text-sm text-slate-500 hover:text-brand-600 transition-colors" data-testid="payment-back-link">
              ← Retour au site
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
