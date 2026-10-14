-- ==============================================================================
-- Farmly — Migration 002: Role enforcement + certificate traceability chain
-- ==============================================================================
-- Run AFTER database/farmly_supabase_schema.sql, in the Supabase SQL Editor.
-- Idempotent: safe to run more than once.
--
-- Adds:
--   1. Database-level role enforcement (only farmer / helper / distributor /
--      retailer can be self-assigned; roles cannot be changed from the client).
--   2. Batch ownership + lineage columns for partial purchases (child batches).
--   3. purchases, certificates, traceability_events tables (append-only,
--      RLS-protected: only the backend's service-role key can read/write them).
--   4. farmly_purchase_batch(): atomic, idempotent quantity transfer.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ROLE ENFORCEMENT
-- ------------------------------------------------------------------------------

-- True for the service role (backend) and database administrators.
CREATE OR REPLACE FUNCTION public.farmly_is_privileged()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT current_user IN ('postgres', 'supabase_admin', 'service_role')
        OR COALESCE(NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '') = 'service_role';
$$;

-- Self-registration may only create the four supported roles. Accounts seeded by an
-- administrator from the SQL editor (session_user = postgres) may still use legacy roles.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    requested TEXT := LOWER(COALESCE(
        NEW.raw_user_meta_data->>'user_type',
        NEW.raw_user_meta_data->>'role',
        'farmer'
    ));
BEGIN
    IF requested NOT IN ('farmer', 'helper', 'distributor', 'retailer')
       AND session_user NOT IN ('postgres', 'supabase_admin') THEN
        RAISE EXCEPTION 'Unsupported role for self-registration: %', requested USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.profiles (
        id, user_id, full_name, email, phone, user_type, state, district,
        preferred_language, organization, role, is_verified, created_at, updated_at
    ) VALUES (
        NEW.id,
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'phone', NEW.raw_user_meta_data->>'mobile'),
        requested,
        NEW.raw_user_meta_data->>'state',
        NEW.raw_user_meta_data->>'district',
        COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en'),
        NEW.raw_user_meta_data->>'organization',
        requested,
        true,
        NOW(),
        NOW()
    )
    -- Never overwrite the role of an existing (possibly legacy) profile.
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = COALESCE(EXCLUDED.phone, profiles.phone),
        organization = COALESCE(EXCLUDED.organization, profiles.organization),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clients may create profiles only with a supported role, and may never change a role.
CREATE OR REPLACE FUNCTION public.farmly_guard_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF public.farmly_is_privileged() THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        IF NEW.user_type NOT IN ('farmer', 'helper', 'distributor', 'retailer') THEN
            RAISE EXCEPTION 'Role % cannot be self-assigned', NEW.user_type USING ERRCODE = '42501';
        END IF;
        NEW.role := NEW.user_type;
    ELSIF NEW.user_type IS DISTINCT FROM OLD.user_type OR NEW.role IS DISTINCT FROM OLD.role THEN
        RAISE EXCEPTION 'Profile roles cannot be changed from the client' USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_guard_role ON public.profiles;
CREATE TRIGGER trg_profiles_guard_role
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.farmly_guard_profile_role();

-- ------------------------------------------------------------------------------
-- 2. BATCH OWNERSHIP & LINEAGE
-- ------------------------------------------------------------------------------
-- quantity          = quantity currently available in this batch
-- original_quantity = quantity the batch was created with (registered or purchased)
-- lineage_path      = batch ids from the root (farmer) batch down to this batch

ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS original_quantity NUMERIC(12,2);
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS owner_id TEXT;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS owner_role TEXT;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS root_batch_id TEXT;
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS lineage_path TEXT[];
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS created_by TEXT;

UPDATE public.batches
SET original_quantity = COALESCE(NULLIF(harvest_quantity, 0), quantity, 0)
WHERE original_quantity IS NULL;

