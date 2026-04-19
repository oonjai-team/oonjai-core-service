-- ============================================================
-- Oonjai Core Service — Seed Data
-- Loads caretakers (USER + CARETAKER) and activities from database.json
-- Run AFTER migration.sql
-- ============================================================

-- ── Caretaker users (new UUIDs replacing ct-001 to ct-008) ──────────────────
INSERT INTO "USER" ("UserID", "FirstName", "LastName", "Email", "Role", "CreatedDate")
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Somying',   'Charoensuk',   'somying@oonjai.com',   'caretaker', to_timestamp(1774000000000 / 1000.0)),
  ('a0000000-0000-0000-0000-000000000002', 'Nattapong', 'Wongsakul',    'nattapong@oonjai.com', 'caretaker', to_timestamp(1774000000000 / 1000.0)),
  ('a0000000-0000-0000-0000-000000000003', 'Pranee',    'Srisombat',    'pranee@oonjai.com',    'caretaker', to_timestamp(1774000000000 / 1000.0)),
  ('a0000000-0000-0000-0000-000000000004', 'Kittisak',  'Phansuwan',    'kittisak@oonjai.com',  'caretaker', to_timestamp(1774000000000 / 1000.0)),
  ('a0000000-0000-0000-0000-000000000005', 'Aranya',    'Thongdee',     'aranya@oonjai.com',    'caretaker', to_timestamp(1774000000000 / 1000.0)),
  ('a0000000-0000-0000-0000-000000000006', 'Wichai',    'Raksamee',     'wichai@oonjai.com',    'caretaker', to_timestamp(1774000000000 / 1000.0)),
  ('a0000000-0000-0000-0000-000000000007', 'Supattra',  'Jantarawong',  'supattra@oonjai.com',  'caretaker', to_timestamp(1774000000000 / 1000.0)),
  ('a0000000-0000-0000-0000-000000000008', 'Chalerm',   'Buadok',       'chalerm@oonjai.com',   'caretaker', to_timestamp(1774000000000 / 1000.0))
ON CONFLICT ("UserID") DO NOTHING;

-- ── Caretaker profiles ──────────────────────────────────────────────────────
INSERT INTO "CARETAKER" ("UserID", "Bio", "Specialization", "HourlyRate", "Currency", "Experience", "Rating", "ReviewCount", "IsVerified", "ContactInfo", "Permission")
VALUES
  -- ct-001: Somying
  ('a0000000-0000-0000-0000-000000000001',
   'Compassionate caregiver with extensive experience in elderly home care and post-surgery recovery support.',
   'Home Care, Post-Surgery, Meal Prep',
   85, 'THB', 6, 4.9, 42, TRUE, 'somying@oonjai.com', 'full'),

  -- ct-002: Nattapong
  ('a0000000-0000-0000-0000-000000000002',
   'Certified physical therapist specializing in mobility rehabilitation and gentle exercise programs for seniors.',
   'Physical Therapy, Mobility, Dementia Care',
   120, 'THB', 9, 4.8, 65, TRUE, 'nattapong@oonjai.com', 'full'),

  -- ct-003: Pranee
  ('a0000000-0000-0000-0000-000000000003',
   'Warm and patient caregiver focused on companionship, outings, and keeping seniors socially active.',
   'Home Care, Meal Prep',
   70, 'THB', 3, 4.7, 18, TRUE, 'pranee@oonjai.com', 'full'),

  -- ct-004: Kittisak
  ('a0000000-0000-0000-0000-000000000004',
   'Former hospital nurse with deep expertise in medical escort, medication management, and chronic disease monitoring.',
   'Post-Surgery, Physical Therapy, Dementia Care',
   150, 'THB', 12, 5.0, 89, TRUE, 'kittisak@oonjai.com', 'full'),

  -- ct-005: Aranya
  ('a0000000-0000-0000-0000-000000000005',
   'Dedicated caretaker with a gentle approach, experienced in dementia care and daily living assistance.',
   'Dementia Care, Home Care, Mobility',
   95, 'THB', 7, 4.6, 31, TRUE, 'aranya@oonjai.com', 'full'),

  -- ct-006: Wichai
  ('a0000000-0000-0000-0000-000000000006',
   'Energetic caregiver who loves outdoor activities and helping seniors stay physically active and engaged.',
   'Mobility, Physical Therapy',
   80, 'THB', 4, 4.5, 12, TRUE, 'wichai@oonjai.com', 'full'),

  -- ct-007: Supattra
  ('a0000000-0000-0000-0000-000000000007',
   'Experienced home care specialist with a background in nutrition planning and meal preparation for elderly.',
   'Home Care, Meal Prep, Post-Surgery',
   90, 'THB', 5, 4.8, 27, TRUE, 'supattra@oonjai.com', 'full'),

  -- ct-008: Chalerm
  ('a0000000-0000-0000-0000-000000000008',
   'Calm and reliable caregiver specializing in overnight care and mobility support for seniors with limited movement.',
   'Mobility, Dementia Care, Home Care',
   100, 'THB', 8, 4.7, 53, TRUE, 'chalerm@oonjai.com', 'full')
