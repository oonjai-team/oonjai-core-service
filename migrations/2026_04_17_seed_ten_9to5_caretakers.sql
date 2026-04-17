-- ============================================================
-- Seed: 10 new caretakers working Mon–Fri 09:00–17:00.
--
-- Inserts:
--   • 10 USER rows (Role='caretaker') with fixed UUIDs so the script is
--     idempotent and rows are traceable.
--   • 10 CARETAKER profile rows.
--   • Caretaker_Availability hourly slots for Mon–Fri 09:00–17:00 (8 hours/day)
--     for the 4 upcoming weeks starting next Monday. Existing availability
--     for these caretakers is wiped first so the script is fully re-runnable.
--
-- UUIDs use prefix `a1000000-…-00000000001X` (X = 1..10) so you can grep /
-- DELETE them easily if you want to undo.
-- ============================================================

BEGIN;

-- ── 1. USER rows ─────────────────────────────────────────────────────────
INSERT INTO "USER" ("UserID", "FirstName", "LastName", "Email", "Phone", "Role", "CreatedDate") VALUES
  ('a1000000-0000-0000-0000-000000000011', 'Somjai',    'Wongkam',     'somjai.wongkam@oonjai.com',    '0812345101', 'caretaker', NOW()),
  ('a1000000-0000-0000-0000-000000000012', 'Preecha',   'Boonmee',     'preecha.boonmee@oonjai.com',   '0812345102', 'caretaker', NOW()),
  ('a1000000-0000-0000-0000-000000000013', 'Naree',     'Tantip',      'naree.tantip@oonjai.com',      '0812345103', 'caretaker', NOW()),
  ('a1000000-0000-0000-0000-000000000014', 'Wirat',     'Songphol',    'wirat.songphol@oonjai.com',    '0812345104', 'caretaker', NOW()),
  ('a1000000-0000-0000-0000-000000000015', 'Patcharee', 'Suriyan',     'patcharee.suriyan@oonjai.com', '0812345105', 'caretaker', NOW()),
  ('a1000000-0000-0000-0000-000000000016', 'Anuwat',    'Chaiyong',    'anuwat.chaiyong@oonjai.com',   '0812345106', 'caretaker', NOW()),
  ('a1000000-0000-0000-0000-000000000017', 'Jiraporn',  'Panya',       'jiraporn.panya@oonjai.com',    '0812345107', 'caretaker', NOW()),
  ('a1000000-0000-0000-0000-000000000018', 'Thanakorn', 'Ruangsri',    'thanakorn.ruangsri@oonjai.com','0812345108', 'caretaker', NOW()),
  ('a1000000-0000-0000-0000-000000000019', 'Orathai',   'Kiatkul',     'orathai.kiatkul@oonjai.com',   '0812345109', 'caretaker', NOW()),
  ('a1000000-0000-0000-0000-00000000001a', 'Somsak',    'Chantawan',   'somsak.chantawan@oonjai.com',  '0812345110', 'caretaker', NOW())
ON CONFLICT ("UserID") DO NOTHING;

-- ── 2. CARETAKER profile rows ────────────────────────────────────────────
INSERT INTO "CARETAKER"
  ("UserID", "Bio", "Specialization", "HourlyRate", "Currency", "Experience",
   "Rating", "ReviewCount", "IsVerified", "ContactInfo", "Permission")