WITH RECURSIVE tree AS (
    SELECT id, ARRAY[id] AS path, id AS root
    FROM public.batches
    WHERE parent_lot_id IS NULL
    UNION ALL
    SELECT b.id, t.path || b.id, t.root
    FROM public.batches b
    JOIN tree t ON b.parent_lot_id = t.id
    WHERE NOT b.id = ANY (t.path)
)
UPDATE public.batches b
SET root_batch_id = t.root, lineage_path = t.path
FROM tree t
WHERE b.id = t.id AND b.lineage_path IS NULL;

-- Existing root batches belong to their farmer.
UPDATE public.batches
SET owner_role = 'farmer',
    owner_id = COALESCE(owner_id, farmer_registry_id, farmer_id::text, user_id::text)
WHERE parent_lot_id IS NULL AND owner_role IS NULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'batches_quantity_nonnegative') THEN
        ALTER TABLE public.batches
            ADD CONSTRAINT batches_quantity_nonnegative CHECK (quantity >= 0) NOT VALID;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_batches_root_batch_id ON public.batches(root_batch_id);
CREATE INDEX IF NOT EXISTS idx_batches_owner ON public.batches(owner_id, owner_role);

-- Fill lineage/ownership for batches inserted through the existing lot APIs.
CREATE OR REPLACE FUNCTION public.farmly_batch_lineage()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    parent public.batches;
BEGIN
    IF NEW.original_quantity IS NULL THEN
        NEW.original_quantity := COALESCE(NULLIF(NEW.harvest_quantity, 0), NEW.quantity, 0);
    END IF;

    IF NEW.parent_lot_id IS NULL THEN
        NEW.root_batch_id := COALESCE(NEW.root_batch_id, NEW.id);
        NEW.lineage_path := COALESCE(NEW.lineage_path, ARRAY[NEW.id]);
        NEW.owner_role := COALESCE(NEW.owner_role, 'farmer');
        NEW.owner_id := COALESCE(NEW.owner_id, NEW.farmer_registry_id, NEW.farmer_id::text, NEW.user_id::text);
    ELSIF NEW.lineage_path IS NULL THEN
        SELECT * INTO parent FROM public.batches WHERE id = NEW.parent_lot_id;
        IF FOUND THEN
            NEW.root_batch_id := COALESCE(parent.root_batch_id, parent.id);
            NEW.lineage_path := COALESCE(parent.lineage_path, ARRAY[parent.id]) || NEW.id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_batches_lineage ON public.batches;
CREATE TRIGGER trg_batches_lineage
BEFORE INSERT ON public.batches
FOR EACH ROW EXECUTE FUNCTION public.farmly_batch_lineage();

