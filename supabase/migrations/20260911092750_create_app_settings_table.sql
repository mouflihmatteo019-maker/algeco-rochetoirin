/*
# Create app_settings table for email configuration

## Purpose
Stores configuration needed by edge functions (Resend API key, admin notification
emails, sender email). Edge functions read this using the service role key which
bypasses RLS — no policy is created so the table is invisible to the anon/authenticated
roles used by the frontend.

## New Tables
### app_settings
- id (int, primary key, always 1 — singleton row)
- resend_api_key (text) — Resend API key for sending emails
- admin_emails (text) — comma-separated list of admin notification emails
- from_email (text) — sender email address
- created_at (timestamptz)
- updated_at (timestamptz)

## Security
- RLS enabled, NO policies created — only the service role (used by edge functions)
  can read or write. The anon and authenticated roles get nothing.
*/

CREATE TABLE IF NOT EXISTS app_settings (
  id int PRIMARY KEY DEFAULT 1,
  resend_api_key text,
  admin_emails text,
  from_email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT singleton_check CHECK (id = 1)
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Insert the initial configuration row
INSERT INTO app_settings (id, resend_api_key, admin_emails, from_email)
VALUES (1, 're_SXTEeJtG_PZyodRYfBycHHsrRre4SeQYD', 'matteomouflih@gmail.com', 'onboarding@resend.dev')
ON CONFLICT (id) DO UPDATE SET
  resend_api_key = EXCLUDED.resend_api_key,
  admin_emails = EXCLUDED.admin_emails,
  from_email = EXCLUDED.from_email,
  updated_at = now();
