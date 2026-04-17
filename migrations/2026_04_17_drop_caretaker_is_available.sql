-- ============================================================
-- Migration: Drop CARETAKER.IsAvailable.
--
-- Availability is now modelled by the Caretaker_Availability table;
-- a caretaker with no active hourly slots is simply not bookable, so
-- the boolean IsAvailable flag is redundant and its partial index is
-- no longer useful.
--
-- Safe to re-run: guarded with IF EXISTS.
-- ============================================================

BEGIN;

DROP INDEX IF EXISTS idx_caretaker_available;

ALTER TABLE "CARETAKER" DROP COLUMN IF EXISTS "IsAvailable";

COMMIT;