-- ------------------------------------------------------------------------------
-- 3. PURCHASES, CERTIFICATES, EVENTS
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.purchases (
    id TEXT PRIMARY KEY,
    idempotency_key TEXT NOT NULL UNIQUE,
    request_fingerprint TEXT NOT NULL,
    source_batch_id TEXT NOT NULL REFERENCES public.batches(id),
    child_batch_id TEXT REFERENCES public.batches(id),
    root_batch_id TEXT,
    seller_id TEXT,
    seller_role TEXT NOT NULL,
    seller_name TEXT,
    buyer_id TEXT NOT NULL,
    buyer_role TEXT NOT NULL CHECK (buyer_role IN ('distributor', 'retailer')),
    buyer_name TEXT,
    quantity NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
    unit TEXT NOT NULL DEFAULT 'kg',
    price_per_unit NUMERIC(12,2),
    currency TEXT NOT NULL DEFAULT 'INR',
    source_certificate_id TEXT,
    certificate_id TEXT,
    status TEXT NOT NULL CHECK (status IN (
        'PURCHASE_CONFIRMED', 'CERTIFICATE_GENERATED', 'IPFS_STORED',
        'BLOCKCHAIN_CONFIRMED', 'TRACEABILITY_UPDATED', 'FAILED'
    )),
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchases_source ON public.purchases(source_batch_id);
CREATE INDEX IF NOT EXISTS idx_purchases_root ON public.purchases(root_batch_id);
CREATE INDEX IF NOT EXISTS idx_purchases_buyer ON public.purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_seller ON public.purchases(seller_id);

CREATE TABLE IF NOT EXISTS public.certificates (
    id TEXT PRIMARY KEY,
    certificate_type TEXT NOT NULL CHECK (certificate_type IN ('FARMER_ORIGIN', 'DISTRIBUTOR_PURCHASE', 'RETAILER_PURCHASE')),
    batch_id TEXT NOT NULL REFERENCES public.batches(id),
    root_batch_id TEXT NOT NULL,
    transaction_id TEXT UNIQUE REFERENCES public.purchases(id),
    source_certificate_id TEXT REFERENCES public.certificates(id),
    upstream_certificate_ids TEXT[] NOT NULL DEFAULT '{}',
    version INTEGER NOT NULL DEFAULT 1,
    supersedes_certificate_id TEXT REFERENCES public.certificates(id),

    subject_id TEXT,
    subject_role TEXT,
    subject_display_name TEXT,

    -- Claims as documented by the uploader. Farmly does not verify them.
    document_kind TEXT,
    issuing_organization TEXT,
    issued_on DATE,
    expires_on DATE,
    certification_claim TEXT,
    issuer_verification TEXT NOT NULL DEFAULT 'NOT_VERIFIED' CHECK (issuer_verification IN ('NOT_VERIFIED', 'VERIFIED')),

    file_name TEXT,
    mime_type TEXT,
    size_bytes BIGINT,
    sha256 TEXT NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
    visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'private')),
    -- Exact bytes of generated (JSON) certificates, kept so uploads can be retried byte-for-byte.
    document_body TEXT,

    ipfs_cid TEXT,
    pinata_file_id TEXT,
    storage_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (storage_status IN ('PENDING', 'STORED', 'FAILED')),

    chain_status TEXT NOT NULL DEFAULT 'NOT_SUBMITTED' CHECK (chain_status IN ('NOT_SUBMITTED', 'PENDING', 'CONFIRMED', 'FAILED')),
    chain_id TEXT,
    contract_address TEXT,
    chain_tx_hash TEXT,
    chain_block_number BIGINT,
    chain_registered_at TIMESTAMPTZ,

    public_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    private_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    revoked_at TIMESTAMPTZ,
    revocation_reason TEXT,
    revocation_tx_hash TEXT,

    last_error TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certificates_batch ON public.certificates(batch_id);
CREATE INDEX IF NOT EXISTS idx_certificates_root ON public.certificates(root_batch_id);
CREATE INDEX IF NOT EXISTS idx_certificates_source ON public.certificates(source_certificate_id);
-- The same document can only be registered once per batch (duplicate submissions return the existing record).
CREATE UNIQUE INDEX IF NOT EXISTS uq_certificates_origin_document
    ON public.certificates(batch_id, sha256) WHERE certificate_type = 'FARMER_ORIGIN';

CREATE TABLE IF NOT EXISTS public.traceability_events (
    id BIGSERIAL PRIMARY KEY,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('purchase', 'certificate', 'batch')),
    entity_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    actor_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_traceability_events_entity ON public.traceability_events(entity_type, entity_id);

-- Append-only guards -----------------------------------------------------------

CREATE OR REPLACE FUNCTION public.farmly_forbid_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION '% records are append-only and cannot be deleted', TG_TABLE_NAME USING ERRCODE = '42501';
END;
$$;

