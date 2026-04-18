-- ============================================================
-- Data fix: redistribute ACTIVITY.Location so (category × city)
-- combinations are all populated.
--
-- Why: seed-activities.ts used `index % N` for both category and
-- city with N=5 each, producing a perfect 1:1 correlation:
--   Social Companion ↔ Bangkok, Exercise ↔ Chiang Mai, …
-- Any cross combination ("Exercise + Bangkok", "Wellness + Phuket")
-- returned 0 activities, making filter combinations look broken.
--
-- This migration reshuffles by deterministically reassigning each
-- scripted activity a (venue, city) pair where the city rotates on a
-- slower cycle than the category. It preserves the 4 hand-crafted
-- seed.sql activities (they all end in ", BKK" and are skipped).
--
-- Safe to re-run.
-- ============================================================

BEGIN;

WITH
  -- All seed venues per city, exactly as listed in scripts/seed-activities.ts.
  venues (city, venue, venue_idx) AS (
    VALUES
      ('Bangkok',    'Lumphini Park',         0),
      ('Bangkok',    'Benchakitti Park',      1),
      ('Bangkok',    'Chatuchak Market',      2),
      ('Bangkok',    'Asiatique Riverfront',  3),
      ('Bangkok',    'Siam Paragon',          4),
      ('Chiang Mai', 'Old City Gate',         0),
      ('Chiang Mai', 'Nimman Community Mall', 1),
      ('Chiang Mai', 'Huay Tung Tao Lake',    2),
      ('Chiang Mai', 'Wat Phra Singh',        3),
      ('Chiang Mai', 'Doi Suthep',            4),
      ('Phuket',     'Patong Beach',          0),
      ('Phuket',     'Old Town',              1),
      ('Phuket',     'Big Buddha Hill',       2),
      ('Phuket',     'Rawai Pier',            3),
      ('Phuket',     'Phromthep Cape',        4),
      ('Pattaya',    'Jomtien Beach',         0),
      ('Pattaya',    'Walking Street',        1),
      ('Pattaya',    'Nong Nooch Garden',     2),
      ('Pattaya',    'Pattaya Park',          3),
      ('Pattaya',    'Koh Larn',              4),
      ('Hua Hin',    'Cicada Market',         0),
      ('Hua Hin',    'Hua Hin Beach',         1),
      ('Hua Hin',    'Khao Takiab Temple',    2),
      ('Hua Hin',    'Hua Hin Night Market',  3),
      ('Hua Hin',    'Pranburi Forest Park',  4)
  ),
  cities (idx, city) AS (
    VALUES (0,'Bangkok'),(1,'Chiang Mai'),(2,'Phuket'),(3,'Pattaya'),(4,'Hua Hin')
  ),
  -- Exclude the 4 hand-crafted activities from seed.sql — they end in ", BKK".
  scripted AS (
    SELECT
      "ActivityID",
      (ROW_NUMBER() OVER (ORDER BY "CreatedDate", "ActivityID") - 1) AS idx
    FROM "ACTIVITY"
    WHERE "Location" NOT LIKE '%, BKK'
  )
UPDATE "ACTIVITY" a
SET "Location" = v.venue || ', ' || c.city
FROM scripted s
JOIN cities c ON c.idx = (s.idx / 5) % 5                 -- city rotates every 5 rows
JOIN venues v ON v.city = c.city AND v.venue_idx = s.idx % 5
WHERE a."ActivityID" = s."ActivityID";

COMMIT;
