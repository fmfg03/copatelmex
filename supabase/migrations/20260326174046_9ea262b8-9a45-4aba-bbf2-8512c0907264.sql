-- PART 1: Add missing columns to existing tables

-- players: add responsiva_url
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS responsiva_url text;

-- registrations: add payment_receipt_url and responsiva_url
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS payment_receipt_url text;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS responsiva_url text;

-- categories: add registration_closed
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS registration_closed boolean NOT NULL DEFAULT false;

-- teams: add country and postal_code
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'México';
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS postal_code text;