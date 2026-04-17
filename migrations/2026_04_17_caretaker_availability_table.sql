-- ============================================================
-- Migration: Replace CARETAKER.Availability / .BookedSlots JSONB
--            with a normalized Caretaker_Availability table.
--
-- Semantics: availability is declared weekly by the caretaker and
-- may be flushed on a weekly cadence. No prior data is preserved.
-- Run once against an existing database.
-- ============================================================

BEGIN;

-- 1. Create the new table
CREATE TABLE IF NOT EXISTS "Caretaker_Availability" (
  "Availability_ID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "CaretakerID"     UUID NOT NULL REFERENCES "CARETAKER"("UserID") ON DELETE CASCADE,
  "StartDateTime"   TIMESTAMPTZ NOT NULL,
  "EndDateTime"     TIMESTAMPTZ NOT NULL,
  "isActive"        BOOLEAN NOT NULL DEFAULT TRUE,
  "CreatedDate"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ("EndDateTime" > "StartDateTime")
);

CREATE INDEX IF NOT EXISTS idx_caretaker_availability_caretaker
  ON "Caretaker_Availability" ("CaretakerID");

CREATE INDEX IF NOT EXISTS idx_caretaker_availability_range
  ON "Caretaker_Availability" ("CaretakerID", "StartDateTime", "EndDateTime")
  WHERE "isActive" = TRUE;

-- 2. Drop the obsolete JSONB columns on CARETAKER
ALTER TABLE "CARETAKER" DROP COLUMN IF EXISTS "Availability";
ALTER TABLE "CARETAKER" DROP COLUMN IF EXISTS "BookedSlots";

COMMIT;
