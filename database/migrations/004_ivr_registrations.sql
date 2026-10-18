-- ==============================================================================
-- Farmly — Migration 004: Phone registration of farmers, crop lots and upcoming harvests
-- ==============================================================================
-- Run AFTER migration 003, in the Supabase SQL Editor. Idempotent.
--
-- A single call can now register a new farmer and then several crop lots / upcoming
-- harvests. Each registration is one voicegenie_submissions row keyed by
-- (call_id, kind, seq) and stores the exact JSON body sent to the backend.
-- ==============================================================================

ALTER TABLE public.voicegenie_calls
    ADD COLUMN IF NOT EXISTS submissions JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.voicegenie_submissions
    ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'lot',
    ADD COLUMN IF NOT EXISTS seq INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS record_id TEXT;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'voicegenie_submissions_kind_check') THEN
        ALTER TABLE public.voicegenie_submissions
            ADD CONSTRAINT voicegenie_submissions_kind_check CHECK (kind IN ('farmer', 'lot', 'availability'));
    END IF;
END $$;

-- Replace "one submission per call" with "one row per registration on the call".
DROP INDEX IF EXISTS public.uq_voicegenie_submissions_call;
CREATE UNIQUE INDEX IF NOT EXISTS uq_voicegenie_submissions_call_kind_seq
    ON public.voicegenie_submissions (call_id, kind, seq);

-- Phone-registered farmers are recognised by mobile number on later calls.
CREATE INDEX IF NOT EXISTS idx_farmers_mobile ON public.farmers (mobile);