CREATE OR REPLACE FUNCTION public.farmly_guard_certificate_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF (NEW.id, NEW.certificate_type, NEW.batch_id, NEW.root_batch_id, NEW.transaction_id,
        NEW.source_certificate_id, NEW.upstream_certificate_ids, NEW.version, NEW.supersedes_certificate_id,
        NEW.subject_id, NEW.subject_role, NEW.subject_display_name, NEW.document_kind,
        NEW.issuing_organization, NEW.issued_on, NEW.expires_on, NEW.certification_claim,
        NEW.file_name, NEW.mime_type, NEW.size_bytes, NEW.sha256, NEW.visibility, NEW.document_body,
        NEW.public_metadata, NEW.private_metadata, NEW.created_by, NEW.created_at)
       IS DISTINCT FROM
       (OLD.id, OLD.certificate_type, OLD.batch_id, OLD.root_batch_id, OLD.transaction_id,
        OLD.source_certificate_id, OLD.upstream_certificate_ids, OLD.version, OLD.supersedes_certificate_id,
        OLD.subject_id, OLD.subject_role, OLD.subject_display_name, OLD.document_kind,
        OLD.issuing_organization, OLD.issued_on, OLD.expires_on, OLD.certification_claim,
        OLD.file_name, OLD.mime_type, OLD.size_bytes, OLD.sha256, OLD.visibility, OLD.document_body,
        OLD.public_metadata, OLD.private_metadata, OLD.created_by, OLD.created_at) THEN
        RAISE EXCEPTION 'Certificate content is immutable; create a new version instead' USING ERRCODE = '42501';
    END IF;

    IF OLD.ipfs_cid IS NOT NULL AND NEW.ipfs_cid IS DISTINCT FROM OLD.ipfs_cid THEN
        RAISE EXCEPTION 'Certificate IPFS CID cannot be changed once stored' USING ERRCODE = '42501';
    END IF;
    IF OLD.chain_status = 'CONFIRMED' AND (NEW.chain_status IS DISTINCT FROM OLD.chain_status
        OR NEW.chain_tx_hash IS DISTINCT FROM OLD.chain_tx_hash) THEN
        RAISE EXCEPTION 'Confirmed blockchain registration cannot be changed' USING ERRCODE = '42501';
    END IF;
    IF OLD.revoked_at IS NOT NULL AND (NEW.revoked_at IS DISTINCT FROM OLD.revoked_at
        OR NEW.revocation_reason IS DISTINCT FROM OLD.revocation_reason) THEN
        RAISE EXCEPTION 'Certificate revocation cannot be undone' USING ERRCODE = '42501';
    END IF;
    IF NEW.issuer_verification IS DISTINCT FROM OLD.issuer_verification AND NOT public.farmly_is_privileged() THEN
        RAISE EXCEPTION 'Issuer verification can only be set by the platform' USING ERRCODE = '42501';
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.farmly_guard_purchase_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF (NEW.id, NEW.idempotency_key, NEW.request_fingerprint, NEW.source_batch_id, NEW.child_batch_id,
        NEW.root_batch_id, NEW.seller_id, NEW.seller_role, NEW.buyer_id, NEW.buyer_role, NEW.quantity,
        NEW.unit, NEW.price_per_unit, NEW.currency, NEW.source_certificate_id, NEW.created_at)
       IS DISTINCT FROM
       (OLD.id, OLD.idempotency_key, OLD.request_fingerprint, OLD.source_batch_id, OLD.child_batch_id,
        OLD.root_batch_id, OLD.seller_id, OLD.seller_role, OLD.buyer_id, OLD.buyer_role, OLD.quantity,
        OLD.unit, OLD.price_per_unit, OLD.currency, OLD.source_certificate_id, OLD.created_at) THEN
        RAISE EXCEPTION 'Completed purchase records are immutable' USING ERRCODE = '42501';
    END IF;
    IF OLD.certificate_id IS NOT NULL AND NEW.certificate_id IS DISTINCT FROM OLD.certificate_id THEN
        RAISE EXCEPTION 'Purchase certificate link cannot be changed' USING ERRCODE = '42501';
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_certificates_no_delete ON public.certificates;
CREATE TRIGGER trg_certificates_no_delete BEFORE DELETE ON public.certificates
FOR EACH ROW EXECUTE FUNCTION public.farmly_forbid_delete();

DROP TRIGGER IF EXISTS trg_certificates_guard ON public.certificates;
CREATE TRIGGER trg_certificates_guard BEFORE UPDATE ON public.certificates
FOR EACH ROW EXECUTE FUNCTION public.farmly_guard_certificate_update();

