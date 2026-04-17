-- ============================================================
-- Oonjai Core Service — Postgres Migration
-- Drops existing tables and recreates with UUID/TEXT PKs
-- matching the application domain model.
-- ============================================================

-- pg_trgm powers the GIN trigram indexes on ACTIVITY.Title / Location
-- that back the case-insensitive "search" filter via ILIKE '%q%'.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Drop in reverse dependency order
DROP TABLE IF EXISTS "ACTIVITY_PRECAUTION_CACHE" CASCADE;
DROP TABLE IF EXISTS "VERIFICATION_DOCUMENT" CASCADE;
DROP TABLE IF EXISTS "VERIFICATION" CASCADE;
DROP TABLE IF EXISTS "STATUS_LOG" CASCADE;
DROP TABLE IF EXISTS "INCIDENT" CASCADE;
DROP TABLE IF EXISTS "PAYMENT" CASCADE;
DROP TABLE IF EXISTS "ACTIVITY_REVIEW" CASCADE;
DROP TABLE IF EXISTS "CARETAKER_REVIEW" CASCADE;
DROP TABLE IF EXISTS "REVIEW" CASCADE;
DROP TABLE IF EXISTS "BOOKING" CASCADE;
DROP TABLE IF EXISTS "Caretaker_Availability" CASCADE;
DROP TABLE IF EXISTS "CARETAKER" CASCADE;
DROP TABLE IF EXISTS "SENIOR_PROFILE" CASCADE;
DROP TABLE IF EXISTS "ADULT_CHILD" CASCADE;
DROP TABLE IF EXISTS "ADMIN" CASCADE;
DROP TABLE IF EXISTS "Point_of_Contact" CASCADE;
DROP TABLE IF EXISTS "PROVIDER" CASCADE;
DROP TABLE IF EXISTS "ACTIVITY" CASCADE;
DROP TABLE IF EXISTS "USER" CASCADE;

-- Drop old sequences
DROP SEQUENCE IF EXISTS "USER_UserID_seq" CASCADE;
DROP SEQUENCE IF EXISTS "BOOKING_BookingID_seq" CASCADE;
DROP SEQUENCE IF EXISTS "ACTIVITY_ActivityID_seq" CASCADE;
DROP SEQUENCE IF EXISTS "REVIEW_ReviewID_seq" CASCADE;
DROP SEQUENCE IF EXISTS "PAYMENT_PaymentID_seq" CASCADE;
DROP SEQUENCE IF EXISTS "INCIDENT_IncidentID_seq" CASCADE;
DROP SEQUENCE IF EXISTS "STATUS_LOG_StatusLogID_seq" CASCADE;
DROP SEQUENCE IF EXISTS "VERIFICATION_VerificationID_seq" CASCADE;
DROP SEQUENCE IF EXISTS "VERIFICATION_DOCUMENT_DocID_seq" CASCADE;
DROP SEQUENCE IF EXISTS "PROVIDER_ProviderID_seq" CASCADE;
DROP SEQUENCE IF EXISTS "Point_of_Contact_POCID_seq" CASCADE;
DROP SEQUENCE IF EXISTS "SENIOR_PROFILE_SeniorID_seq" CASCADE;
DROP SEQUENCE IF EXISTS "Caretaker_Availability_Availability_ID_seq" CASCADE;

