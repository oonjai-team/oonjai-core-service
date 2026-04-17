-- ============================================================
-- Migration: Replace ACTIVITY.Host / HostAvatar / HostDescription
--            with a proper ACTIVITY → Point_of_Contact → PROVIDER
--            relationship. This version is "precise": it reads the
--            existing ACTIVITY rows and creates exactly one POC per
--            distinct host that actually appears in the data,
--            preserving the original name, avatar URL, and description.
--
-- Strategy
--   1. Extend Point_of_Contact with Avatar + Description columns.
--   2. Add "POCID" FK column to ACTIVITY.
--   3. Create N "Oonjai Community Partner" PROVIDER rows, where
--      N = ceil(distinct_hosts / 3) capped at 60, so POCs spread
--      across realistic-looking partner organisations.
--   4. For every DISTINCT (Host, HostAvatar, HostDescription) triple
--      in ACTIVITY, insert one Point_of_Contact row with that exact
--      data (FirstName/LastName parsed from Host, Phone synthesised).
--   5. UPDATE every ACTIVITY row: match to its POC by (Host,
--      HostAvatar, HostDescription) exactly — no data loss.
--   6. Drop the now-redundant denormalized host columns.
--
-- Because the same host name can legitimately recur across many
-- activities (e.g. "Tom Brady" running 600+ sessions throughout
-- 2026-05 → 2027-05), this produces the realistic "same person is
-- host across the year" relationship the product wants — grounded
-- in actual data rather than synthetic clustering.
--
-- Safe to re-run: ALTER TABLE uses IF NOT EXISTS / IF EXISTS; the
-- POC and PROVIDER inserts guard on empty tables.
-- ============================================================

BEGIN;

-- ── 1. Extend Point_of_Contact ────────────────────────────────────────────
ALTER TABLE "Point_of_Contact" ADD COLUMN IF NOT EXISTS "Avatar"      TEXT;
ALTER TABLE "Point_of_Contact" ADD COLUMN IF NOT EXISTS "Description" TEXT;

-- ── 2. Add POCID FK to ACTIVITY ───────────────────────────────────────────
ALTER TABLE "ACTIVITY"
  ADD COLUMN IF NOT EXISTS "POCID" UUID
  REFERENCES "Point_of_Contact"("POCID") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_activity_poc ON "ACTIVITY" ("POCID");

-- ── 3. Seed PROVIDERs sized to the real host count ────────────────────────
-- ceil(distinct_hosts / 3), capped at 60. If providers already exist, skip.
INSERT INTO "PROVIDER" ("ProviderID", "ProviderName", "Address", "ContactInfo")
SELECT
  gen_random_uuid(),
  'Oonjai Community Partner #' || LPAD(n::text, 2, '0'),
  (ARRAY['Bangkok','Chiang Mai','Phuket','Pattaya','Khon Kaen','Nonthaburi'])[1 + ((n - 1) % 6)]
    || ' Branch ' || n,
  'partner' || n || '@oonjai-partners.example'
FROM generate_series(
  1,
  LEAST(
    60,
    GREATEST(
      1,
      (SELECT CEIL(COUNT(DISTINCT "Host")::numeric / 3)::int
       FROM "ACTIVITY"
       WHERE "Host" IS NOT NULL AND "Host" <> '')
    )
  )
) AS n
WHERE NOT EXISTS (SELECT 1 FROM "PROVIDER" LIMIT 1);

-- ── 4. One POC per distinct host in ACTIVITY, preserving all data ────────
-- Host "First Last" → FirstName = first token, LastName = rest.
WITH distinct_hosts AS (
  SELECT DISTINCT
    "Host"            AS full_name,
    "HostAvatar"      AS avatar,
    "HostDescription" AS description
  FROM "ACTIVITY"
  WHERE "Host" IS NOT NULL AND "Host" <> ''
),
host_numbered AS (
  SELECT
    full_name, avatar, description,
    ROW_NUMBER() OVER (ORDER BY full_name, avatar) AS idx
  FROM distinct_hosts
),
providers_idx AS (
  SELECT "ProviderID", (ROW_NUMBER() OVER (ORDER BY "ProviderID") - 1) AS idx
  FROM "PROVIDER"
),
provider_count AS (SELECT COUNT(*) AS n FROM providers_idx)
INSERT INTO "Point_of_Contact"
  ("POCID", "ProviderID", "FirstName", "LastName", "PhoneNumber", "Avatar", "Description")
SELECT
  gen_random_uuid(),
  pv."ProviderID",
  split_part(hn.full_name, ' ', 1)                                          AS first_name,
  COALESCE(
    NULLIF(
      TRIM(substring(hn.full_name FROM position(' ' IN hn.full_name) + 1)),
      ''
    ),
    ''
  )                                                                          AS last_name,
  '08' || LPAD(CAST(10000000 + hn.idx AS TEXT), 8, '0')                      AS phone,
  hn.avatar                                                                  AS avatar,
  hn.description                                                             AS description
FROM host_numbered hn
JOIN provider_count pc ON TRUE
JOIN providers_idx  pv ON pv.idx = ((hn.idx - 1) % pc.n)::bigint
WHERE NOT EXISTS (
  SELECT 1
  FROM "Point_of_Contact" existing
  WHERE existing."Avatar" = hn.avatar
    AND COALESCE(existing."Description", '') = COALESCE(hn.description, '')
);

-- ── 5. Link each ACTIVITY row to its POC via exact (Host, Avatar, Desc) ─
UPDATE "ACTIVITY" a
SET "POCID" = poc."POCID"
FROM "Point_of_Contact" poc
WHERE a."POCID" IS NULL
  AND a."HostAvatar" = poc."Avatar"
  AND COALESCE(a."HostDescription", '') = COALESCE(poc."Description", '')
  AND (
    -- rebuild full name from POC; collapse double space when LastName is empty
    TRIM(poc."FirstName" || ' ' || COALESCE(poc."LastName", '')) = a."Host"
  );

-- Sanity check: every activity with a non-empty Host should now have a POC.
DO $$
DECLARE
  unmatched INT;
BEGIN
  SELECT COUNT(*) INTO unmatched
  FROM "ACTIVITY"
  WHERE "POCID" IS NULL
    AND "Host" IS NOT NULL AND "Host" <> '';
  IF unmatched > 0 THEN
    RAISE EXCEPTION 'Migration failed: % activities have a non-empty Host but no POC was matched. Investigate before re-running.', unmatched;
  END IF;
END $$;

-- ── 6. Drop the redundant denormalized host columns ──────────────────────
ALTER TABLE "ACTIVITY" DROP COLUMN IF EXISTS "Host";
ALTER TABLE "ACTIVITY" DROP COLUMN IF EXISTS "HostAvatar";
ALTER TABLE "ACTIVITY" DROP COLUMN IF EXISTS "HostDescription";

COMMIT;
