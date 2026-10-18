-- ==============================================================================
-- Farmly — Migration 006: Farming method, crop type and sowing details
-- ==============================================================================
-- Run AFTER migration 005, in the Supabase SQL Editor. Idempotent.
--
-- The phone agent now records, for crop lots and upcoming harvests:
--   farming method (Organic / Natural / Conventional), whether organic is certified,
--   crop type (Cereal, Pulse, Oilseed, Vegetable, Fruit, Spice, Cash Crop, Plantation, Other),
--   sowing date and the farmer's expected price per kg.
-- batches already has sowing_date and price_per_kg.
-- ==============================================================================

ALTER TABLE public.batches
    ADD COLUMN IF NOT EXISTS farming_method TEXT,
    ADD COLUMN IF NOT EXISTS organic_certified BOOLEAN,
    ADD COLUMN IF NOT EXISTS crop_category TEXT,
    ADD COLUMN IF NOT EXISTS sowing_date TEXT,
    ADD COLUMN IF NOT EXISTS price_per_kg NUMERIC(12,2) DEFAULT 0;

ALTER TABLE public.crop_availabilities
    ADD COLUMN IF NOT EXISTS farming_method TEXT,
    ADD COLUMN IF NOT EXISTS organic_certified BOOLEAN,
    ADD COLUMN IF NOT EXISTS crop_category TEXT,
    ADD COLUMN IF NOT EXISTS sowing_date DATE,
    ADD COLUMN IF NOT EXISTS expected_price_per_kg NUMERIC(12,2);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'batches_farming_method_check') THEN
        ALTER TABLE public.batches ADD CONSTRAINT batches_farming_method_check
            CHECK (farming_method IS NULL OR farming_method IN ('Organic', 'Natural', 'Conventional'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crop_availabilities_farming_method_check') THEN
        ALTER TABLE public.crop_availabilities ADD CONSTRAINT crop_availabilities_farming_method_check
            CHECK (farming_method IS NULL OR farming_method IN ('Organic', 'Natural', 'Conventional'));
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
