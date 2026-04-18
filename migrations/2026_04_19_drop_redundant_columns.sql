-- ============================================================
-- Drop redundant columns:
--   - ADULT_CHILD."Phone"  (already on USER."Phone")
--   - INCIDENT."SeniorID"  (derivable via INCIDENT.BookingID -> BOOKING.SeniorID)
--
-- Backfill USER."Phone" from ADULT_CHILD."Phone" where USER."Phone"
-- is null/empty, so no contact info is lost.
-- Abort if any INCIDENT."SeniorID" disagrees with its booking.
-- ============================================================

BEGIN;

-- 1. ADULT_CHILD.Phone -> USER.Phone backfill, then drop.
UPDATE "USER" u
SET "Phone" = ac."Phone"
FROM "ADULT_CHILD" ac
WHERE u."UserID" = ac."UserID"
  AND ac."Phone" IS NOT NULL
  AND ac."Phone" <> ''
  AND (u."Phone" IS NULL OR u."Phone" = '');

ALTER TABLE "ADULT_CHILD" DROP COLUMN "Phone";

-- 2. INCIDENT.SeniorID: verify consistency with booking, then drop.
DO $$
DECLARE mismatch_count INT;
BEGIN
  SELECT COUNT(*) INTO mismatch_count
  FROM "INCIDENT" i
  JOIN "BOOKING" b ON b."BookingID" = i."BookingID"
  WHERE i."SeniorID" IS NOT NULL
    AND i."SeniorID" <> b."SeniorID";
  IF mismatch_count > 0 THEN
    RAISE EXCEPTION 'INCIDENT.SeniorID disagrees with BOOKING.SeniorID on % rows; aborting', mismatch_count;
  END IF;
END $$;

DROP INDEX IF EXISTS idx_incident_senior;
ALTER TABLE "INCIDENT" DROP COLUMN "SeniorID";

COMMIT;
