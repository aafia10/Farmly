-- ==============================================================================
-- Farmly — Migration 003: Multilingual IVR crop registration sessions
-- ==============================================================================
-- Run AFTER migration 002, in the Supabase SQL Editor. Idempotent.
--
-- Reuses voicegenie_calls (one row per phone call or simulator session) and
-- voicegenie_submissions (one row per confirmed lot registration). Both tables hold
-- farmer phone numbers and transcripts, so they are readable/writable only by the
-- backend's service-role key (no anon access).
-- ==============================================================================

ALTER TABLE public.voicegenie_calls
    ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'twilio',
    ADD COLUMN IF NOT EXISTS farmer_registry_id TEXT,
    ADD COLUMN IF NOT EXISTS helper_id TEXT,
    ADD COLUMN IF NOT EXISTS dialog_state JSONB,
    ADD COLUMN IF NOT EXISTS turns JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS outcome TEXT,
    ADD COLUMN IF NOT EXISTS callback_requested BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS callback_reason TEXT,
    ADD COLUMN IF NOT EXISTS last_error TEXT,
    ADD COLUMN IF NOT EXISTS pending_batch_id TEXT,
    ADD COLUMN IF NOT EXISTS batch_id TEXT;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'voicegenie_calls_source_check') THEN
        ALTER TABLE public.voicegenie_calls
            ADD CONSTRAINT voicegenie_calls_source_check CHECK (source IN ('twilio', 'simulator'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_voicegenie_calls_phone ON public.voicegenie_calls (phone_number, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voicegenie_calls_created ON public.voicegenie_calls (created_at DESC);

-- One registration per call: a retried submit can never create a second lot.
CREATE UNIQUE INDEX IF NOT EXISTS uq_voicegenie_submissions_call ON public.voicegenie_submissions (call_id);

-- Lock both tables to the service role (the base schema used to open every table in dev).
ALTER TABLE public.voicegenie_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voicegenie_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dev_all_access" ON public.voicegenie_calls;
DROP POLICY IF EXISTS "dev_all_access" ON public.voicegenie_submissions;
