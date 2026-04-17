-- ============================================================
-- Seed: Populate Caretaker_Availability with varied schedules.
--
-- Each row is one 1-hour slot so bookings can be made hour-by-hour.
-- Caretakers are assigned one of 8 schedule archetypes deterministically
-- by UserID order (archetype = row_number % 8) to mimic a realistic mix:
--   0 Early bird       Mon-Fri 06:00–10:00
--   1 Standard day     Mon-Fri 09:00–17:00
--   2 Afternoon        Mon-Fri 13:00–19:00
--   3 Weekend only     Sat-Sun 08:00–18:00
--   4 Daily part-time  Mon-Sun 10:00–14:00
--   5 Tue-Sat dayshift 08:00–16:00
--   6 Evening          Mon-Fri 17:00–22:00
--   7 Fri-Sun full     Fri-Sun 09:00–17:00
--
-- Covers 4 upcoming weeks starting from the next Monday.
-- Safe to re-run: skips rows where the same (caretaker, start, end)
-- hourly slot already exists.
-- ============================================================

WITH ranked_caretakers AS (
  SELECT "UserID", (ROW_NUMBER() OVER (ORDER BY "UserID") - 1) AS idx
  FROM "CARETAKER"
),
-- day_offset: 0 = Monday, … 6 = Sunday
-- hour_start..hour_end are inclusive start-hours for each 1-hour slot
archetypes (archetype_id, day_offset, hour_start, hour_end) AS (
  VALUES
    -- 0: Early bird — Mon-Fri 06:00–10:00
    (0, 0, 6,  9),
    (0, 1, 6,  9),
    (0, 2, 6,  9),
    (0, 3, 6,  9),
    (0, 4, 6,  9),
    -- 1: Standard day — Mon-Fri 09:00–17:00
    (1, 0, 9, 16),
    (1, 1, 9, 16),
    (1, 2, 9, 16),
    (1, 3, 9, 16),
    (1, 4, 9, 16),
    -- 2: Afternoon — Mon-Fri 13:00–19:00
    (2, 0, 13, 18),
    (2, 1, 13, 18),
    (2, 2, 13, 18),
    (2, 3, 13, 18),
    (2, 4, 13, 18),
    -- 3: Weekend only — Sat-Sun 08:00–18:00
    (3, 5, 8, 17),
    (3, 6, 8, 17),
    -- 4: Daily part-time — Mon-Sun 10:00–14:00
    (4, 0, 10, 13),
    (4, 1, 10, 13),
    (4, 2, 10, 13),
    (4, 3, 10, 13),
    (4, 4, 10, 13),
    (4, 5, 10, 13),
    (4, 6, 10, 13),
    -- 5: Tue-Sat dayshift — 08:00–16:00
    (5, 1, 8, 15),
    (5, 2, 8, 15),
    (5, 3, 8, 15),
    (5, 4, 8, 15),
    (5, 5, 8, 15),
    -- 6: Evening — Mon-Fri 17:00–22:00
    (6, 0, 17, 21),
    (6, 1, 17, 21),
    (6, 2, 17, 21),
    (6, 3, 17, 21),
    (6, 4, 17, 21),
    -- 7: Fri-Sun full — 09:00–17:00
    (7, 4, 9, 16),
    (7, 5, 9, 16),
    (7, 6, 9, 16)
),
archetype_count AS (
  SELECT MAX(archetype_id) + 1 AS n FROM archetypes
),
assigned AS (
  SELECT rc."UserID", (rc.idx % ac.n) AS archetype_id
  FROM ranked_caretakers rc
  CROSS JOIN archetype_count ac
),
next_monday AS (
  SELECT (date_trunc('week', (NOW() AT TIME ZONE 'UTC')::date) + INTERVAL '7 days')::timestamptz AS dt
)
INSERT INTO "Caretaker_Availability" ("CaretakerID", "StartDateTime", "EndDateTime", "isActive")
SELECT
  a."UserID",
  nm.dt + (w * INTERVAL '7 days') + (arch.day_offset * INTERVAL '1 day') + (h       * INTERVAL '1 hour') AS start_dt,
  nm.dt + (w * INTERVAL '7 days') + (arch.day_offset * INTERVAL '1 day') + ((h + 1) * INTERVAL '1 hour') AS end_dt,
  TRUE
FROM assigned a
JOIN archetypes arch ON arch.archetype_id = a.archetype_id
CROSS JOIN next_monday nm
CROSS JOIN generate_series(0, 3) AS w  -- 4 weeks
CROSS JOIN LATERAL generate_series(arch.hour_start, arch.hour_end) AS h
WHERE NOT EXISTS (
  SELECT 1 FROM "Caretaker_Availability" ca
  WHERE ca."CaretakerID"   = a."UserID"
    AND ca."StartDateTime" = (nm.dt + (w * INTERVAL '7 days') + (arch.day_offset * INTERVAL '1 day') + (h       * INTERVAL '1 hour'))
    AND ca."EndDateTime"   = (nm.dt + (w * INTERVAL '7 days') + (arch.day_offset * INTERVAL '1 day') + ((h + 1) * INTERVAL '1 hour'))
);
