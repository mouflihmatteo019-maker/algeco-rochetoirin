# SPEC — Clone du site "ETS Laurent Mathieu — Location espace Algéco Rochetoirin"

## Qu'est-ce que c'est
Clone exact (demande utilisateur : « recréer exactement ce site ») d'un site vitrine de location
d'un espace Algéco fixe au 36 route de Lyon, 38110 Rochetoirin, avec demande de réservation en
ligne et espace administrateur. Source : zip Bolt Supabase (Vite+React) — porté sur la stack du
pod : **FastAPI + MongoDB** (backend) et **React 19 + TS strict + Tailwind v4** (frontend).
Design identique : palette brand bleue (#1d5be0), Inter (sans) + Plus Jakarta Sans (display),
classes utilitaires maison (container-page, btn-primary, btn-secondary, card, input-field,
label-field) portées dans `frontend/src/index.css` (@theme + @layer components).

## Données (MongoDB, DB_NAME=app)
- `booking_requests` : id (uuid str), requested_dates (libellé FR calculé serveur), start_date,
  end_date, start_time, end_time, need_type (reunion|association|evenement|professionnel|autre),
  people_count, name, phone, email, message, status (pending|accepted|refused), admin_notes,
  created_at (UTC aware). Modèle : `backend/models/booking.py` ↔ `frontend/src/lib/types.ts`.
- `calendar_blocks` : id, start_date, end_date, label, status (blocked|reserved), created_at.
- `admin_users` : email unique + password_hash (pbkdf2_sha256 via passlib).

## Routes (toutes sur api_router, préfixe /api)
- Public : `POST /api/bookings` (crée une demande, statut pending, email propriétaire
  fire-and-forget), `GET /api/calendar` (blocs triés par start_date).
- Admin (cookie httpOnly `admin_session`, JWT 7 j — dépendance `require_admin`) :
  `GET /api/bookings`, `PATCH /api/bookings/{id}/status`, `PATCH /api/bookings/{id}/notes`,
  `DELETE /api/bookings/{id}`, `POST /api/calendar`, `DELETE /api/calendar/{id}`.
- Auth : `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`.
- Accepter une demande crée un bloc `reserved` (plage exacte) ; refuser/remettre en attente/
  supprimer le retire (logique de l'original, déplacée côté serveur). Email Resend au demandeur
  à chaque changement de statut. /api/status (template) conservé.

## Frontend
- `/` : HomePage — Navbar (fixe, blanc au scroll), Hero, Presentation (4 photos), Characteristics
  (6 cartes), Uses (6), HowItWorks (3 étapes), LocationMap (iframe Google Maps),
  AvailabilitySection (calendrier public vert/rouge), formulaire de réservation, FAQ (accordéon,
  8 questions), Footer (lien /admin).
- `/admin` : AdminLogin → AdminDashboard (onglets Demandes + Calendrier admin : filtres par
  statut, panneau détail, accepter/refuser/en attente, notes internes onBlur, supprimer,
  blocage de dates). Auth via `useAuth()` de `src/lib/session.ts` (cookie + queryClient.clear()
  à la déconnexion).
- Images copiées du zip dans `frontend/public/images/` (image-1.jpeg + 3 UUID.jpg utilisées).

## Emails (Resend)
Clé dans `backend/.env` (RESEND_API_KEY), expéditeur SENDER_EMAIL=onboarding@resend.dev,
destinataire notif OWNER_EMAIL. Envoi fire-and-forget (`backend/lib/emails.py`,
asyncio.to_thread) : une erreur Resend est loguée, ne casse jamais le flux de réservation.
⚠️ Compte Resend en mode test : il n'envoie qu'aux adresses du compte propriétaire
(matteomouflih@gmail.com) tant qu'un domaine n'est pas vérifié sur resend.com/domains.

## Données de démo (backend/seed.py, idempotent, relançable)
3 demandes (Marie Dubois acceptée, Comité des Fêtes en attente, Julien Martin refusée — dates
relatives à aujourd'hui) + 2 blocs (réservé sur la demande acceptée, "Maintenance" bloquée).

## Rôles / accès
Un seul rôle admin (cookie de session). Identifiants dans `memory/test_credentials.md`.
