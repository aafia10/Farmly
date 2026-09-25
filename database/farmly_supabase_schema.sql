-- ==============================================================================
-- Farmly Digital Agriculture Platform — Complete Supabase PostgreSQL Schema & Seed
-- ==============================================================================
-- File: database/farmly_supabase_schema.sql
-- Application: Farmly (The Digital Infrastructure for Modern Farming)
-- Architecture: Next.js 15 App Router Frontend + Supabase PostgreSQL Backend
-- Date: September 18, 2026
-- Version: 3.2.0 (Hotfix: Expanded Check Constraints & Idempotent Schema Migration)
--
-- Supported 8 Roles:
--   1. Farmer          (farmer@farmly.demo)
--   2. Helper          (helper@farmly.demo)
--   3. FPO             (fpo@farmly.demo)
--   4. Collector       (collector@farmly.demo / collection@farmly.demo)
--   5. QA              (qa@farmly.demo / quality@farmly.demo)
--   6. Distributor     (distributor@farmly.demo)
--   7. Retailer        (retailer@farmly.demo)
--   8. Admin           (admin@farmly.demo)
-- Password for ALL demo accounts: Farmly@123
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS & HELPER FUNCTIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 2. IDENTITY & ACCESS MANAGEMENT: profiles
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT, -- Frontend 'mobile'
    user_type TEXT NOT NULL,
    state TEXT,
    district TEXT,
    preferred_language TEXT DEFAULT 'en',
    organization TEXT,
    farm_location TEXT,
    wallet_address TEXT,
    role TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add additive columns if table already existed in previous migration
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization TEXT;