ON CONFLICT ("UserID") DO NOTHING;

-- ── Caretaker availability windows (1-hour slots, weekly regeneration) ──
-- Each row is one bookable hour so bookings can be made hour-by-hour.
-- Dates cover 2026-04-13 Mon → 2026-04-19 Sun.
-- Per-caretaker schedule:
--   ct-001: Mon-Fri 08-16  (hours 8..15)
--   ct-002: Mon-Sat 10-18  (hours 10..17)
--   ct-003: Mon-Fri 09-17  (hours 9..16)
--   ct-004: Tue-Sat 07-15  (hours 7..14)
--   ct-005: Mon-Thu 09-13  (hours 9..12)
--   ct-006: Mon-Fri 12-20  (hours 12..19)
--   ct-007: Every day 09-17 (hours 9..16)
--   ct-008: Sun,Wed-Sat 08-16 (hours 8..15)
WITH schedule (caretaker, day_date, hour_start, hour_end) AS (
  VALUES
    ('a0000000-0000-0000-0000-000000000001'::uuid, DATE '2026-04-13', 8, 15),
    ('a0000000-0000-0000-0000-000000000001'::uuid, DATE '2026-04-14', 8, 15),
    ('a0000000-0000-0000-0000-000000000001'::uuid, DATE '2026-04-15', 8, 15),
    ('a0000000-0000-0000-0000-000000000001'::uuid, DATE '2026-04-16', 8, 15),
    ('a0000000-0000-0000-0000-000000000001'::uuid, DATE '2026-04-17', 8, 15),
    ('a0000000-0000-0000-0000-000000000002'::uuid, DATE '2026-04-13', 10, 17),
    ('a0000000-0000-0000-0000-000000000002'::uuid, DATE '2026-04-14', 10, 17),
    ('a0000000-0000-0000-0000-000000000002'::uuid, DATE '2026-04-15', 10, 17),
    ('a0000000-0000-0000-0000-000000000002'::uuid, DATE '2026-04-16', 10, 17),
    ('a0000000-0000-0000-0000-000000000002'::uuid, DATE '2026-04-17', 10, 17),
    ('a0000000-0000-0000-0000-000000000002'::uuid, DATE '2026-04-18', 10, 17),
    ('a0000000-0000-0000-0000-000000000003'::uuid, DATE '2026-04-13', 9, 16),
    ('a0000000-0000-0000-0000-000000000003'::uuid, DATE '2026-04-14', 9, 16),
    ('a0000000-0000-0000-0000-000000000003'::uuid, DATE '2026-04-15', 9, 16),
    ('a0000000-0000-0000-0000-000000000003'::uuid, DATE '2026-04-16', 9, 16),
    ('a0000000-0000-0000-0000-000000000003'::uuid, DATE '2026-04-17', 9, 16),
    ('a0000000-0000-0000-0000-000000000004'::uuid, DATE '2026-04-14', 7, 14),
    ('a0000000-0000-0000-0000-000000000004'::uuid, DATE '2026-04-15', 7, 14),
    ('a0000000-0000-0000-0000-000000000004'::uuid, DATE '2026-04-16', 7, 14),
    ('a0000000-0000-0000-0000-000000000004'::uuid, DATE '2026-04-17', 7, 14),
    ('a0000000-0000-0000-0000-000000000004'::uuid, DATE '2026-04-18', 7, 14),
    ('a0000000-0000-0000-0000-000000000005'::uuid, DATE '2026-04-13', 9, 12),
    ('a0000000-0000-0000-0000-000000000005'::uuid, DATE '2026-04-14', 9, 12),
    ('a0000000-0000-0000-0000-000000000005'::uuid, DATE '2026-04-15', 9, 12),
    ('a0000000-0000-0000-0000-000000000005'::uuid, DATE '2026-04-16', 9, 12),
    ('a0000000-0000-0000-0000-000000000006'::uuid, DATE '2026-04-13', 12, 19),
    ('a0000000-0000-0000-0000-000000000006'::uuid, DATE '2026-04-14', 12, 19),
    ('a0000000-0000-0000-0000-000000000006'::uuid, DATE '2026-04-15', 12, 19),
    ('a0000000-0000-0000-0000-000000000006'::uuid, DATE '2026-04-16', 12, 19),
    ('a0000000-0000-0000-0000-000000000006'::uuid, DATE '2026-04-17', 12, 19),
    ('a0000000-0000-0000-0000-000000000007'::uuid, DATE '2026-04-13', 9, 16),
    ('a0000000-0000-0000-0000-000000000007'::uuid, DATE '2026-04-14', 9, 16),
    ('a0000000-0000-0000-0000-000000000007'::uuid, DATE '2026-04-15', 9, 16),
    ('a0000000-0000-0000-0000-000000000007'::uuid, DATE '2026-04-16', 9, 16),
    ('a0000000-0000-0000-0000-000000000007'::uuid, DATE '2026-04-17', 9, 16),
    ('a0000000-0000-0000-0000-000000000007'::uuid, DATE '2026-04-18', 9, 16),
    ('a0000000-0000-0000-0000-000000000007'::uuid, DATE '2026-04-19', 9, 16),
    ('a0000000-0000-0000-0000-000000000008'::uuid, DATE '2026-04-15', 8, 15),
    ('a0000000-0000-0000-0000-000000000008'::uuid, DATE '2026-04-16', 8, 15),
    ('a0000000-0000-0000-0000-000000000008'::uuid, DATE '2026-04-17', 8, 15),
    ('a0000000-0000-0000-0000-000000000008'::uuid, DATE '2026-04-18', 8, 15),
    ('a0000000-0000-0000-0000-000000000008'::uuid, DATE '2026-04-19', 8, 15)
)
INSERT INTO "Caretaker_Availability" ("CaretakerID", "StartDateTime", "EndDateTime", "isActive")
SELECT
  s.caretaker,
  (s.day_date + (h * INTERVAL '1 hour'))::timestamptz,
  (s.day_date + ((h + 1) * INTERVAL '1 hour'))::timestamptz,
  TRUE