DROP TRIGGER IF EXISTS trg_purchases_no_delete ON public.purchases;
CREATE TRIGGER trg_purchases_no_delete BEFORE DELETE ON public.purchases
FOR EACH ROW EXECUTE FUNCTION public.farmly_forbid_delete();

DROP TRIGGER IF EXISTS trg_purchases_guard ON public.purchases;
CREATE TRIGGER trg_purchases_guard BEFORE UPDATE ON public.purchases
FOR EACH ROW EXECUTE FUNCTION public.farmly_guard_purchase_update();

DROP TRIGGER IF EXISTS trg_traceability_events_no_delete ON public.traceability_events;
CREATE TRIGGER trg_traceability_events_no_delete BEFORE DELETE OR UPDATE ON public.traceability_events
FOR EACH ROW EXECUTE FUNCTION public.farmly_forbid_delete();

-- Row level security: no policies for anon/authenticated, so only the backend's
-- service-role key (which bypasses RLS) can read or write these tables.
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traceability_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dev_all_access" ON public.purchases;
DROP POLICY IF EXISTS "dev_all_access" ON public.certificates;
DROP POLICY IF EXISTS "dev_all_access" ON public.traceability_events;

-- ------------------------------------------------------------------------------
-- 4. ATOMIC, IDEMPOTENT PURCHASE
-- ------------------------------------------------------------------------------
-- Locks the source batch, validates the seller/buyer roles and available quantity,
-- deducts the quantity, creates the buyer's child batch and records the purchase,
-- all in one transaction. Repeating a request with the same idempotency key returns
-- the original purchase without deducting again.

CREATE OR REPLACE FUNCTION public.farmly_purchase_batch(
    p_idempotency_key TEXT,
    p_fingerprint TEXT,
    p_source_batch_id TEXT,
    p_buyer_id TEXT,
    p_buyer_role TEXT,
    p_buyer_name TEXT,
    p_quantity NUMERIC,
    p_price_per_unit NUMERIC,
    p_currency TEXT
)
RETURNS public.purchases
LANGUAGE plpgsql
AS $$
DECLARE
    existing public.purchases;
    src public.batches;
    result public.purchases;
    seller_role TEXT;
    source_cert TEXT;
    new_purchase_id TEXT;
    new_child_id TEXT;
