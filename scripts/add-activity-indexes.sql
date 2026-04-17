-- Incremental migration: adds ACTIVITY indexes used by the server-side
-- filter endpoint. Safe to run on an existing database — everything is
-- IF NOT EXISTS.
--
-- Run once:
--   psql "$DATABASE_URL" -f scripts/add-activity-indexes.sql

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_activity_category
  ON "ACTIVITY" ("Category");

CREATE INDEX IF NOT EXISTS idx_activity_start_date
  ON "ACTIVITY" ("StartDate");

CREATE INDEX IF NOT EXISTS idx_activity_price
  ON "ACTIVITY" ("Price");

CREATE INDEX IF NOT EXISTS idx_activity_title_trgm
  ON "ACTIVITY" USING GIN ("Title" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_activity_location_trgm
  ON "ACTIVITY" USING GIN ("Location" gin_trgm_ops);