-- Safely expand user_type check constraint to accommodate all 8 Farmly personas (+ legacy driver)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_type_check CHECK (
    user_type IN (
        'farmer', 'helper', 'distributor', 'retailer', 
        'fpo', 'collection_center', 'quality_assessor', 'admin', 'driver'
    )
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 3. ASSISTED FARMER DIRECTORY: farmers
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.farmers (
    id TEXT PRIMARY KEY DEFAULT ('FM-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8))),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    village TEXT NOT NULL,
    taluka TEXT,
    district TEXT NOT NULL,
    state TEXT NOT NULL,
    language TEXT DEFAULT 'English',
    farming_category TEXT NOT NULL,
    fpo TEXT,
    consent BOOLEAN DEFAULT true,
    verification_level TEXT DEFAULT 'Field Verified' CHECK (verification_level IN ('Basic', 'Field Verified', 'Identity Confirmed')),
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Pending', 'Needs Review')),
    assisted_by_helper_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_farmers_mobile ON public.farmers(mobile);
CREATE INDEX IF NOT EXISTS idx_farmers_district ON public.farmers(district);
CREATE INDEX IF NOT EXISTS idx_farmers_status ON public.farmers(status);
CREATE INDEX IF NOT EXISTS idx_farmers_helper ON public.farmers(assisted_by_helper_id);

DROP TRIGGER IF EXISTS trg_farmers_updated_at ON public.farmers;
CREATE TRIGGER trg_farmers_updated_at
BEFORE UPDATE ON public.farmers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 4. FIELD HELPER WORKFLOW LOGS: helper_activities
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.helper_activities (
    id TEXT PRIMARY KEY DEFAULT ('HA-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8))),
    helper_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'Registration', 'Crop Availability', 'Lot Creation', 'Evidence', 'Offer', 'Profile'
    )),
    details TEXT,
    badge_status TEXT DEFAULT 'Completed' CHECK (badge_status IN (
        'Assisted', 'Pending', 'Completed', 'Needs Review'
    )),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_helper_activities_helper ON public.helper_activities(helper_id);
CREATE INDEX IF NOT EXISTS idx_helper_activities_created ON public.helper_activities(created_at DESC);

-- ------------------------------------------------------------------------------
-- 5. STANDING CROP FORECASTS: crop_availabilities
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crop_availabilities (
    id TEXT PRIMARY KEY DEFAULT ('CA-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8))),
    farmer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    farmer_registry_id TEXT REFERENCES public.farmers(id) ON DELETE SET NULL,
    farmer_name TEXT NOT NULL,
    crop TEXT NOT NULL,
    variety TEXT NOT NULL,
    estimated_quantity NUMERIC(12,2) NOT NULL,
    unit TEXT NOT NULL DEFAULT 'kg',
    expected_harvest_date DATE NOT NULL,
    location TEXT NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'Available' CHECK (status IN (
        'Draft', 'Available', 'Under Review', 'Converted to Lot', 'Sold'
    )),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crop_avail_farmer ON public.crop_availabilities(farmer_id);
CREATE INDEX IF NOT EXISTS idx_crop_avail_status ON public.crop_availabilities(status);
CREATE INDEX IF NOT EXISTS idx_crop_avail_crop ON public.crop_availabilities(crop);

DROP TRIGGER IF EXISTS trg_crop_avail_updated_at ON public.crop_availabilities;
CREATE TRIGGER trg_crop_avail_updated_at
BEFORE UPDATE ON public.crop_availabilities
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 6. LOT RECURSIVE LINEAGE & INVENTORY: batches
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.batches (
    id TEXT PRIMARY KEY DEFAULT ('LT-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8))),
    group_id TEXT,
    farmer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    farmer_registry_id TEXT REFERENCES public.farmers(id) ON DELETE SET NULL,
    farmer_name TEXT,
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
    current_owner TEXT,
    current_owner_name TEXT,
    crop_type TEXT NOT NULL,
    crop TEXT,
    variety TEXT,
    harvest_quantity NUMERIC(12,2) NOT NULL DEFAULT 0,
    quantity NUMERIC(12,2) DEFAULT 0,
    unit TEXT DEFAULT 'kg',
    price_per_kg NUMERIC(12,2) DEFAULT 0,
    total_price NUMERIC(15,2) DEFAULT 0,
    grading TEXT DEFAULT 'Standard',
    quality_grade TEXT DEFAULT 'Standard',
    location TEXT,
    status TEXT DEFAULT 'Active',
    parent_lot_id TEXT REFERENCES public.batches(id) ON DELETE SET NULL,
    weighment_scale_id TEXT,
    certificate_ref TEXT,
    assisted_by_helper_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    sowing_date TEXT,
    harvest_date TEXT,
    freshness_duration INTEGER DEFAULT 7,
    certification TEXT DEFAULT 'Standard',
    ipfs_hash TEXT,
    ipfs_certificate_hash TEXT,
    certificate_data_hash TEXT,
    blockchain_id TEXT,
    blockchain_batch_id TEXT,
    blockchain_hash TEXT,
    initial_transaction_hash TEXT,
    lab_test_results TEXT,
    crop_analysis JSONB,
    soil_data JSONB,
    quality_score NUMERIC,
    qr_code_url TEXT,
    is_split BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT batches_farmer_id_fkey FOREIGN KEY (farmer_id) REFERENCES public.profiles(id) ON DELETE SET NULL,
    CONSTRAINT batches_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE SET NULL
);

-- Add additive columns if batches existed in previous migrations
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS crop_type TEXT;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS crop TEXT;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS harvest_quantity NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS quantity NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS quality_grade TEXT DEFAULT 'Standard';
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS farmer_registry_id TEXT REFERENCES public.farmers(id) ON DELETE SET NULL;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS farmer_name TEXT;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS current_owner_name TEXT;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'kg';
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS parent_lot_id TEXT REFERENCES public.batches(id) ON DELETE SET NULL;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS weighment_scale_id TEXT;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS certificate_ref TEXT;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS assisted_by_helper_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS qr_code_url TEXT;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS blockchain_hash TEXT;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS is_split BOOLEAN DEFAULT false;

-- Safely convert current_owner from UUID to TEXT if it was created as UUID in legacy schema
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'batches' AND column_name = 'current_owner' AND data_type = 'uuid'
    ) THEN
        ALTER TABLE public.batches DROP CONSTRAINT IF EXISTS batches_current_owner_fkey;
        ALTER TABLE public.batches ALTER COLUMN current_owner TYPE TEXT USING current_owner::text;
    END IF;
END $$;

-- Expand status check constraint to support all frontend workflows & legacy values
ALTER TABLE public.batches DROP CONSTRAINT IF EXISTS batches_status_check;
ALTER TABLE public.batches ADD CONSTRAINT batches_status_check CHECK (
    status IN (
        'Active', 'Under Offer', 'Sold', 'Split', 'In Transit', 'Delivered', 
        'available', 'Draft', 'Registered', 'Inspection_Pending', 'Assessed', 'Listed'
    )
);

CREATE INDEX IF NOT EXISTS idx_batches_farmer_id ON public.batches(farmer_id);
CREATE INDEX IF NOT EXISTS idx_batches_current_owner ON public.batches(current_owner);
CREATE INDEX IF NOT EXISTS idx_batches_parent_lot_id ON public.batches(parent_lot_id);
CREATE INDEX IF NOT EXISTS idx_batches_status ON public.batches(status);
CREATE INDEX IF NOT EXISTS idx_batches_certificate_ref ON public.batches(certificate_ref);

DROP TRIGGER IF EXISTS trg_batches_updated_at ON public.batches;
CREATE TRIGGER trg_batches_updated_at
BEFORE UPDATE ON public.batches
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 7. FPO POOLED BATCHES & BLENDING: lot_components
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lot_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_lot_id TEXT NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    source_lot_id TEXT NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    source_farmer_name TEXT NOT NULL,
    quantity NUMERIC(12,2) NOT NULL,
    percentage NUMERIC(5,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_lot_components UNIQUE (parent_lot_id, source_lot_id)
);

-- Ensure unique constraint exists on (parent_lot_id, source_lot_id) even if table was created in an earlier migration
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'uq_lot_components'
    ) THEN
        DELETE FROM public.lot_components a USING public.lot_components b
        WHERE a.ctid < b.ctid 
          AND a.parent_lot_id = b.parent_lot_id 
          AND a.source_lot_id = b.source_lot_id;

        ALTER TABLE public.lot_components 
        ADD CONSTRAINT uq_lot_components UNIQUE (parent_lot_id, source_lot_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_lot_components_parent ON public.lot_components(parent_lot_id);
CREATE INDEX IF NOT EXISTS idx_lot_components_source ON public.lot_components(source_lot_id);

-- ------------------------------------------------------------------------------
-- 8. 3-TIER EVIDENCE LEDGER: evidence_items
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.evidence_items (
    id TEXT PRIMARY KEY DEFAULT ('EV-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 6))),
    lot_id TEXT NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    farmer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    farmer_name TEXT,
    type TEXT NOT NULL CHECK (type IN (
        'Weighment', 'Moisture Test', 'Quality Certificate', 'Field Photo', 'Scale Receipt'
    )),
    category TEXT NOT NULL CHECK (category IN (
        'Farmer Declared', 'Evidence Backed', 'Externally Verified'
    )),
    title TEXT NOT NULL,
    value TEXT NOT NULL,
    source TEXT NOT NULL,
    status TEXT DEFAULT 'Pending' CHECK (status IN (
        'Pending', 'Reviewed', 'Verified', 'Needs Review'
    )),
    issuer TEXT,
    document_ref TEXT,
    file_url TEXT,
    ipfs_hash TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_items_lot ON public.evidence_items(lot_id);
CREATE INDEX IF NOT EXISTS idx_evidence_items_status ON public.evidence_items(status);
CREATE INDEX IF NOT EXISTS idx_evidence_items_category ON public.evidence_items(category);

DROP TRIGGER IF EXISTS trg_evidence_items_updated_at ON public.evidence_items;
CREATE TRIGGER trg_evidence_items_updated_at
BEFORE UPDATE ON public.evidence_items
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 9. QUALITY ASSURANCE BUREAU: quality_assessments
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quality_assessments (
    id TEXT PRIMARY KEY DEFAULT ('QA-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 6))),
    lot_id TEXT NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    crop TEXT NOT NULL,
    moisture_percent NUMERIC(5,2) NOT NULL,
    foreign_matter_percent NUMERIC(5,2) NOT NULL,
    visible_spoilage TEXT NOT NULL CHECK (visible_spoilage IN ('None', 'Low', 'Moderate', 'High')),
    assigned_grade TEXT NOT NULL CHECK (assigned_grade IN ('Grade A', 'Grade B', 'Standard', 'Grade C', 'Export Grade', 'Rejected')),
    method TEXT NOT NULL,
    assessed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    report_notes TEXT,
    certificate_ref TEXT,
    sha256_hash TEXT,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Certified', 'Rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quality_assessments_lot ON public.quality_assessments(lot_id);
CREATE INDEX IF NOT EXISTS idx_quality_assessments_status ON public.quality_assessments(status);

DROP TRIGGER IF EXISTS trg_quality_assessments_updated_at ON public.quality_assessments;
CREATE TRIGGER trg_quality_assessments_updated_at
BEFORE UPDATE ON public.quality_assessments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 10. COLLECTION CENTER ARRIVALS & WEIGHMENT: collection_arrivals
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.collection_arrivals (
    id TEXT PRIMARY KEY DEFAULT ('ARR-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 6))),
    farmer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    farmer_registry_id TEXT REFERENCES public.farmers(id) ON DELETE SET NULL,
    farmer_name TEXT NOT NULL,
    crop TEXT NOT NULL,
    variety TEXT NOT NULL,
    declared_quantity NUMERIC(12,2) NOT NULL,
    measured_quantity NUMERIC(12,2) NOT NULL,
    unit TEXT NOT NULL DEFAULT 'kg',
    scale_id TEXT NOT NULL,
    scale_photo_url TEXT,
    moisture_percent NUMERIC(5,2),
    quality_grade TEXT DEFAULT 'Standard' CHECK (quality_grade IN ('Grade A', 'Grade B', 'Standard', 'Grade C', 'Export Grade')),
    status TEXT DEFAULT 'Checked In' CHECK (status IN (
        'Checked In', 'Weighed', 'Lot Created', 'Handed Over'
    )),
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collection_arrivals_farmer ON public.collection_arrivals(farmer_id);
CREATE INDEX IF NOT EXISTS idx_collection_arrivals_status ON public.collection_arrivals(status);

DROP TRIGGER IF EXISTS trg_collection_arrivals_updated_at ON public.collection_arrivals;
CREATE TRIGGER trg_collection_arrivals_updated_at
BEFORE UPDATE ON public.collection_arrivals
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 11. FPO COOPERATIVE SHAREHOLDERS: fpo_members
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fpo_members (
    id TEXT PRIMARY KEY DEFAULT ('MEM-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 6))),
    fpo_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farmer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    farmer_registry_id TEXT REFERENCES public.farmers(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    village TEXT NOT NULL,
    crops TEXT[] NOT NULL DEFAULT '{}',
    share_holding INTEGER NOT NULL DEFAULT 1,
    total_contributed_kg NUMERIC(12,2) DEFAULT 0,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Pending')),
    joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fpo_members_fpo ON public.fpo_members(fpo_id);
CREATE INDEX IF NOT EXISTS idx_fpo_members_farmer ON public.fpo_members(farmer_id);

-- ------------------------------------------------------------------------------
-- 12. B2B MARKETPLACE: marketplace
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.marketplace (
    id BIGSERIAL PRIMARY KEY,
    batch_id TEXT REFERENCES public.batches(id) ON DELETE CASCADE,
    current_seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    current_seller_type TEXT,
    price NUMERIC(15,2),
    price_per_kg NUMERIC(15,2),
    quantity NUMERIC(12,2),
    listing_title TEXT,
    status TEXT DEFAULT 'available',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.marketplace ADD COLUMN IF NOT EXISTS price_per_kg NUMERIC(15,2);
ALTER TABLE public.marketplace ADD COLUMN IF NOT EXISTS listing_title TEXT;

-- Safely expand marketplace check constraints to allow 'fpo' and active statuses
ALTER TABLE public.marketplace DROP CONSTRAINT IF EXISTS marketplace_current_seller_type_check;
ALTER TABLE public.marketplace ADD CONSTRAINT marketplace_current_seller_type_check CHECK (
    current_seller_type IN ('farmer', 'distributor', 'retailer', 'fpo')
);

ALTER TABLE public.marketplace DROP CONSTRAINT IF EXISTS marketplace_status_check;
ALTER TABLE public.marketplace ADD CONSTRAINT marketplace_status_check CHECK (
    status IN ('available', 'sold', 'delisted', 'cancelled', 'Active', 'Under Offer', 'Pending')
);

CREATE INDEX IF NOT EXISTS idx_marketplace_batch ON public.marketplace(batch_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_status ON public.marketplace(status);

DROP TRIGGER IF EXISTS trg_marketplace_updated_at ON public.marketplace;
CREATE TRIGGER trg_marketplace_updated_at
BEFORE UPDATE ON public.marketplace
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 13. PROCUREMENT OFFERS & NEGOTIATION: offers
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.offers (
    id TEXT PRIMARY KEY DEFAULT ('OF-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 6))),
    lot_id TEXT NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    buyer_name TEXT NOT NULL,
    buyer_type TEXT NOT NULL,
    offered_quantity NUMERIC(12,2) NOT NULL,
    unit TEXT NOT NULL DEFAULT 'kg',
    price_per_kg NUMERIC(12,2) NOT NULL,
    gross_value NUMERIC(15,2) NOT NULL,
    deductions JSONB DEFAULT '{"transport":0,"loading":0,"commission":0,"platformFee":0,"other":0}'::jsonb,
    total_deductions NUMERIC(15,2) DEFAULT 0,
    expected_net NUMERIC(15,2) NOT NULL,
    offer_deadline TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Rejected', 'Expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offers_lot ON public.offers(lot_id);
CREATE INDEX IF NOT EXISTS idx_offers_buyer ON public.offers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON public.offers(status);

DROP TRIGGER IF EXISTS trg_offers_updated_at ON public.offers;
CREATE TRIGGER trg_offers_updated_at
BEFORE UPDATE ON public.offers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 14. MILESTONE ESCROW & SETTLEMENTS: payments
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY DEFAULT ('PY-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 6))),
    offer_id TEXT NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
    lot_id TEXT NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    payer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    payee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    payer_name TEXT NOT NULL,
    payee_name TEXT NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    current_stage TEXT DEFAULT 'Offer Accepted' CHECK (current_stage IN (
        'Offer Accepted', 'Goods Handed Over', 'Payment Due', 
        'Payment Initiated', 'Reference Submitted', 'Farmer Confirmation', 'Closed'
    )),
    status TEXT DEFAULT 'Pending' CHECK (status IN (
        'Pending', 'Due', 'Initiated', 'Reference Submitted', 
        'Received', 'Overdue', 'Dispute', 'Resolved', 'Closed'
    )),
    transaction_ref TEXT,
    timeline JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_offer ON public.payments(offer_id);
CREATE INDEX IF NOT EXISTS idx_payments_lot ON public.payments(lot_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

DROP TRIGGER IF EXISTS trg_payments_updated_at ON public.payments;
CREATE TRIGGER trg_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 15. ARBITRATION & DISPUTES: disputes
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.disputes (
    id TEXT PRIMARY KEY DEFAULT ('DP-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 6))),
    lot_id TEXT NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    farmer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    farmer_name TEXT NOT NULL,
    buyer_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'Weight Mismatch', 'Quality Grade', 'Payment Delay', 'Delivery Dispute'
    )),
    description TEXT NOT NULL,
    evidence TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'Open' CHECK (status IN (
        'Open', 'Under Review', 'Waiting for Evidence', 'Resolved', 'Closed'
    )),
    resolution_timeline JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disputes_lot ON public.disputes(lot_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.disputes(status);

DROP TRIGGER IF EXISTS trg_disputes_updated_at ON public.disputes;
CREATE TRIGGER trg_disputes_updated_at
BEFORE UPDATE ON public.disputes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 16. PLATFORM SURVEILLANCE: admin_alerts
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_alerts (
    id TEXT PRIMARY KEY DEFAULT ('ALT-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 6))),
    severity TEXT NOT NULL CHECK (severity IN ('High', 'Medium', 'Low')),
    category TEXT NOT NULL CHECK (category IN (
        'QR Anomaly', 'Duplicate Lot', 'Payment Delay', 'Deduction Discrepancy', 'Scale Miscalibration'
    )),
    description TEXT NOT NULL,
    related_entity_id TEXT NOT NULL,
    status TEXT DEFAULT 'Investigating' CHECK (status IN ('Investigating', 'Resolved', 'Ignored')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_alerts_severity ON public.admin_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_status ON public.admin_alerts(status);

-- ------------------------------------------------------------------------------
-- 17. SYSTEM NOTIFICATIONS: notifications
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN (
        'Offer', 'Payment', 'Lot', 'Evidence', 'Dispute', 'Farmer activity', 'System'
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    link TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read);

-- ------------------------------------------------------------------------------
-- 18. DOWNSTREAM INVENTORY: distributor_inventory & retailer_inventory
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.distributor_inventory (
    id BIGSERIAL PRIMARY KEY,
    distributor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    marketplace_id BIGINT REFERENCES public.marketplace(id) ON DELETE SET NULL,
    lot_id TEXT REFERENCES public.batches(id) ON DELETE SET NULL,
    crop TEXT,
    quantity_purchased NUMERIC(12,2),
    purchase_price NUMERIC(15,2),
    warehouse_location TEXT,
    storage_temp_c NUMERIC,
    status TEXT DEFAULT 'In Storage',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.distributor_inventory ADD COLUMN IF NOT EXISTS lot_id TEXT REFERENCES public.batches(id) ON DELETE SET NULL;
ALTER TABLE public.distributor_inventory ADD COLUMN IF NOT EXISTS crop TEXT;
ALTER TABLE public.distributor_inventory ADD COLUMN IF NOT EXISTS warehouse_location TEXT;
ALTER TABLE public.distributor_inventory ADD COLUMN IF NOT EXISTS storage_temp_c NUMERIC;
ALTER TABLE public.distributor_inventory ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'In Storage';

CREATE TABLE IF NOT EXISTS public.retailer_inventory (
    id BIGSERIAL PRIMARY KEY,
    retailer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    marketplace_id BIGINT REFERENCES public.marketplace(id) ON DELETE SET NULL,
    lot_id TEXT REFERENCES public.batches(id) ON DELETE SET NULL,
    crop TEXT,
    quantity_purchased NUMERIC(12,2),
    purchase_price NUMERIC(15,2),
    store_location TEXT,
    shelf_section TEXT,
    qr_code_url TEXT,
    status TEXT DEFAULT 'On Shelf',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.retailer_inventory ADD COLUMN IF NOT EXISTS lot_id TEXT REFERENCES public.batches(id) ON DELETE SET NULL;
ALTER TABLE public.retailer_inventory ADD COLUMN IF NOT EXISTS crop TEXT;
ALTER TABLE public.retailer_inventory ADD COLUMN IF NOT EXISTS store_location TEXT;
ALTER TABLE public.retailer_inventory ADD COLUMN IF NOT EXISTS shelf_section TEXT;
ALTER TABLE public.retailer_inventory ADD COLUMN IF NOT EXISTS qr_code_url TEXT;
ALTER TABLE public.retailer_inventory ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'On Shelf';

-- ------------------------------------------------------------------------------
-- 19. VERIFIABLE TRANSACTION LEDGER: transactions
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
    id BIGSERIAL PRIMARY KEY,
    transaction_id TEXT UNIQUE NOT NULL,
    batch_id TEXT REFERENCES public.batches(id) ON DELETE CASCADE,
    type TEXT,
    crop TEXT,
    counterparty TEXT,
    quantity NUMERIC(12,2),
    price NUMERIC(15,2),
    amount NUMERIC(15,2),
    status TEXT DEFAULT 'Completed',
    date TEXT,
    from_address TEXT,
    to_address TEXT,
    transaction_timestamp TIMESTAMPTZ DEFAULT NOW(),
    previous_transaction_hash TEXT,
    ipfs_hash TEXT,
    blockchain_hash TEXT,
    product_details JSONB,
    metadata JSONB,
    buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    transaction_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure additive columns exist if table was already created in a previous migration:
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS crop TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS counterparty TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS amount NUMERIC(15,2);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Completed';
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS date TEXT;

-- CRITICAL FIX: Safely drop legacy check constraints that restrict transaction types or statuses:
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check CHECK (
    type IN (
        'Sale', 'Purchase', 'Transfer', 'Settlement', 'Fee',
        'HARVEST', 'PURCHASE', 'TRANSFER', 'PROCESSING', 'RETAIL',
        'Harvest', 'Processing', 'Retail'
    )
);

ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_status_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_status_check CHECK (
    status IN ('Completed', 'Pending', 'In Escrow')
);

CREATE INDEX IF NOT EXISTS idx_transactions_tx_id ON public.transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_batch_id ON public.transactions(batch_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);

-- ------------------------------------------------------------------------------
-- 20. PRESERVED LEGACY SUPPORT TABLES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.group_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id TEXT REFERENCES public.batches(id) ON DELETE CASCADE,
    group_id TEXT,
    file_name TEXT,
    file_size BIGINT,
    transaction_type TEXT,
    metadata JSONB,
    ipfs_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.delivery_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id TEXT,
    batch_id TEXT REFERENCES public.batches(id) ON DELETE CASCADE,
    source_location JSONB NOT NULL,
    destination_location JSONB NOT NULL,
    quantity_kg NUMERIC(12,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    assigned_driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    delivery_fee NUMERIC(10,2) DEFAULT 0,
    payment_status TEXT DEFAULT 'pending',
    delivery_deadline TIMESTAMPTZ,
    preferred_time_window JSONB,
    urgency_score NUMERIC DEFAULT 0,
    delivered_on_time BOOLEAN,
    pod_signature TEXT,
    pod_photos TEXT[],
    pod_timestamp TIMESTAMPTZ,
    pod_location JSONB,
    buyer_confirmation BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.delivery_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_request_id UUID REFERENCES public.delivery_requests(id) ON DELETE CASCADE,
    batch_id TEXT REFERENCES public.batches(id) ON DELETE CASCADE,
    quantity_kg NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.delivery_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_request_id UUID REFERENCES public.delivery_requests(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    payment_status TEXT DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.driver_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    vehicle_type TEXT,
    vehicle_capacity_kg NUMERIC(12,2) DEFAULT 1000,
    vehicle_registration_number TEXT,
    driver_license_number TEXT,
    vehicle_number TEXT,
    license_number TEXT,
    vehicle_equipment TEXT[],
    working_hours JSONB,
    is_available BOOLEAN DEFAULT true,
    service_radius_km NUMERIC DEFAULT 50,
    current_lat NUMERIC,
    current_lng NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.driver_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    delivery_request_id UUID REFERENCES public.delivery_requests(id) ON DELETE CASCADE,
    notification_type TEXT DEFAULT 'new_delivery',
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.voicegenie_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_sid TEXT UNIQUE,
    phone_number TEXT NOT NULL,
    language TEXT DEFAULT 'en',
    call_duration_seconds INTEGER,
    recording_url TEXT,
    transcript TEXT,
    structured_intent JSONB,
    status TEXT DEFAULT 'in_progress',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.voicegenie_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID REFERENCES public.voicegenie_calls(id) ON DELETE SET NULL,
    farmer_phone TEXT NOT NULL,
    raw_payload JSONB NOT NULL,
    extracted_crop_data JSONB NOT NULL,
    status TEXT DEFAULT 'pending',
    helper_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    helper_notes TEXT,
    rejection_reason TEXT,
    reviewed_at TIMESTAMPTZ,
    registered_at TIMESTAMPTZ,
    batch_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 21. AUTH TRIGGER FUNCTION (Auto-create Profile)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        user_id,
        full_name,
        email,
        phone,
        user_type,
        state,
        district,
        preferred_language,
        organization,
        role,
        is_verified,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        NEW.raw_user_meta_data->>'phone',
        COALESCE(NEW.raw_user_meta_data->>'user_type', 'farmer'),
        NEW.raw_user_meta_data->>'state',
        NEW.raw_user_meta_data->>'district',
        COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en'),
        NEW.raw_user_meta_data->>'organization',
        COALESCE(NEW.raw_user_meta_data->>'user_type', 'farmer'),
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = COALESCE(EXCLUDED.phone, profiles.phone),
        user_type = EXCLUDED.user_type,
        organization = COALESCE(EXCLUDED.organization, profiles.organization),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 22. SUPABASE STORAGE BUCKETS (Safe Configuration)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES 
        ('evidence-docs', 'evidence-docs', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
        ('lot-certificates', 'lot-certificates', true, 15728640, ARRAY['application/pdf']),
        ('scale-telemetry', 'scale-telemetry', false, 5242880, ARRAY['image/jpeg', 'image/png']),
        ('delivery-pod', 'delivery-pod', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
        ('user-avatars', 'user-avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
        ('evidence-photos', 'evidence-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
        ('lot-documents', 'lot-documents', true, 15728640, ARRAY['application/pdf']),
        ('quality-reports', 'quality-reports', true, 15728640, ARRAY['application/pdf']),
        ('qr-codes', 'qr-codes', true, 5242880, ARRAY['image/png', 'image/svg+xml'])
    ON CONFLICT (id) DO UPDATE SET
        public = EXCLUDED.public,
        file_size_limit = EXCLUDED.file_size_limit,
        allowed_mime_types = EXCLUDED.allowed_mime_types;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Notice: Direct storage.buckets insertion skipped or restricted. Buckets can be configured via Supabase Storage UI.';
END $$;

-- ==============================================================================
-- 23. DEMO AUTHENTICATION USERS (auth.users)
-- ==============================================================================
-- Fixed UUIDs for the 8 Core Personas + 2 Aliases:
-- 1. Farmer:          e1000000-0000-0000-0000-000000000001 (farmer@farmly.demo)
-- 2. Helper:          e1000000-0000-0000-0000-000000000002 (helper@farmly.demo)
-- 3. FPO:             e1000000-0000-0000-0000-000000000003 (fpo@farmly.demo)
-- 4. Collector:       e1000000-0000-0000-0000-000000000004 (collector@farmly.demo)
-- 5. QA:              e1000000-0000-0000-0000-000000000005 (qa@farmly.demo)
-- 6. Distributor:     e1000000-0000-0000-0000-000000000006 (distributor@farmly.demo)
-- 7. Retailer:        e1000000-0000-0000-0000-000000000007 (retailer@farmly.demo)
-- 8. Admin:           e1000000-0000-0000-0000-000000000008 (admin@farmly.demo)
-- 9. Collector Alias: e1000000-0000-0000-0000-000000000014 (collection@farmly.demo)
-- 10. QA Alias:       e1000000-0000-0000-0000-000000000015 (quality@farmly.demo)

-- Password 'Farmly@123' hashed using bcrypt
DO $$
DECLARE
    pwd_hash TEXT := crypt('Farmly@123', gen_salt('bf', 10));
BEGIN
    -- 1. FARMER
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', 'e1000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated',
        'farmer@farmly.demo', pwd_hash, NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Ramesh Patil","user_type":"farmer","mobile":"9876543210","state":"Maharashtra","district":"Nashik","preferred_language":"mr","organization":"Sahyadri Farmers Producer Co-op"}'::jsonb,
        NOW(), NOW()
    ) ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password, raw_user_meta_data = EXCLUDED.raw_user_meta_data;

    -- 2. HELPER
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', 'e1000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated',
        'helper@farmly.demo', pwd_hash, NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Priya Sharma","user_type":"helper","mobile":"9876500001","state":"Maharashtra","district":"Nashik","preferred_language":"mr","organization":"Sinnar FPO Field Assistance Desk"}'::jsonb,
        NOW(), NOW()
    ) ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password, raw_user_meta_data = EXCLUDED.raw_user_meta_data;

    -- 3. FPO
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', 'e1000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated',
        'fpo@farmly.demo', pwd_hash, NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Sahyadri Farmers Producer Co-op","user_type":"fpo","mobile":"9822011223","state":"Maharashtra","district":"Nashik","preferred_language":"mr","organization":"Sahyadri Agro Federation"}'::jsonb,
        NOW(), NOW()
    ) ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password, raw_user_meta_data = EXCLUDED.raw_user_meta_data;

    -- 4. COLLECTOR
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', 'e1000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated',
        'collector@farmly.demo', pwd_hash, NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Sinnar Mandi Collection Center","user_type":"collection_center","mobile":"9850022334","state":"Maharashtra","district":"Nashik","preferred_language":"mr","organization":"Nashik APMC Aggregation Hub"}'::jsonb,
        NOW(), NOW()
    ) ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password, raw_user_meta_data = EXCLUDED.raw_user_meta_data;

    -- 5. QA
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', 'e1000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated',
        'qa@farmly.demo', pwd_hash, NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Suresh Deshmukh (FPO Assessor)","user_type":"quality_assessor","mobile":"9860033445","state":"Maharashtra","district":"Nashik","preferred_language":"mr","organization":"Maharashtra Quality Certification Bureau"}'::jsonb,
        NOW(), NOW()
    ) ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password, raw_user_meta_data = EXCLUDED.raw_user_meta_data;

    -- 6. DISTRIBUTOR
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', 'e1000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated',
        'distributor@farmly.demo', pwd_hash, NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"GreenHarvest Distributors","user_type":"distributor","mobile":"9898012345","state":"Maharashtra","district":"Nashik","preferred_language":"en","organization":"GreenHarvest Wholesale Logistics"}'::jsonb,
        NOW(), NOW()
    ) ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password, raw_user_meta_data = EXCLUDED.raw_user_meta_data;

    -- 7. RETAILER
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', 'e1000000-0000-0000-0000-000000000007', 'authenticated', 'authenticated',
        'retailer@farmly.demo', pwd_hash, NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Gramin Superstore","user_type":"retailer","mobile":"9825098765","state":"Maharashtra","district":"Mumbai","preferred_language":"en","organization":"Gramin Retail Agri-Outlets"}'::jsonb,
        NOW(), NOW()
    ) ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password, raw_user_meta_data = EXCLUDED.raw_user_meta_data;

    -- 8. ADMIN
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', 'e1000000-0000-0000-0000-000000000008', 'authenticated', 'authenticated',
        'admin@farmly.demo', pwd_hash, NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"KisanSetu Platform Auditor","user_type":"admin","mobile":"9890099887","state":"Maharashtra","district":"Pune","preferred_language":"en","organization":"Farmly National Audit Committee"}'::jsonb,
        NOW(), NOW()
    ) ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password, raw_user_meta_data = EXCLUDED.raw_user_meta_data;

    -- 9. COLLECTOR ALIAS (collection@farmly.demo)
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', 'e1000000-0000-0000-0000-000000000014', 'authenticated', 'authenticated',
        'collection@farmly.demo', pwd_hash, NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Sinnar Mandi Collection Center","user_type":"collection_center","mobile":"9850022334","state":"Maharashtra","district":"Nashik","preferred_language":"mr","organization":"Nashik APMC Aggregation Hub"}'::jsonb,
        NOW(), NOW()
    ) ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password, raw_user_meta_data = EXCLUDED.raw_user_meta_data;

    -- 10. QA ALIAS (quality@farmly.demo)
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', 'e1000000-0000-0000-0000-000000000015', 'authenticated', 'authenticated',
        'quality@farmly.demo', pwd_hash, NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Suresh Deshmukh (FPO Assessor)","user_type":"quality_assessor","mobile":"9860033445","state":"Maharashtra","district":"Nashik","preferred_language":"mr","organization":"Maharashtra Quality Certification Bureau"}'::jsonb,
        NOW(), NOW()
    ) ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password, raw_user_meta_data = EXCLUDED.raw_user_meta_data;
END $$;

-- ------------------------------------------------------------------------------
-- 24. SEED: profiles (Deterministic Master Profiles)
-- ------------------------------------------------------------------------------
INSERT INTO public.profiles (
    id, user_id, full_name, email, phone, user_type, state, district, preferred_language, organization, role, is_verified
) VALUES
    ('e1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'Ramesh Patil', 'farmer@farmly.demo', '9876543210', 'farmer', 'Maharashtra', 'Nashik', 'mr', 'Sahyadri Farmers Producer Co-op', 'farmer', true),
    ('e1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000002', 'Priya Sharma', 'helper@farmly.demo', '9876500001', 'helper', 'Maharashtra', 'Nashik', 'mr', 'Sinnar FPO Field Assistance Desk', 'helper', true),
    ('e1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000003', 'Sahyadri Farmers Producer Co-op', 'fpo@farmly.demo', '9822011223', 'fpo', 'Maharashtra', 'Nashik', 'mr', 'Sahyadri Agro Federation', 'fpo', true),
    ('e1000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000004', 'Sinnar Mandi Collection Center', 'collector@farmly.demo', '9850022334', 'collection_center', 'Maharashtra', 'Nashik', 'mr', 'Nashik APMC Aggregation Hub', 'collection_center', true),
    ('e1000000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000005', 'Suresh Deshmukh (FPO Assessor)', 'qa@farmly.demo', '9860033445', 'quality_assessor', 'Maharashtra', 'Nashik', 'mr', 'Maharashtra Quality Certification Bureau', 'quality_assessor', true),
    ('e1000000-0000-0000-0000-000000000006', 'e1000000-0000-0000-0000-000000000006', 'GreenHarvest Distributors', 'distributor@farmly.demo', '9898012345', 'distributor', 'Maharashtra', 'Nashik', 'en', 'GreenHarvest Wholesale Logistics', 'distributor', true),
    ('e1000000-0000-0000-0000-000000000007', 'e1000000-0000-0000-0000-000000000007', 'Gramin Superstore', 'retailer@farmly.demo', '9825098765', 'retailer', 'Maharashtra', 'Mumbai', 'en', 'Gramin Retail Agri-Outlets', 'retailer', true),
    ('e1000000-0000-0000-0000-000000000008', 'e1000000-0000-0000-0000-000000000008', 'KisanSetu Platform Auditor', 'admin@farmly.demo', '9890099887', 'admin', 'Maharashtra', 'Pune', 'en', 'Farmly National Audit Committee', 'admin', true),
    ('e1000000-0000-0000-0000-000000000014', 'e1000000-0000-0000-0000-000000000014', 'Sinnar Mandi Collection Center', 'collection@farmly.demo', '9850022334', 'collection_center', 'Maharashtra', 'Nashik', 'mr', 'Nashik APMC Aggregation Hub', 'collection_center', true),
    ('e1000000-0000-0000-0000-000000000015', 'e1000000-0000-0000-0000-000000000015', 'Suresh Deshmukh (FPO Assessor)', 'quality@farmly.demo', '9860033445', 'quality_assessor', 'Maharashtra', 'Nashik', 'mr', 'Maharashtra Quality Certification Bureau', 'quality_assessor', true)
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    user_type = EXCLUDED.user_type,
    organization = EXCLUDED.organization,
    is_verified = true;

-- ------------------------------------------------------------------------------
-- 25. SEED: farmers (Assisted Farmer Directory)
-- ------------------------------------------------------------------------------
INSERT INTO public.farmers (
    id, profile_id, name, mobile, village, taluka, district, state, language, farming_category, fpo, consent, verification_level, status, assisted_by_helper_id, last_activity
) VALUES
    ('FMR-MH-000421', 'e1000000-0000-0000-0000-000000000001', 'Ramesh Patil', '9876543210', 'Sinnar', 'Sinnar', 'Nashik', 'Maharashtra', 'Marathi', 'Crops & Vegetables', 'Sahyadri Farmers Producer Co-op', true, 'Field Verified', 'Active', 'e1000000-0000-0000-0000-000000000002', '2026-09-17 09:42:00+05:30'),
    ('FM-10294', NULL, 'Ganesh Jagtap', '9822114455', 'Dindori', 'Dindori', 'Nashik', 'Maharashtra', 'Marathi', 'Horticulture & Fruits', 'Sahyadri Farmers Producer Co-op', true, 'Field Verified', 'Active', 'e1000000-0000-0000-0000-000000000002', '2026-09-17 11:20:00+05:30'),
    ('FM-10295', NULL, 'Sunita Deshmukh', '9765432109', 'Niphad', 'Niphad', 'Nashik', 'Maharashtra', 'Marathi', 'Pulses & Oilseeds', 'Godavari Valley FPO', true, 'Identity Confirmed', 'Active', 'e1000000-0000-0000-0000-000000000002', '2026-09-16 16:05:00+05:30'),
    ('FM-10296', NULL, 'Babu Rao Shinde', '9890123456', 'Yeola', 'Yeola', 'Nashik', 'Maharashtra', 'Hindi', 'Spices & Condiments', 'Sahyadri Farmers Producer Co-op', true, 'Basic', 'Pending', 'e1000000-0000-0000-0000-000000000002', '2026-09-15 14:15:00+05:30'),
    ('FM-10297', NULL, 'Kavita Chougule', '9422334455', 'Chandwad', 'Chandwad', 'Nashik', 'Maharashtra', 'Marathi', 'Organic Farming', 'Sahyadri Farmers Producer Co-op', true, 'Field Verified', 'Active', 'e1000000-0000-0000-0000-000000000002', '2026-09-14 10:00:00+05:30'),
    ('FM-10298', NULL, 'Anand More', '9158001122', 'Deola', 'Deola', 'Nashik', 'Maharashtra', 'Marathi', 'Cash Crops', 'North Maharashtra Agro FPO', true, 'Basic', 'Needs Review', 'e1000000-0000-0000-0000-000000000002', '2026-09-13 15:40:00+05:30')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    mobile = EXCLUDED.mobile,
    status = EXCLUDED.status,
    verification_level = EXCLUDED.verification_level;

-- ------------------------------------------------------------------------------
-- 26. SEED: crop_availabilities (Standing Crops)
-- ------------------------------------------------------------------------------
INSERT INTO public.crop_availabilities (
    id, farmer_id, farmer_registry_id, farmer_name, crop, variety, estimated_quantity, unit, expected_harvest_date, location, notes, status, created_at
) VALUES
    ('CA-MH-042', 'e1000000-0000-0000-0000-000000000001', 'FMR-MH-000421', 'Ramesh Patil', 'Sharbati Wheat', 'Lokwan / C-306', 500, 'kg', '2026-09-10', 'Sinnar, Nashik, Maharashtra', 'Organically enriched black soil plot; zero synthetic pesticide spray.', 'Available', '2026-09-01 09:00:00+05:30'),
    ('CA-MH-043', 'e1000000-0000-0000-0000-000000000001', 'FMR-MH-000421', 'Ramesh Patil', 'Red Onion', 'Gavran Nashik Red', 1200, 'kg', '2026-09-28', 'Sinnar Farm Plot 2B, Nashik', 'Kharif late season onion, expected moisture <14% at curing.', 'Under Review', '2026-09-05 10:30:00+05:30')
ON CONFLICT (id) DO UPDATE SET
    estimated_quantity = EXCLUDED.estimated_quantity,
    status = EXCLUDED.status;

-- ------------------------------------------------------------------------------
-- 27. SEED: batches (Primary Lots, Split Sub-Lots, and Aggregations)
-- ------------------------------------------------------------------------------
INSERT INTO public.batches (
    id, farmer_id, farmer_registry_id, farmer_name, user_id, current_owner, current_owner_name, crop_type, crop, variety, harvest_quantity, quantity, unit, price_per_kg, total_price, grading, quality_grade, location, status, parent_lot_id, weighment_scale_id, certificate_ref, assisted_by_helper_id, created_at
) VALUES
    -- 1. Root Primary Lot (Ramesh Patil - Harvest Intake)
    ('KS-MH-NSK-WHT-20260910-00125', 'e1000000-0000-0000-0000-000000000001', 'FMR-MH-000421', 'Ramesh Patil', 'e1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'Ramesh Patil (Farmer)', 'Sharbati Wheat', 'Sharbati Wheat', 'Lokwan C-306', 492.4, 492.4, 'kg', 54.0, 26589.60, 'Grade A', 'Grade A', 'Sinnar FPO Collection Center #3, Nashik', 'Sold', NULL, 'FPO-SIN-03', 'QC-MH-NSK-2026-0910', 'e1000000-0000-0000-0000-000000000002', '2026-09-10 10:15:00+05:30'),
    
    -- 2. Wholesale Split Parent Lot (Distributor Warehouse Pool)
    ('KS-MH-NSK-WHT-20260910-00125-D1', 'e1000000-0000-0000-0000-000000000001', 'FMR-MH-000421', 'Ramesh Patil', 'e1000000-0000-0000-0000-000000000006', 'e1000000-0000-0000-0000-000000000006', 'GreenHarvest Distributors', 'Sharbati Wheat', 'Sharbati Wheat', 'Lokwan C-306', 250.0, 250.0, 'kg', 54.0, 13500.00, 'Grade A', 'Grade A', 'Bhiwandi Central Agro Warehouse - Bay 12', 'Split', 'KS-MH-NSK-WHT-20260910-00125', 'FPO-SIN-03', 'QC-MH-NSK-2026-0910', 'e1000000-0000-0000-0000-000000000002', '2026-09-11 10:30:00+05:30'),
    
    -- 3. Retail Sub-Lot 1 (Store Shelf Pack - Gramin Superstore)
    ('KS-MH-NSK-WHT-20260910-00125-D1-R1', 'e1000000-0000-0000-0000-000000000001', 'FMR-MH-000421', 'Ramesh Patil', 'e1000000-0000-0000-0000-000000000007', 'e1000000-0000-0000-0000-000000000007', 'Gramin Superstore (Retail Shelf)', 'Sharbati Wheat', 'Sharbati Wheat', 'Lokwan C-306', 200.0, 200.0, 'kg', 58.0, 11600.00, 'Grade A', 'Grade A', 'Gramin Superstore - Bandra West, Mumbai', 'Active', 'KS-MH-NSK-WHT-20260910-00125-D1', 'FPO-SIN-03', 'QC-MH-NSK-2026-0910', 'e1000000-0000-0000-0000-000000000002', '2026-09-12 11:00:00+05:30'),
    
    -- 4. Retail Sub-Lot 2 (E-Commerce Pack)
    ('KS-MH-NSK-WHT-20260910-00125-D1-R2', 'e1000000-0000-0000-0000-000000000001', 'FMR-MH-000421', 'Ramesh Patil', 'e1000000-0000-0000-0000-000000000007', 'e1000000-0000-0000-0000-000000000007', 'Gramin Direct Delivery Hub', 'Sharbati Wheat', 'Sharbati Wheat', 'Lokwan C-306', 50.0, 50.0, 'kg', 60.0, 3000.00, 'Grade A', 'Grade A', 'Gramin Fulfillment Center - Kurla, Mumbai', 'Active', 'KS-MH-NSK-WHT-20260910-00125-D1', 'FPO-SIN-03', 'QC-MH-NSK-2026-0910', 'e1000000-0000-0000-0000-000000000002', '2026-09-12 14:00:00+05:30'),
    
    -- 5. Distributor Buffer Stock
    ('KS-MH-NSK-WHT-20260910-00125-D1-BUF', 'e1000000-0000-0000-0000-000000000001', 'FMR-MH-000421', 'Ramesh Patil', 'e1000000-0000-0000-0000-000000000006', 'e1000000-0000-0000-0000-000000000006', 'GreenHarvest Distributors (Buffer Storage)', 'Sharbati Wheat', 'Sharbati Wheat', 'Lokwan C-306', 50.0, 50.0, 'kg', 54.0, 2700.00, 'Grade A', 'Grade A', 'Bhiwandi Central Agro Warehouse', 'Active', 'KS-MH-NSK-WHT-20260910-00125-D1', 'FPO-SIN-03', 'QC-MH-NSK-2026-0910', 'e1000000-0000-0000-0000-000000000002', '2026-09-11 11:00:00+05:30'),

    -- 6. Canonical Lot LT-20391 (Ramesh Patil)
    ('LT-20391', 'e1000000-0000-0000-0000-000000000001', 'FMR-MH-000421', 'Ramesh Patil', 'e1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'Ramesh Patil (Farmer)', 'Sharbati Wheat', 'Sharbati Wheat', 'C-306', 500.0, 500.0, 'kg', 32.0, 16000.00, 'Grade A', 'Grade A', 'Sinnar Collection Hub #3', 'Active', NULL, 'Digital Platform Scale #DS-04', 'QC-2026-W091', 'e1000000-0000-0000-0000-000000000002', '2026-09-17 08:30:00+05:30'),
    
    -- 7. Child Lot LT-20391-A (Distributor Transit)
    ('LT-20391-A', 'e1000000-0000-0000-0000-000000000001', 'FMR-MH-000421', 'Ramesh Patil', 'e1000000-0000-0000-0000-000000000006', 'e1000000-0000-0000-0000-000000000006', 'GreenHarvest Distributors', 'Sharbati Wheat', 'Sharbati Wheat', 'C-306', 250.0, 250.0, 'kg', 32.0, 8000.00, 'Grade A', 'Grade A', 'Transit — Vadodara Highway Route', 'In Transit', 'LT-20391', 'Digital Platform Scale #DS-04', 'QC-2026-W091', 'e1000000-0000-0000-0000-000000000002', '2026-09-17 14:30:00+05:30'),
    
    -- 8. Child Lot LT-20391-B (Farmer Remaining)
    ('LT-20391-B', 'e1000000-0000-0000-0000-000000000001', 'FMR-MH-000421', 'Ramesh Patil', 'e1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'Ramesh Patil (Farmer Remaining)', 'Sharbati Wheat', 'Sharbati Wheat', 'C-306', 250.0, 250.0, 'kg', 32.0, 8000.00, 'Grade A', 'Grade A', 'Sinnar Farm Store', 'Active', 'LT-20391', 'Digital Platform Scale #DS-04', 'QC-2026-W091', 'e1000000-0000-0000-0000-000000000002', '2026-09-17 14:30:00+05:30'),

    -- 9. Soybean Lot LT-20392 (Sunita Deshmukh)
    ('LT-20392', NULL, 'FM-10295', 'Sunita Deshmukh', 'e1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'Sunita Deshmukh (Farmer)', 'Organic Soybean', 'Organic Soybean', 'JS 335', 800.0, 800.0, 'kg', 46.5, 37200.00, 'Grade A', 'Grade A', 'Pune Agro Collection Yard', 'Under Offer', NULL, 'Weighbridge #PN-02', 'QC-2026-SOY-101', 'e1000000-0000-0000-0000-000000000002', '2026-09-16 14:00:00+05:30'),

    -- 10. Secondary Wheat Lot for FPO Pooling
    ('KS-MH-PUN-WHT-20260911-00088', NULL, 'FM-10295', 'Sunita Deshmukh', 'e1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'Sunita Deshmukh', 'Sharbati Wheat', 'Sharbati Wheat', 'Lokwan', 300.0, 300.0, 'kg', 54.0, 16200.00, 'Grade A', 'Grade A', 'Shirur Collection Point', 'Active', NULL, 'FPO-PUN-01', 'QC-MH-PUN-2026-088', 'e1000000-0000-0000-0000-000000000002', '2026-09-11 09:30:00+05:30')
ON CONFLICT (id) DO UPDATE SET
    harvest_quantity = EXCLUDED.harvest_quantity,
    quantity = EXCLUDED.quantity,
    status = EXCLUDED.status,
    parent_lot_id = EXCLUDED.parent_lot_id;

-- ------------------------------------------------------------------------------
-- 28. SEED: lot_components (FPO Aggregation & Blended Lot Pooling)
-- ------------------------------------------------------------------------------
INSERT INTO public.lot_components (
    parent_lot_id, source_lot_id, source_farmer_name, quantity, percentage
) VALUES
    ('KS-MH-NSK-WHT-20260910-00125-D1', 'KS-MH-NSK-WHT-20260910-00125', 'Ramesh Patil', 200.0, 40.8),
    ('KS-MH-NSK-WHT-20260910-00125-D1', 'KS-MH-PUN-WHT-20260911-00088', 'Sunita Deshmukh', 300.0, 59.2)
ON CONFLICT (parent_lot_id, source_lot_id) DO UPDATE SET
    source_farmer_name = EXCLUDED.source_farmer_name,
    quantity = EXCLUDED.quantity,
    percentage = EXCLUDED.percentage;

-- ------------------------------------------------------------------------------
-- 29. SEED: evidence_items (3-Tier Physical Verification Ledger)
-- ------------------------------------------------------------------------------
INSERT INTO public.evidence_items (
    id, lot_id, farmer_id, farmer_name, type, category, title, value, source, status, issuer, document_ref, created_at
) VALUES
    ('EV-MH-101', 'KS-MH-NSK-WHT-20260910-00125', 'e1000000-0000-0000-0000-000000000001', 'Ramesh Patil', 'Weighment', 'Farmer Declared', 'Farmer Harvest Self-Declaration', '500 kg declared (10 bags @ 50 kg)', 'Farmer Self-Report (Assisted by Helper Priya Sharma)', 'Reviewed', NULL, 'DEC-MH-00125.pdf', '2026-09-10 08:30:00+05:30'),
    ('EV-MH-102', 'KS-MH-NSK-WHT-20260910-00125', 'e1000000-0000-0000-0000-000000000001', 'Ramesh Patil', 'Scale Receipt', 'Evidence Backed', 'Digital Platform Scale Weighment', '492.4 kg Net (Tare deduction: 7.6 kg)', 'Calibrated Platform Scale #FPO-SIN-03 (Auto-logged)', 'Verified', NULL, 'SCALE-FPO-SIN-03-00125.jpg', '2026-09-10 10:15:00+05:30'),
    ('EV-MH-103', 'KS-MH-NSK-WHT-20260910-00125', 'e1000000-0000-0000-0000-000000000001', 'Ramesh Patil', 'Quality Certificate', 'Externally Verified', 'Assay Report: Moisture & Purity', 'Moisture: 11.2%, Foreign Matter: 0.4%, Grade: A', 'AgriTest Analytical Labs', 'Verified', 'Dr. K. V. Mehta (Chief Agronomist)', 'CERT-QC-MH-NSK-2026-0910.pdf', '2026-09-10 11:45:00+05:30'),
    ('EV-MH-104', 'KS-MH-NSK-WHT-20260910-00125', 'e1000000-0000-0000-0000-000000000001', 'Ramesh Patil', 'Field Photo', 'Evidence Backed', 'Geotagged Lot Bagging & Intake Photo', 'Geotag: 19.8456° N, 73.9876° E', 'Helper Field Camera App', 'Verified', NULL, 'IMG-SINNAR-0910.jpg', '2026-09-10 09:10:00+05:30'),
    ('EV-901', 'LT-20391', 'e1000000-0000-0000-0000-000000000001', 'Ramesh Patil', 'Weighment', 'Farmer Declared', 'Initial Farmer Harvest Declaration', '500 kg (10 Jute Bags @ 50 kg)', 'Farmer Self-Report (Assisted by Helper)', 'Reviewed', NULL, 'DOC-DEC-901.pdf', '2026-09-17 08:30:00+05:30'),
    ('EV-902', 'LT-20391', 'e1000000-0000-0000-0000-000000000001', 'Ramesh Patil', 'Scale Receipt', 'Evidence Backed', 'Digital Platform Scale Weighment', '492.4 kg Net (Tare: 7.6 kg)', 'IoT Platform Scale #DS-04 (Auto-logged)', 'Verified', NULL, 'SCALE-REC-1015.jpg', '2026-09-17 10:15:00+05:30'),
    ('EV-903', 'LT-20391', 'e1000000-0000-0000-0000-000000000001', 'Ramesh Patil', 'Quality Certificate', 'Externally Verified', 'Moisture & Purity Laboratory Assay', 'Moisture: 11.2%, Foreign Matter: 0.4%, Grade: A', 'AgriTest Analytical Labs', 'Verified', 'Dr. K. V. Mehta (Chief Agronomist)', 'CERT-QC-2026-W091.pdf', '2026-09-17 11:45:00+05:30'),
    ('EV-904', 'LT-20391', 'e1000000-0000-0000-0000-000000000001', 'Ramesh Patil', 'Field Photo', 'Evidence Backed', 'Geotagged Bagging & Lot Photo', 'Geotag: 22.5645° N, 72.9289° E', 'Helper Field Camera App', 'Verified', NULL, 'IMG-FIELD-0910.jpg', '2026-09-17 09:10:00+05:30')
ON CONFLICT (id) DO UPDATE SET
    value = EXCLUDED.value,
    status = EXCLUDED.status;

-- ------------------------------------------------------------------------------
-- 30. SEED: quality_assessments (Laboratory Testing Station)
-- ------------------------------------------------------------------------------
INSERT INTO public.quality_assessments (
    id, lot_id, crop, moisture_percent, foreign_matter_percent, visible_spoilage, assigned_grade, method, assessed_by, report_notes, certificate_ref, sha256_hash, status, created_at
) VALUES
    ('QA-109', 'KS-MH-NSK-WHT-20260910-00125', 'Sharbati Wheat', 11.2, 0.4, 'None', 'Grade A', 'Digital Moisture Meter + Analytical Sieve', 'e1000000-0000-0000-0000-000000000005', 'Clean grain, moisture well within 12% standard threshold. No foreign seed contamination.', 'QC-MH-NSK-2026-0910', '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4', 'Certified', '2026-09-10 11:45:00+05:30'),
    ('QA-110', 'LT-20392', 'Organic Soybean', 12.8, 1.1, 'Low', 'Grade B', 'Near-Infrared Grain Analyzer', 'e1000000-0000-0000-0000-000000000005', 'Slight split pod content, acceptable for commercial processing.', 'QC-2026-SOY-101', 'b6d8a7c29e1f404398e21a7c5b610992384a5c10293847561029384756102938', 'Certified', '2026-09-16 15:30:00+05:30')
ON CONFLICT (id) DO UPDATE SET
    assigned_grade = EXCLUDED.assigned_grade,
    status = EXCLUDED.status;

-- ------------------------------------------------------------------------------
-- 31. SEED: collection_arrivals (Mandi Weighbridge & Ingestion)
-- ------------------------------------------------------------------------------
INSERT INTO public.collection_arrivals (
    id, farmer_id, farmer_registry_id, farmer_name, crop, variety, declared_quantity, measured_quantity, unit, scale_id, scale_photo_url, moisture_percent, quality_grade, status, recorded_by, created_at
) VALUES
    ('ARR-881', 'e1000000-0000-0000-0000-000000000001', 'FMR-MH-000421', 'Ramesh Patil', 'Sharbati Wheat', 'Lokwan C-306', 500.0, 492.4, 'kg', 'FPO-SIN-03', 'SCALE-FPO-SIN-03-00125.jpg', 11.2, 'Grade A', 'Lot Created', 'e1000000-0000-0000-0000-000000000004', '2026-09-10 10:15:00+05:30'),
    ('ARR-882', NULL, 'FM-10295', 'Sunita Deshmukh', 'Organic Soybean', 'JS 335', 820.0, 800.0, 'kg', 'FPO-SIN-01', 'SCALE-FPO-SIN-01-00800.jpg', 12.8, 'Grade A', 'Weighed', 'e1000000-0000-0000-0000-000000000004', '2026-09-16 14:10:00+05:30')
ON CONFLICT (id) DO UPDATE SET
    measured_quantity = EXCLUDED.measured_quantity,
    status = EXCLUDED.status;

-- ------------------------------------------------------------------------------
-- 32. SEED: fpo_members (Cooperative Shareholders)
-- ------------------------------------------------------------------------------
INSERT INTO public.fpo_members (
    id, fpo_id, farmer_id, farmer_registry_id, name, village, crops, share_holding, total_contributed_kg, status, joined_date, created_at
) VALUES
    ('MEM-201', 'e1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000001', 'FMR-MH-000421', 'Ramesh Patil', 'Sinnar', ARRAY['Wheat', 'Mustard'], 25, 492.4, 'Active', '2024-01-15', '2024-01-15 09:00:00+05:30'),
    ('MEM-202', 'e1000000-0000-0000-0000-000000000003', NULL, 'FM-10295', 'Sunita Deshmukh', 'Daund', ARRAY['Soybean', 'Pigeon Pea'], 15, 800.0, 'Active', '2024-03-02', '2024-03-02 10:30:00+05:30')
ON CONFLICT (id) DO UPDATE SET
    share_holding = EXCLUDED.share_holding,
    total_contributed_kg = EXCLUDED.total_contributed_kg;

-- ------------------------------------------------------------------------------
-- 33. SEED: marketplace (B2B Listings)
-- ------------------------------------------------------------------------------
INSERT INTO public.marketplace (
    id, batch_id, current_seller_id, current_seller_type, price, price_per_kg, quantity, listing_title, status, created_at
) VALUES
    (1, 'KS-MH-NSK-WHT-20260910-00125', 'e1000000-0000-0000-0000-000000000001', 'farmer', 54.0, 54.0, 492.4, 'Certified Sharbati Wheat - Lokwan C-306', 'sold', '2026-09-10 10:30:00+05:30'),
    (2, 'LT-20391', 'e1000000-0000-0000-0000-000000000001', 'farmer', 32.0, 32.0, 250.0, 'Grade A Sharbati Wheat - Direct Harvest', 'available', '2026-09-17 09:30:00+05:30')
ON CONFLICT (id) DO UPDATE SET
    price = EXCLUDED.price,
    quantity = EXCLUDED.quantity,
    status = EXCLUDED.status;

-- ------------------------------------------------------------------------------
-- 34. SEED: offers (Distributor Procurement Bids)
-- ------------------------------------------------------------------------------
INSERT INTO public.offers (
    id, lot_id, buyer_id, buyer_name, buyer_type, offered_quantity, unit, price_per_kg, gross_value, deductions, total_deductions, expected_net, offer_deadline, status, created_at
) VALUES
    ('OF-MH-9021', 'KS-MH-NSK-WHT-20260910-00125', 'e1000000-0000-0000-0000-000000000006', 'GreenHarvest Distributors', 'Distributor', 492.4, 'kg', 54.0, 26589.60, '{"transport": 650.00, "loading": 200.00, "commission": 150.00, "platformFee": 150.00, "other": 0.00}'::jsonb, 1150.00, 25439.60, '2026-09-18 18:00:00+05:30', 'Accepted', '2026-09-10 14:30:00+05:30'),
    ('OF-1032', 'LT-20391', 'e1000000-0000-0000-0000-000000000006', 'GreenHarvest Distributors', 'Distributor', 250.0, 'kg', 32.0, 8000.00, '{"transport": 200.00, "loading": 100.00, "commission": 50.00, "platformFee": 80.00, "other": 0.00}'::jsonb, 430.00, 7570.00, '2026-09-19 18:00:00+05:30', 'Accepted', '2026-09-17 12:00:00+05:30')
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    expected_net = EXCLUDED.expected_net;

-- ------------------------------------------------------------------------------
-- 35. SEED: payments (7-Stage Escrow Timeline)
-- ------------------------------------------------------------------------------
INSERT INTO public.payments (
    id, offer_id, lot_id, payer_id, payee_id, payer_name, payee_name, amount, current_stage, status, transaction_ref, timeline, created_at
) VALUES
    ('PY-8831', 'OF-MH-9021', 'KS-MH-NSK-WHT-20260910-00125', 'e1000000-0000-0000-0000-000000000006', 'e1000000-0000-0000-0000-000000000001', 'GreenHarvest Distributors', 'Ramesh Patil', 25439.60, 'Reference Submitted', 'Reference Submitted', 'UPI/20260911/AGR-883109', '[
        {"stage": "Offer Accepted", "timestamp": "10 Sep 2026, 14:30", "completed": true, "note": "Offer #OF-MH-9021 accepted by farmer"},
        {"stage": "Goods Handed Over", "timestamp": "10 Sep 2026, 17:00", "completed": true, "note": "492.4 kg handed over at Sinnar Collection Hub"},
        {"stage": "Payment Due", "timestamp": "11 Sep 2026, 09:00", "completed": true, "note": "Invoice generated after quality & tare verification"},
        {"stage": "Payment Initiated", "timestamp": "11 Sep 2026, 10:15", "completed": true, "note": "NEFT transaction initiated by GreenHarvest"},
        {"stage": "Reference Submitted", "timestamp": "11 Sep 2026, 10:45", "completed": true, "note": "Ref UPI/20260911/AGR-883109 logged on ledger"},
        {"stage": "Farmer Confirmation", "timestamp": "11 Sep 2026, 11:30", "completed": false, "note": "Awaiting bank credit confirmation from Ramesh Patil"},
        {"stage": "Closed", "timestamp": "Pending", "completed": false, "note": "Settlement completion pending step 6"}
    ]'::jsonb, '2026-09-10 14:30:00+05:30')
ON CONFLICT (id) DO UPDATE SET
    current_stage = EXCLUDED.current_stage,
    status = EXCLUDED.status,
    transaction_ref = EXCLUDED.transaction_ref;

-- ------------------------------------------------------------------------------
-- 36. SEED: disputes (Weight / Quality Discrepancies)
-- ------------------------------------------------------------------------------
INSERT INTO public.disputes (
    id, lot_id, farmer_id, buyer_id, farmer_name, buyer_name, category, description, evidence, status, resolution_timeline, created_at
) VALUES
    ('DP-401', 'KS-MH-NSK-WHT-20260910-00125', 'e1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000006', 'Ramesh Patil', 'GreenHarvest Distributors', 'Weight Mismatch', 'Farmer declared 500 kg (10 bags @ 50 kg). Digital scale at Sinnar Hub recorded 492.4 kg net after tare deduction of 7.6 kg. Buyer requested clarification before confirming payment step 5.', ARRAY['DEC-MH-00125.pdf', 'SCALE-FPO-SIN-03-00125.jpg'], 'Under Review', '[
        {"date": "10 Sep 2026, 10:20", "actor": "Ramesh Patil", "action": "Raised discrepancy query regarding 7.6 kg tare deduction"},
        {"date": "10 Sep 2026, 11:30", "actor": "Sinnar Hub Supervisor", "action": "Scale calibration log checked (#FPO-SIN-03 within ±0.05% tolerance). Tare accepted as wet gunny bag weight."},
        {"date": "11 Sep 2026, 09:15", "actor": "GreenHarvest Distributors", "action": "Agreed to proceed on net measured weight 492.4 kg. Updated invoice net total."}
    ]'::jsonb, '2026-09-10 10:20:00+05:30')
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    resolution_timeline = EXCLUDED.resolution_timeline;

-- ------------------------------------------------------------------------------
-- 37. SEED: transactions (Verifiable Ledger Logs)
-- ------------------------------------------------------------------------------
INSERT INTO public.transactions (
    id, transaction_id, batch_id, type, crop, quantity, counterparty, amount, price, status, date, buyer_id, transaction_timestamp, transaction_type, created_at
) VALUES
    (1, 'TX-901', 'KS-MH-NSK-WHT-20260910-00125-D1', 'Sale', 'Sharbati Wheat', 250.0, 'GreenHarvest Distributors', 13500.00, 13500.00, 'Completed', '11 Sep 2026', 'e1000000-0000-0000-0000-000000000006', '2026-09-11 10:30:00+05:30', 'COMMERCIAL_ESCROW', '2026-09-11 10:30:00+05:30'),
    (2, 'TX-902', 'KS-MH-NSK-WHT-20260910-00125-D1-R1', 'Transfer', 'Sharbati Wheat', 200.0, 'FreshBasket Retail', 11600.00, 11600.00, 'Completed', '12 Sep 2026', 'e1000000-0000-0000-0000-000000000007', '2026-09-12 11:00:00+05:30', 'RETAIL_FULFILLMENT', '2026-09-12 11:00:00+05:30'),
    (3, 'TX-903', 'KS-MH-NSK-WHT-20260910-00125', 'Fee', 'Quality Test Fee', 1.0, 'AgriTest Labs', 250.00, 250.00, 'Completed', '10 Sep 2026', 'e1000000-0000-0000-0000-000000000005', '2026-09-10 12:00:00+05:30', 'LAB_ASSAY_FEE', '2026-09-10 12:00:00+05:30')
ON CONFLICT (id) DO UPDATE SET
    transaction_id = EXCLUDED.transaction_id,
    batch_id = EXCLUDED.batch_id,
    type = EXCLUDED.type,
    crop = EXCLUDED.crop,
    counterparty = EXCLUDED.counterparty,
    quantity = EXCLUDED.quantity,
    amount = EXCLUDED.amount,
    price = EXCLUDED.price,
    status = EXCLUDED.status,
    date = EXCLUDED.date;

-- ------------------------------------------------------------------------------
-- 38. SEED: distributor_inventory & retailer_inventory
-- ------------------------------------------------------------------------------
INSERT INTO public.distributor_inventory (
    id, distributor_id, marketplace_id, lot_id, crop, quantity_purchased, purchase_price, warehouse_location, storage_temp_c, status, created_at
) VALUES
    (1, 'e1000000-0000-0000-0000-000000000006', 1, 'KS-MH-NSK-WHT-20260910-00125-D1', 'Sharbati Wheat', 250.0, 13500.00, 'Bhiwandi Central Agro Warehouse - Bay 12', 18.5, 'In Storage', '2026-09-11 10:30:00+05:30')
ON CONFLICT (id) DO UPDATE SET
    quantity_purchased = EXCLUDED.quantity_purchased,
    lot_id = EXCLUDED.lot_id,
    crop = EXCLUDED.crop,
    warehouse_location = EXCLUDED.warehouse_location,
    status = EXCLUDED.status;

INSERT INTO public.retailer_inventory (
    id, retailer_id, marketplace_id, lot_id, crop, quantity_purchased, purchase_price, store_location, shelf_section, qr_code_url, status, created_at
) VALUES
    (1, 'e1000000-0000-0000-0000-000000000007', 1, 'KS-MH-NSK-WHT-20260910-00125-D1-R1', 'Sharbati Wheat', 200.0, 11600.00, 'Gramin Superstore - Bandra West, Mumbai', 'Aisle 3, Organic Grains, Shelf Bay 4B', '/verify/KS-MH-NSK-WHT-20260910-00125', 'On Shelf', '2026-09-12 11:00:00+05:30')
ON CONFLICT (id) DO UPDATE SET
    quantity_purchased = EXCLUDED.quantity_purchased,
    lot_id = EXCLUDED.lot_id,
    crop = EXCLUDED.crop,
    store_location = EXCLUDED.store_location,
    shelf_section = EXCLUDED.shelf_section,
    status = EXCLUDED.status;

-- Synchronize all serial sequences safely
DO $$
BEGIN
    PERFORM setval(pg_get_serial_sequence('public.distributor_inventory', 'id'), COALESCE(MAX(id), 1)) FROM public.distributor_inventory;
    PERFORM setval(pg_get_serial_sequence('public.retailer_inventory', 'id'), COALESCE(MAX(id), 1)) FROM public.retailer_inventory;
    PERFORM setval(pg_get_serial_sequence('public.marketplace', 'id'), COALESCE(MAX(id), 1)) FROM public.marketplace;
    PERFORM setval(pg_get_serial_sequence('public.transactions', 'id'), COALESCE(MAX(id), 1)) FROM public.transactions;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- ------------------------------------------------------------------------------
-- 39. SEED: admin_alerts (Surveillance Flags)
-- ------------------------------------------------------------------------------
INSERT INTO public.admin_alerts (
    id, severity, category, description, related_entity_id, status, created_at
) VALUES
    ('ALT-701', 'Medium', 'Scale Miscalibration', 'Scale FPO-SIN-03 recorded a 7.6 kg tare variance on Lot KS-MH-NSK-WHT-20260910-00125.', 'KS-MH-NSK-WHT-20260910-00125', 'Investigating', '2026-09-10 10:45:00+05:30'),
    ('ALT-702', 'Low', 'QR Anomaly', 'Consumer QR code scanned 48 times in 2 hours across multiple retail locations in Mumbai.', 'KS-MH-NSK-WHT-20260910-00125-D1-R1', 'Resolved', '2026-09-12 18:30:00+05:30')
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status;

-- ------------------------------------------------------------------------------
-- 40. SEED: helper_activities
-- ------------------------------------------------------------------------------
INSERT INTO public.helper_activities (
    id, helper_id, action, category, details, badge_status, created_at
) VALUES
    ('HA-01', 'e1000000-0000-0000-0000-000000000002', 'Assisted Ramesh Patil (FMR-MH-000421)', 'Registration', 'Recorded consent, landholding plot 4B Sinnar, and primary crop wheat.', 'Completed', '2026-09-17 09:42:00+05:30'),
    ('HA-02', 'e1000000-0000-0000-0000-000000000002', 'Logged Harvest Declaration', 'Crop Availability', 'Estimated 1,200 kg Red Onion for farmer Ramesh Patil.', 'Completed', '2026-09-17 11:30:00+05:30'),
    ('HA-03', 'e1000000-0000-0000-0000-000000000002', 'Field Survey Photo Uploaded', 'Evidence', 'Attached geotagged soil & field crop photo for Lot LT-20391.', 'Completed', '2026-09-17 12:15:00+05:30')
ON CONFLICT (id) DO UPDATE SET
    details = EXCLUDED.details,
    badge_status = EXCLUDED.badge_status;

-- ------------------------------------------------------------------------------
-- 41. SEED: notifications (Real-time Persona Alerts)
-- ------------------------------------------------------------------------------
INSERT INTO public.notifications (
    id, user_id, category, title, message, read, link, created_at
) VALUES
    ('00000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'Offer', 'Offer Received: Sharbati Wheat', 'GreenHarvest Distributors placed offer ₹54/kg for Lot KS-MH-NSK-WHT-20260910-00125.', false, '/offers/OF-MH-9021', NOW() - INTERVAL '10 minutes'),
    ('00000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000001', 'Payment', 'Payment Reference Submitted', 'Ref UPI/20260911/AGR-883109 submitted for ₹25,439.60.', false, '/payments/PY-8831', NOW() - INTERVAL '45 minutes'),
    ('00000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000001', 'Evidence', 'Lab Quality Certificate Verified', 'Moisture 11.2%, Foreign Matter 0.4%, Grade A certified by AgriTest Labs.', true, '/lots/KS-MH-NSK-WHT-20260910-00125/evidence', NOW() - INTERVAL '2 hours'),
    ('00000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000002', 'Farmer activity', 'Farmer Profile Verified', 'Ramesh Patil (FMR-MH-000421) confirmed with Sahyadri FPO.', true, '/helper/farmers', NOW() - INTERVAL '3 hours'),
    ('00000000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000008', 'Dispute', 'Weight Reconciliation Notice', 'Dispute DP-401 for Lot KS-MH-NSK-WHT-20260910-00125 is under review.', true, '/disputes/DP-401', NOW() - INTERVAL '4 hours')
ON CONFLICT (id) DO UPDATE SET
    read = EXCLUDED.read;

-- ==============================================================================
-- 42. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helper_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_availabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lot_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_arrivals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fpo_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distributor_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retailer_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voicegenie_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voicegenie_submissions ENABLE ROW LEVEL SECURITY;

-- Production RLS Policies:
DROP POLICY IF EXISTS "profiles_select_auth" ON public.profiles;
CREATE POLICY "profiles_select_auth" ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Batches: Public read for marketplace & QR verification (/verify/[id])
DROP POLICY IF EXISTS "batches_select_public" ON public.batches;
CREATE POLICY "batches_select_public" ON public.batches FOR SELECT USING (true);

DROP POLICY IF EXISTS "batches_mutate_owner" ON public.batches;
CREATE POLICY "batches_mutate_owner" ON public.batches FOR ALL TO authenticated USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type IN ('helper', 'fpo', 'admin', 'collection_center'))
);

-- Evidence & Quality: Public read for certificates
DROP POLICY IF EXISTS "evidence_select_public" ON public.evidence_items;
CREATE POLICY "evidence_select_public" ON public.evidence_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "quality_select_public" ON public.quality_assessments;
CREATE POLICY "quality_select_public" ON public.quality_assessments FOR SELECT USING (true);

DROP POLICY IF EXISTS "offers_parties" ON public.offers;
CREATE POLICY "offers_parties" ON public.offers FOR ALL TO authenticated USING (
    buyer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    lot_id IN (SELECT id FROM public.batches WHERE user_id IN (SELECT user_id FROM public.profiles WHERE user_id = auth.uid())) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type IN ('admin', 'fpo'))
);

DROP POLICY IF EXISTS "payments_parties" ON public.payments;
CREATE POLICY "payments_parties" ON public.payments FOR ALL TO authenticated USING (
    payer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    payee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type IN ('admin'))
);

DROP POLICY IF EXISTS "admin_alerts_admin" ON public.admin_alerts;
CREATE POLICY "admin_alerts_admin" ON public.admin_alerts FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND user_type IN ('admin'))
);

DROP POLICY IF EXISTS "notifications_owner" ON public.notifications;
CREATE POLICY "notifications_owner" ON public.notifications FOR ALL TO authenticated USING (
    user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Permissive Development RLS Bypass (Active for local smoke-testing & prototyping)
DO $$ 
DECLARE
    t TEXT;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "dev_all_access" ON public.%I;', t);
        EXECUTE format('CREATE POLICY "dev_all_access" ON public.%I FOR ALL USING (true) WITH CHECK (true);', t);
    END LOOP;
END $$;