-- ============================================================
-- 1. USER
-- ============================================================
CREATE TABLE "USER" (
  "UserID"      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "FirstName"   VARCHAR(100),
  "LastName"    VARCHAR(100),
  "Email"       VARCHAR(255) UNIQUE,
  "Phone"       VARCHAR(50),
  "Role"        VARCHAR(20) NOT NULL DEFAULT 'adult_child',
  "CreatedDate" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_email ON "USER" ("Email");
CREATE INDEX idx_user_role  ON "USER" ("Role");

-- ============================================================
-- 2. ADULT_CHILD  (1:1 with USER where Role = 'adult_child')
-- ============================================================
CREATE TABLE "ADULT_CHILD" (
  "UserID"       UUID PRIMARY KEY REFERENCES "USER"("UserID") ON DELETE CASCADE,
  "Phone"        VARCHAR(50),
  "Relationship" VARCHAR(100),
  "Goal"         TEXT,
  "Concerns"     JSONB DEFAULT '[]'
);

-- ============================================================
-- 3. ADMIN  (1:1 with USER where Role = 'admin')
-- ============================================================
CREATE TABLE "ADMIN" (
  "UserID" UUID PRIMARY KEY REFERENCES "USER"("UserID") ON DELETE CASCADE
);

-- ============================================================
-- 4. CARETAKER  (1:1 with USER where Role = 'caretaker')
-- ============================================================
CREATE TABLE "CARETAKER" (
  "UserID"         UUID PRIMARY KEY REFERENCES "USER"("UserID") ON DELETE CASCADE,
  "Bio"            TEXT,
  "Specialization" VARCHAR(255),
  "HourlyRate"     NUMERIC(10,2) DEFAULT 0,
  "Currency"       VARCHAR(10) DEFAULT 'THB',
  "Experience"     INTEGER DEFAULT 0,
  "Rating"         NUMERIC(3,2) DEFAULT 0,
  "ReviewCount"    INTEGER DEFAULT 0,
  "IsVerified"     BOOLEAN DEFAULT FALSE,
  "IsAvailable"    BOOLEAN DEFAULT TRUE,
  "ContactInfo"    TEXT,
  "Permission"     VARCHAR(50)
);

CREATE INDEX idx_caretaker_available   ON "CARETAKER" ("IsAvailable") WHERE "IsAvailable" = TRUE;
CREATE INDEX idx_caretaker_rating      ON "CARETAKER" ("Rating" DESC);
CREATE INDEX idx_caretaker_hourly_rate ON "CARETAKER" ("HourlyRate");

-- ============================================================
-- 4b. Caretaker_Availability
-- Caretakers declare N concrete availability windows (ER: CARETAKER 1--N declares).
-- Expected to be refreshed weekly by the caretaker; rows can be flushed
-- on a weekly cadence without further state to reconcile.
-- ============================================================
CREATE TABLE "Caretaker_Availability" (
  "Availability_ID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "CaretakerID"     UUID NOT NULL REFERENCES "CARETAKER"("UserID") ON DELETE CASCADE,
  "StartDateTime"   TIMESTAMPTZ NOT NULL,
  "EndDateTime"     TIMESTAMPTZ NOT NULL,
  "isActive"        BOOLEAN NOT NULL DEFAULT TRUE,
  "CreatedDate"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ("EndDateTime" > "StartDateTime")
);

CREATE INDEX idx_caretaker_availability_caretaker ON "Caretaker_Availability" ("CaretakerID");
CREATE INDEX idx_caretaker_availability_range     ON "Caretaker_Availability" ("CaretakerID", "StartDateTime", "EndDateTime") WHERE "isActive" = TRUE;

-- ============================================================
-- 5. SENIOR_PROFILE
-- ============================================================
CREATE TABLE "SENIOR_PROFILE" (
  "SeniorID"     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "AdultChildID" UUID NOT NULL REFERENCES "ADULT_CHILD"("UserID") ON DELETE CASCADE,
  "FullName"     VARCHAR(200),
  "DateOfBirth"  DATE,
  "MobilityLevel" VARCHAR(50),
  "HealthNotes"  TEXT,
  "CreatedDate"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_senior_adult_child ON "SENIOR_PROFILE" ("AdultChildID");

-- ============================================================
-- 6. ACTIVITY
-- ============================================================
CREATE TABLE "ACTIVITY" (
  "ActivityID"       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "Title"            VARCHAR(255),
  "Category"         VARCHAR(100),
  "Tags"             JSONB DEFAULT '[]',
  "Host"             VARCHAR(200),
  "HostAvatar"       TEXT,
  "HostDescription"  TEXT,
  "StartDate"        TIMESTAMPTZ,
  "EndDate"          TIMESTAMPTZ,
  "Location"         VARCHAR(500),
  "Price"            NUMERIC(10,2) DEFAULT 0,
  "ParticipantCount" INTEGER DEFAULT 0,
  "Duration"         VARCHAR(50),
  "MaxPeople"        INTEGER DEFAULT 0,
  "Rating"           NUMERIC(3,2) DEFAULT 0,
  "Reviews"          INTEGER DEFAULT 0,
  "Images"           JSONB DEFAULT '[]',
  "CreatedDate"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_category   ON "ACTIVITY" ("Category");
CREATE INDEX idx_activity_start_date ON "ACTIVITY" ("StartDate");
CREATE INDEX idx_activity_price      ON "ACTIVITY" ("Price");
CREATE INDEX idx_activity_location_trgm ON "ACTIVITY" USING GIN ("Location" gin_trgm_ops);
CREATE INDEX idx_activity_title_trgm    ON "ACTIVITY" USING GIN ("Title" gin_trgm_ops);

-- ============================================================
-- 7. BOOKING   (PK is TEXT for "BK-XXXXXXXX" format)
-- ============================================================
CREATE TABLE "BOOKING" (
  "BookingID"     TEXT PRIMARY KEY,
  "AdultChildID"  UUID REFERENCES "ADULT_CHILD"("UserID"),
  "CaretakerID"   UUID REFERENCES "CARETAKER"("UserID"),
  "SeniorID"      UUID REFERENCES "SENIOR_PROFILE"("SeniorID"),
  "ActivityID"    UUID REFERENCES "ACTIVITY"("ActivityID"),
  "ServiceType"   VARCHAR(50),
  "Status"        VARCHAR(20) NOT NULL DEFAULT 'created',
  "StartDateTime" TIMESTAMPTZ,
  "EndDateTime"   TIMESTAMPTZ,
  "Location"      TEXT,
  "Notes"         TEXT,
  "EstimatedCost" NUMERIC(12,2) DEFAULT 0,
  "Currency"      VARCHAR(10) DEFAULT 'THB',
  "CreatedDate"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_booking_adult_child ON "BOOKING" ("AdultChildID");
CREATE INDEX idx_booking_caretaker   ON "BOOKING" ("CaretakerID");
CREATE INDEX idx_booking_senior      ON "BOOKING" ("SeniorID");
CREATE INDEX idx_booking_activity    ON "BOOKING" ("ActivityID");
CREATE INDEX idx_booking_status      ON "BOOKING" ("Status");
CREATE INDEX idx_booking_time_range  ON "BOOKING" ("StartDateTime", "EndDateTime");

-- ============================================================
-- 8. REVIEW
-- ============================================================
CREATE TABLE "REVIEW" (
  "ReviewID"    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "BookingID"   TEXT UNIQUE REFERENCES "BOOKING"("BookingID") ON DELETE CASCADE,
  "Rating"      INTEGER CHECK ("Rating" >= 1 AND "Rating" <= 5),
  "Comment"     TEXT,
  "ReviewType"  VARCHAR(50),
  "CreatedDate" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 9. PAYMENT
-- ============================================================
CREATE TABLE "PAYMENT" (
  "PaymentID"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "BookingID"         TEXT REFERENCES "BOOKING"("BookingID"),
  "CheckoutSessionId" TEXT,
  "Amount"            NUMERIC(12,2),
  "Currency"          VARCHAR(10) DEFAULT 'THB',
  "Method"            VARCHAR(30),
  "PaymentStatus"     VARCHAR(20) DEFAULT 'pending',
  "TransRef"          VARCHAR(255),
  "QrCodeUrl"         TEXT,
  "RedirectUrl"       TEXT,
  "PaidAt"            TIMESTAMPTZ,
  "CreatedDate"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_booking     ON "PAYMENT" ("BookingID");
CREATE INDEX idx_payment_trans_ref   ON "PAYMENT" ("TransRef");
CREATE INDEX idx_payment_checkout    ON "PAYMENT" ("CheckoutSessionId");

-- ============================================================
-- 10. INCIDENT
-- ============================================================
CREATE TABLE "INCIDENT" (
  "IncidentID"     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "BookingID"      TEXT REFERENCES "BOOKING"("BookingID"),
  "SeniorID"       UUID REFERENCES "SENIOR_PROFILE"("SeniorID"),
  "IncidentType"   VARCHAR(50),
  "IncidentStatus" VARCHAR(20) DEFAULT 'noted',
  "Details"        TEXT,
  "CreatedDate"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_incident_booking ON "INCIDENT" ("BookingID");
CREATE INDEX idx_incident_senior  ON "INCIDENT" ("SeniorID");

-- ============================================================
-- 11. STATUS_LOG
-- ============================================================
CREATE TABLE "STATUS_LOG" (
  "StatusLogID"      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "BookingID"        TEXT REFERENCES "BOOKING"("BookingID"),
  "StatusType"       VARCHAR(50),
  "Notes"            TEXT,
  "PhotoUrl"         TEXT,
  "StatusTimestamp"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_status_log_booking ON "STATUS_LOG" ("BookingID");

-- ============================================================
-- 12. VERIFICATION
-- ============================================================
CREATE TABLE "VERIFICATION" (
  "VerificationID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "UploaderID"     UUID,
  "ProviderID"     UUID,
  "UploaderType"   VARCHAR(20),
  "DocType"        VARCHAR(100),
  "DocFileRef"     TEXT,
  "Status"         VARCHAR(20) DEFAULT 'pending',
  "ApprovedBy"     UUID REFERENCES "ADMIN"("UserID"),
  "ApprovalDate"   TIMESTAMPTZ,
  "CreatedDate"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_verification_status ON "VERIFICATION" ("Status");

-- ============================================================
-- PROVIDER / Point_of_Contact (kept for compatibility)
-- ============================================================
CREATE TABLE "PROVIDER" (
  "ProviderID"   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ProviderName" VARCHAR(255),
  "Address"      TEXT,
  "ContactInfo"  TEXT
);

CREATE TABLE "Point_of_Contact" (
  "POCID"       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ProviderID"  UUID REFERENCES "PROVIDER"("ProviderID"),
  "FirstName"   VARCHAR(100),
  "LastName"    VARCHAR(100),
  "PhoneNumber" VARCHAR(50)
);

-- ============================================================
-- 13. ACTIVITY_PRECAUTION_CACHE (AI-generated precaution cache)
-- ============================================================
CREATE TABLE "ACTIVITY_PRECAUTION_CACHE" (
  "ActivityID"  UUID NOT NULL,
  "UserID"      UUID NOT NULL,
  "Signature"   TEXT NOT NULL,
  "Result"      JSONB NOT NULL,
  "CreatedDate" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("ActivityID", "UserID")
);

CREATE INDEX idx_activity_precaution_cache_user ON "ACTIVITY_PRECAUTION_CACHE" ("UserID");