VALUES
  ('a1000000-0000-0000-0000-000000000011',
   'Reliable daytime caregiver focused on home care and companionship.',
   'Home Care, Companionship',
    90, 'THB', 4, 4.6, 12, TRUE, 'somjai.wongkam@oonjai.com',    'full'),
  ('a1000000-0000-0000-0000-000000000012',
   'Patient caregiver with a background in post-surgery recovery.',
   'Post-Surgery, Home Care',
   110, 'THB', 7, 4.8, 34, TRUE, 'preecha.boonmee@oonjai.com',   'full'),
  ('a1000000-0000-0000-0000-000000000013',
   'Energetic caregiver who enjoys outdoor mobility exercises.',
   'Mobility, Exercise',
    85, 'THB', 3, 4.5,  9, TRUE, 'naree.tantip@oonjai.com',      'full'),
  ('a1000000-0000-0000-0000-000000000014',
   'Experienced in dementia support with a calm, gentle approach.',
   'Dementia Care, Home Care',
   120, 'THB', 9, 4.9, 51, TRUE, 'wirat.songphol@oonjai.com',    'full'),
  ('a1000000-0000-0000-0000-000000000015',
   'Meal-prep specialist with nutrition planning expertise.',
   'Meal Prep, Home Care',
    95, 'THB', 5, 4.7, 22, TRUE, 'patcharee.suriyan@oonjai.com', 'full'),
  ('a1000000-0000-0000-0000-000000000016',
   'Licensed physical therapist focused on senior rehabilitation.',
   'Physical Therapy, Mobility',
   140, 'THB', 10, 5.0, 78, TRUE, 'anuwat.chaiyong@oonjai.com',  'full'),
  ('a1000000-0000-0000-0000-000000000017',
   'Compassionate caregiver specialising in chronic disease monitoring.',
   'Post-Surgery, Home Care',
   105, 'THB', 6, 4.6, 19, TRUE, 'jiraporn.panya@oonjai.com',    'full'),
  ('a1000000-0000-0000-0000-000000000018',
   'Former hospital nurse offering medical escort services.',
   'Post-Surgery, Dementia Care',
   130, 'THB', 8, 4.8, 40, TRUE, 'thanakorn.ruangsri@oonjai.com','full'),
  ('a1000000-0000-0000-0000-000000000019',
   'Daily-living assistant with a cheerful attitude and strong references.',
   'Home Care, Mobility',
    88, 'THB', 4, 4.6, 14, TRUE, 'orathai.kiatkul@oonjai.com',   'full'),
  ('a1000000-0000-0000-0000-00000000001a',
   'Overnight-capable caretaker with wide-ranging home-care experience.',
   'Home Care, Dementia Care',
   100, 'THB', 6, 4.7, 27, TRUE, 'somsak.chantawan@oonjai.com',  'full')
ON CONFLICT ("UserID") DO NOTHING;

-- ── 3. Caretaker_Availability: Mon–Fri 09:00–17:00, 4 upcoming weeks ────
-- Wipe any prior availability for just these 10 so re-runs produce a clean set.
DELETE FROM "Caretaker_Availability"
WHERE "CaretakerID" IN (
  'a1000000-0000-0000-0000-000000000011',
  'a1000000-0000-0000-0000-000000000012',
  'a1000000-0000-0000-0000-000000000013',
  'a1000000-0000-0000-0000-000000000014',
  'a1000000-0000-0000-0000-000000000015',
  'a1000000-0000-0000-0000-000000000016',
  'a1000000-0000-0000-0000-000000000017',
  'a1000000-0000-0000-0000-000000000018',
  'a1000000-0000-0000-0000-000000000019',
  'a1000000-0000-0000-0000-00000000001a'
);

INSERT INTO "Caretaker_Availability" ("CaretakerID", "StartDateTime", "EndDateTime", "isActive")
SELECT
  ct.caretaker_id,
  (nm.dt + (w * INTERVAL '7 days') + (d * INTERVAL '1 day') + (h       * INTERVAL '1 hour'))::timestamptz AS start_dt,
  (nm.dt + (w * INTERVAL '7 days') + (d * INTERVAL '1 day') + ((h + 1) * INTERVAL '1 hour'))::timestamptz AS end_dt,
  TRUE
FROM (VALUES
  ('a1000000-0000-0000-0000-000000000011'::uuid),
  ('a1000000-0000-0000-0000-000000000012'::uuid),
  ('a1000000-0000-0000-0000-000000000013'::uuid),
  ('a1000000-0000-0000-0000-000000000014'::uuid),
  ('a1000000-0000-0000-0000-000000000015'::uuid),
  ('a1000000-0000-0000-0000-000000000016'::uuid),
  ('a1000000-0000-0000-0000-000000000017'::uuid),
  ('a1000000-0000-0000-0000-000000000018'::uuid),
  ('a1000000-0000-0000-0000-000000000019'::uuid),
  ('a1000000-0000-0000-0000-00000000001a'::uuid)
) AS ct(caretaker_id)
CROSS JOIN (
  SELECT (date_trunc('week', (NOW() AT TIME ZONE 'UTC')::date) + INTERVAL '7 days')::timestamptz AS dt
) nm
CROSS JOIN generate_series(0, 3)  AS w  -- 4 weeks
CROSS JOIN generate_series(0, 4)  AS d  -- Mon..Fri
CROSS JOIN generate_series(9, 16) AS h; -- 09:00..16:00 start → end = start + 1h

COMMIT;
