-- ============================================================
-- Add SENIOR_PROFILE."HomeLocation" — free-form home address
-- collected from the adult-child user at senior creation.
--
-- Existing rows get an empty string backfill so the NOT NULL
-- constraint can be applied safely; the DEFAULT is then dropped
-- so new inserts must provide a value explicitly (the endpoint
-- validates non-empty).
-- ============================================================

BEGIN;

ALTER TABLE "SENIOR_PROFILE"
  ADD COLUMN "HomeLocation" TEXT NOT NULL DEFAULT '';

ALTER TABLE "SENIOR_PROFILE"
  ALTER COLUMN "HomeLocation" DROP DEFAULT;

COMMIT;
