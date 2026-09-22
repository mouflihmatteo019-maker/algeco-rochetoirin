# SPEC — Location espace Algéco Rochetoirin (clone + acompte Stripe)

## Qu'est-ce que c'est
Clone exact d'un site vitrine de location d'un espace Algéco fixe (36 route de Lyon, 38110
Rochetoirin) avec **demande de réservation en ligne + acompte Stripe** et espace administrateur.
Stack pod : FastAPI + MongoDB / React 19 + TS strict + Tailwind v4. Design identique à l'original
(palette brand #1d5be0, Inter + Plus Jakarta Sans, classes .btn-primary/.card/.input-field dans
frontend/src/index.css).

## Flux de réservation avec acompte (la fonctionnalité clé)
1. **Client** : formulaire public → statut `nouvelle` (aucun paiement). Email notif à l'entreprise.
2. **Admin** : peut marquer `a_valider`, puis **Accepter** avec montant d'acompte (défaut 150 €).
   → statut `en_attente_acompte`, créneau **bloqué 24h** (bloc calendrier `reserved-<start>-<end>`),
   email au client avec le **lien de paiement** (`APP_URL/paiement/{id}`).
3. **Client** : page /paiement/{id} (résumé + deadline) → « Payer l'acompte » → **Stripe Checkout**
   (session créée serveur, montant lu dans la réservation, metadata booking_id).
4. **Webhook** `POST /api/stripe/webhook` (signature vérifiée) : `checkout.session.completed` →
   statut **`confirmee`** (idempotent), bloc conservé (créneau indisponible), **emails au client
   ET à l'entreprise**. Filet de sécurité : GET /api/payments/status/{sid} interroge Stripe et
   confirme aussi (même garde idempotent).
5. **Expiration** : option non réglée sous 24h → `expiree` + créneau libéré. Sweep toutes les 60 s
   (tâche lifespan) + checks paresseux sur les lectures (calendar, bookings, payment-info, checkout).
6. Autres statuts admin : `refusee` / `annulee` (libèrent le créneau), relance d'option possible
   depuis refusee/expiree/annulee. Confirmée manuelle possible (« paiement reçu hors ligne »).

## Données (MongoDB, DB_NAME=app)
- `booking_requests` : id (uuid), requested_dates (libellé FR serveur), start_date, end_date,
  start_time, end_time, need_type, people_count, name, phone, email, message, status (7 valeurs),
  deposit_amount_eur, option_expires_at (UTC aware), paid_at, admin_notes, created_at.
- `calendar_blocks` : id (`reserved-<start>-<end>` pour les réservations), start_date, end_date,
  label, status (blocked|reserved), created_at.
- `payment_transactions` : session_id (unique), booking_id, amount (centimes), currency, status,
  payment_status, stripe_payment_intent_id, created_at/updated_at.
- `admin_users` : email unique + password_hash pbkdf2_sha256.

## Routes (api_router, préfixe /api)
- Public : POST /bookings, GET /calendar, GET /bookings/{id}/payment-info (sans données perso),
  POST /payments/checkout, GET /payments/status/{session_id}, POST /stripe/webhook (path exact Flow A).
- Admin (cookie httpOnly `admin_session`, JWT 7 j, dépendance require_admin) : GET /bookings,
  PATCH /bookings/{id}/status (body {status, deposit_amount_eur?}), PATCH /bookings/{id}/notes,
  DELETE /bookings/{id}, POST /calendar, DELETE /calendar/{id}.
- Auth : POST /auth/login, GET /auth/me, POST /auth/logout.

## Frontend
- `/` : site vitrine identique (hero, présentation, équipements, usages, étapes, carte, calendrier
  vert/rouge, formulaire, FAQ, footer). `/admin` : dashboard (filtres 7 statuts, panneau détail,
  montant d'acompte, lien de paiement copiable, deadline, accepter/refuser/annuler/confirmer,
  calendrier admin). `/paiement/:id` : page publique de paiement (états : payer / vérification /
  confirmée / expirée / refusée-annulée / en examen).
- Types : frontend/src/lib/types.ts ↔ backend/models/booking.py (tenir en sync dans la même édition).

## Paiements (Stripe — sandbox réclamable Emergent, Flow A)
Clés dans backend/.env (STRIPE_SECRET_KEY/PUBLISHABLE_KEY/ACCOUNT_ID/WEBHOOK_SECRET, MODE=test).
Compte sandbox acct_1UGwQuEMRkPU8TK6 — réclamable via le lien onboarding reçu par email Stripe.
Taxe : Stripe calcule (+0,5 %/transaction) via automatic_tax avec repli automatique sur
« aucune aide fiscale » en cas d'erreur de config. Carte test : 4242 4242 4242 4242, péremption
future, CVC quelconque. Aucune vraie carte n'est débitée en mode test.

## Emails (Resend)
RESEND_API_KEY + SENDER_EMAIL=onboarding@resend.dev dans backend/.env. OWNER_EMAIL =
matteomouflih@gmail.com (boîte du compte Resend — la seule recevable en mode test ; mettre une
adresse du domaine vérifié ensuite). Emails : notif nouvelle demande, acceptation+lien de paiement,
confirmation paiement (client + entreprise), refus/annulation. Fire-and-forget : construction + envoi
hors boucle (schedule_email), une erreur ne casse jamais le flux. ⚠️ Mode test Resend : seuls les
destinataires du compte (matteomouflih@gmail.com) reçoivent — vérifier un domaine pour le reste.

## Démo (backend/seed.py, idempotent, dates relatives à aujourd'hui)
4 demandes : nouvelle (Marie Dubois), en_attente_acompte 150 € (Comité des Fêtes, option 20h),
confirmée (Julien Martin, payée), refusée (Saveurs du Bugey) + blocs calendrier correspondants
+ maintenance bloquée.

## Rôles / accès
Admin unique (cookie de session). Identifiants : memory/test_credentials.md.