BEGIN
    IF p_idempotency_key IS NULL OR length(p_idempotency_key) < 8 THEN
        RAISE EXCEPTION 'FARMLY_IDEMPOTENCY_KEY_REQUIRED' USING ERRCODE = '22023';
    END IF;

    SELECT * INTO existing FROM public.purchases WHERE idempotency_key = p_idempotency_key;
    IF FOUND THEN
        IF existing.request_fingerprint <> p_fingerprint THEN
            RAISE EXCEPTION 'FARMLY_IDEMPOTENCY_CONFLICT' USING ERRCODE = '22023';
        END IF;
        RETURN existing;
    END IF;

    IF p_quantity IS NULL OR p_quantity <= 0 THEN
        RAISE EXCEPTION 'FARMLY_INVALID_QUANTITY' USING ERRCODE = '22023';
    END IF;
    IF p_buyer_role NOT IN ('distributor', 'retailer') THEN
        RAISE EXCEPTION 'FARMLY_BUYER_ROLE_NOT_ALLOWED' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO src FROM public.batches WHERE id = p_source_batch_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'FARMLY_BATCH_NOT_FOUND' USING ERRCODE = 'P0002';
    END IF;

    seller_role := COALESCE(src.owner_role, CASE WHEN src.parent_lot_id IS NULL THEN 'farmer' END);
    IF (p_buyer_role = 'distributor' AND seller_role IS DISTINCT FROM 'farmer')
       OR (p_buyer_role = 'retailer' AND seller_role IS DISTINCT FROM 'distributor') THEN
        RAISE EXCEPTION 'FARMLY_SELLER_NOT_ALLOWED' USING ERRCODE = '42501';
    END IF;
    IF src.owner_id IS NOT DISTINCT FROM p_buyer_id THEN
        RAISE EXCEPTION 'FARMLY_SELF_PURCHASE' USING ERRCODE = '42501';
    END IF;
    IF COALESCE(src.quantity, 0) < p_quantity THEN
        RAISE EXCEPTION 'FARMLY_INSUFFICIENT_QUANTITY' USING ERRCODE = '22023';
    END IF;

    -- The newest non-revoked certificate attached to the source batch.
    SELECT id INTO source_cert
    FROM public.certificates
    WHERE batch_id = src.id AND revoked_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1;
    IF source_cert IS NULL THEN
        RAISE EXCEPTION 'FARMLY_SOURCE_CERTIFICATE_REQUIRED' USING ERRCODE = '22023';
    END IF;

    new_purchase_id := 'TX-' || to_char(NOW() AT TIME ZONE 'utc', 'YYYYMMDD') || '-'
        || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    new_child_id := src.id || '-' || CASE p_buyer_role WHEN 'distributor' THEN 'D' ELSE 'R' END
        || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));

    UPDATE public.batches
    SET quantity = quantity - p_quantity,
        is_split = true,
        status = CASE WHEN quantity - p_quantity = 0 THEN 'Sold' ELSE status END,
        updated_at = NOW()
    WHERE id = src.id;

    INSERT INTO public.batches (
        id, parent_lot_id, root_batch_id, lineage_path,
        farmer_id, farmer_registry_id, farmer_name,
        crop_type, crop, variety, harvest_quantity, quantity, original_quantity, unit,
        quality_grade, grading, location, harvest_date, sowing_date, certification,
        status, owner_id, owner_role, current_owner, current_owner_name, is_split, created_by
    ) VALUES (
        new_child_id, src.id, COALESCE(src.root_batch_id, src.id),
        COALESCE(src.lineage_path, ARRAY[src.id]) || new_child_id,
        src.farmer_id, src.farmer_registry_id, src.farmer_name,
        src.crop_type, src.crop, src.variety, p_quantity, p_quantity, p_quantity, COALESCE(src.unit, 'kg'),
        src.quality_grade, src.grading, src.location, src.harvest_date, src.sowing_date, src.certification,
        'Active', p_buyer_id, p_buyer_role, p_buyer_id, p_buyer_name, false, p_buyer_id
    );

    INSERT INTO public.purchases (
        id, idempotency_key, request_fingerprint, source_batch_id, child_batch_id, root_batch_id,
        seller_id, seller_role, seller_name, buyer_id, buyer_role, buyer_name,
        quantity, unit, price_per_unit, currency, source_certificate_id, status
    ) VALUES (
        new_purchase_id, p_idempotency_key, p_fingerprint, src.id, new_child_id, COALESCE(src.root_batch_id, src.id),
        src.owner_id, seller_role, COALESCE(src.current_owner_name, src.farmer_name), p_buyer_id, p_buyer_role, p_buyer_name,
        p_quantity, COALESCE(src.unit, 'kg'), p_price_per_unit, COALESCE(p_currency, 'INR'), source_cert, 'PURCHASE_CONFIRMED'
    )
    RETURNING * INTO result;

    INSERT INTO public.traceability_events (entity_type, entity_id, event_type, details, actor_id)
    VALUES (
        'purchase', new_purchase_id, 'PURCHASE_CONFIRMED',
        jsonb_build_object(
            'sourceBatchId', src.id,
            'childBatchId', new_child_id,
            'quantity', p_quantity,
            'remainingInSource', src.quantity - p_quantity
        ),
        p_buyer_id
    );

    RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.farmly_purchase_batch(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TEXT) FROM PUBLIC;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON FUNCTION public.farmly_purchase_batch(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TEXT) FROM anon, authenticated;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        GRANT EXECUTE ON FUNCTION public.farmly_purchase_batch(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TEXT) TO service_role;
    END IF;
END $$;