FROM schedule s
CROSS JOIN LATERAL generate_series(s.hour_start, s.hour_end) AS h;

-- ── Providers & Points of Contact (hosts) ─────────────────────────────────
INSERT INTO "PROVIDER" ("ProviderID", "ProviderName", "Address", "ContactInfo") VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Lumphini Wellness Co.',  'Lumphini Park, Bangkok', 'contact@lumphini-wellness.example'),
  ('b0000000-0000-0000-0000-000000000002', 'Community Heritage Ltd.', 'Silom, Bangkok',         'contact@heritage.example')
ON CONFLICT ("ProviderID") DO NOTHING;

INSERT INTO "Point_of_Contact" ("POCID", "ProviderID", "FirstName", "LastName", "PhoneNumber", "Avatar", "Description") VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'Tom', 'Brady', '0812345001',
   'https://i.pravatar.cc/150?u=tom',
   'Former American football quarterback widely regarded as the greatest NFL player of all time.'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002',
   'Grandma', 'Mali', '0812345002',
   'https://i.pravatar.cc/150?u=mali',
   'Local chef passionate about traditional Thai cooking.')
ON CONFLICT ("POCID") DO NOTHING;

-- ── Activities ──────────────────────────────────────────────────────────────
INSERT INTO "ACTIVITY" ("ActivityID", "Title", "Category", "Tags", "POCID", "StartDate", "EndDate", "Location", "Price", "ParticipantCount", "Duration", "MaxPeople", "Rating", "Reviews", "Images", "Overview", "WhatToBring", "CreatedDate")
VALUES
  -- act-001: Chill Group Walk (host: Tom Brady)
  (gen_random_uuid(),
   'Chill Group Walk', 'Exercise',
   '["Exercise","Wellness"]',
   'c0000000-0000-0000-0000-000000000001',
   '2025-10-12T07:00:00.000Z', '2025-10-12T09:00:00.000Z',
   'Lumphini Park, BKK', 150, 9, '120 Mins', 10, 4.9, 5,
   '["https://images.unsplash.com/photo-1552508744-1696d4464960?auto=format&fit=crop&w=800&q=80","https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80","https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80","https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80","https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80"]',
   'Join a friendly, low-impact group walk through the shady paths of Lumphini Park. Pace is gentle and suited for seniors who enjoy movement and fresh air in good company.',
   '["Comfortable walking shoes","Water bottle","Sunscreen and hat","Light, breathable clothing"]',
   to_timestamp(1776012445699 / 1000.0)),

  -- act-002: Group Dinner (host: Grandma Mali)
  (gen_random_uuid(),
   'Group Dinner', 'Food',
   '["Food","Social"]',
   'c0000000-0000-0000-0000-000000000002',
   '2025-10-12T10:00:00.000Z', '2025-10-12T12:00:00.000Z',
   'Lumphini Park, BKK', 450, 4, '120 Mins', 8, 4.8, 12,
   '["https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=800&q=80","https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80","https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80","https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80","https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80"]',
   'Share a warm, home-style Thai dinner with Grandma Mali. Seniors enjoy classic comfort dishes and light conversation in a relaxed, welcoming setting.',
   '["Any dietary notes to share with the host","A light sweater for the A/C","A smile"]',
   to_timestamp(1776012445699 / 1000.0)),

  -- act-003: Yoga Group (host: Grandma Mali)
  (gen_random_uuid(),
   'Yoga Group', 'Wellness',
   '["Wellness","Exercise"]',
   'c0000000-0000-0000-0000-000000000002',
   '2025-10-12T10:00:00.000Z', '2025-10-12T11:00:00.000Z',
   'Lumphini Park, BKK', 300, 14, '60 Mins', 15, 5.0, 8,
   '["https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80","https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80","https://images.unsplash.com/photo-1552508744-1696d4464960?auto=format&fit=crop&w=800&q=80","https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80","https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80"]',
   'A beginner-friendly yoga session focused on gentle stretching, balance, and breathing. Suitable for seniors with a range of mobility levels.',
   '["Yoga mat (spare mats available)","Water bottle","Comfortable, stretchable clothing","Small towel"]',
   to_timestamp(1776012445699 / 1000.0)),

  -- act-004: Meditation For Wellness (host: Tom Brady)
  (gen_random_uuid(),
   'Meditation For Wellness', 'Religion',
   '["Religion","Wellness"]',
   'c0000000-0000-0000-0000-000000000001',
   '2025-10-12T08:00:00.000Z', '2025-10-12T09:30:00.000Z',
   'Lumphini Park, BKK', 250, 20, '90 Mins', 20, 4.7, 3,
   '["https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80","https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?auto=format&fit=crop&w=800&q=80","https://images.unsplash.com/photo-1515041219749-89347f83291a?auto=format&fit=crop&w=800&q=80","https://images.unsplash.com/photo-1528315651484-4dda50c765ef?auto=format&fit=crop&w=800&q=80","https://images.unsplash.com/photo-1554244933-d876deb6b2fa?auto=format&fit=crop&w=800&q=80"]',
   'A guided meditation session aimed at calming the mind and easing tension. Includes breathing exercises and gentle reflection.',
   '["Comfortable, loose clothing","A light shawl or blanket","An open mind"]',
   to_timestamp(1776012445699 / 1000.0));
