-- ==============================================================================
-- Farmly — Migration 005: Repair older VoiceGenie tables for the phone agent
-- ==============================================================================
-- Run AFTER migrations 003 and 004, in the Supabase SQL Editor. Idempotent.
--
-- Some projects already had voicegenie_calls / voicegenie_submissions from an
-- earlier VoiceGenie prototype (columns such as call_id, call_duration,
-- call_recording_url, collected_data, submission_data). `CREATE TABLE IF NOT
-- EXISTS` in the base schema skipped them, so the backend's columns were missing:
--   "column voicegenie_calls.call_sid does not exist"
--   "Could not find the 'call_duration_seconds' column of 'voicegenie_calls'"
-- This adds every column the backend uses and relaxes legacy constraints the
-- backend doesn't fill. Nothing is dropped or renamed; old data stays as it is.
-- On a database created from farmly_supabase_schema.sql it changes nothing.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- voicegenie_calls
-- ------------------------------------------------------------------------------
ALTER TABLE public.voicegenie_calls
    ADD COLUMN IF NOT EXISTS call_sid TEXT,
    ADD COLUMN IF NOT EXISTS phone_number TEXT,
    ADD COLUMN IF NOT EXISTS language TEXT,
    ADD COLUMN IF NOT EXISTS call_duration_seconds INTEGER,
    ADD COLUMN IF NOT EXISTS recording_url TEXT,
    ADD COLUMN IF NOT EXISTS transcript TEXT,
    ADD COLUMN IF NOT EXISTS structured_intent JSONB,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'in_progress',
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Columns from migrations 003/004, repeated so this file also works on its own.
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
    ADD COLUMN IF NOT EXISTS batch_id TEXT,
    ADD COLUMN IF NOT EXISTS submissions JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Defaults for jsonb columns that an older version may have created without one.
ALTER TABLE public.voicegenie_calls ALTER COLUMN turns SET DEFAULT '[]'::jsonb;
ALTER TABLE public.voicegenie_calls ALTER COLUMN submissions SET DEFAULT '[]'::jsonb;
ALTER TABLE public.voicegenie_calls ALTER COLUMN callback_requested SET DEFAULT false;
ALTER TABLE public.voicegenie_calls ALTER COLUMN source SET DEFAULT 'twilio';

-- Legacy columns the backend does not write must not be required.
DO $$
DECLARE
    col TEXT;
BEGIN
    FOREACH col IN ARRAY ARRAY['call_id', 'farmer_name', 'farmer_location', 'raw_call_data', 'call_summary',
                               'call_duration', 'call_recording_url', 'collected_data', 'notes']
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'voicegenie_calls'
                     AND column_name = col AND is_nullable = 'NO') THEN
            EXECUTE format('ALTER TABLE public.voicegenie_calls ALTER COLUMN %I DROP NOT NULL', col);
        END IF;
    END LOOP;
END $$;

-- One session per Twilio call (simulator sessions have no call SID).
CREATE UNIQUE INDEX IF NOT EXISTS uq_voicegenie_calls_call_sid
    ON public.voicegenie_calls (call_sid) WHERE call_sid IS NOT NULL;

-- ------------------------------------------------------------------------------
-- voicegenie_submissions
-- ------------------------------------------------------------------------------
ALTER TABLE public.voicegenie_submissions
    ADD COLUMN IF NOT EXISTS call_id TEXT,
    ADD COLUMN IF NOT EXISTS farmer_phone TEXT,
    ADD COLUMN IF NOT EXISTS raw_payload JSONB,
    ADD COLUMN IF NOT EXISTS extracted_crop_data JSONB,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS helper_id UUID,
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
    ADD COLUMN IF NOT EXISTS registered_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS batch_id TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'lot',
    ADD COLUMN IF NOT EXISTS seq INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS record_id TEXT;

DO $$
DECLARE
    col TEXT;
    id_type TEXT;
    id_default TEXT;
    id_identity TEXT;
BEGIN
    -- Legacy columns the backend does not write must not be required.
    FOREACH col IN ARRAY ARRAY['farmer_name', 'farmer_location', 'submission_data', 'language', 'confidence_score',
                               'call_recording_url', 'raw_payload', 'extracted_crop_data', 'farmer_phone']
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'voicegenie_submissions'
                     AND column_name = col AND is_nullable = 'NO') THEN
            EXECUTE format('ALTER TABLE public.voicegenie_submissions ALTER COLUMN %I DROP NOT NULL', col);
        END IF;
    END LOOP;

    -- An integer id without a default or identity would reject every insert: give it a sequence.
    SELECT data_type, column_default, is_identity INTO id_type, id_default, id_identity
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'voicegenie_submissions' AND column_name = 'id';

    IF id_type IN ('bigint', 'integer') AND id_default IS NULL AND id_identity = 'NO' THEN
        CREATE SEQUENCE IF NOT EXISTS public.voicegenie_submissions_id_seq OWNED BY public.voicegenie_submissions.id;
        PERFORM setval('public.voicegenie_submissions_id_seq',
                       GREATEST(COALESCE((SELECT MAX(id) FROM public.voicegenie_submissions), 0), 1));
        ALTER TABLE public.voicegenie_submissions
            ALTER COLUMN id SET DEFAULT nextval('public.voicegenie_submissions_id_seq');
    ELSIF id_type = 'uuid' AND id_default IS NULL THEN
        ALTER TABLE public.voicegenie_submissions ALTER COLUMN id SET DEFAULT gen_random_uuid();
    END IF;
END $$;

-- The backend upserts on (call_id, kind, seq).
CREATE UNIQUE INDEX IF NOT EXISTS uq_voicegenie_submissions_call_kind_seq
    ON public.voicegenie_submissions (call_id, kind, seq);

-- Keep both tables closed to the anon key (service role only).
ALTER TABLE public.voicegenie_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voicegenie_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dev_all_access" ON public.voicegenie_calls;
DROP POLICY IF EXISTS "dev_all_access" ON public.voicegenie_submissions;

-- Make the new columns visible to the API immediately (clears "schema cache" errors).
NOTIFY pgrst, 'reload schema';
