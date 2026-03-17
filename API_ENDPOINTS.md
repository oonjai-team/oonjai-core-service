# Oonjai — API Endpoints Reference

> **Service:** `oonjai-core-service`
> **Runtime:** Bun · **Language:** TypeScript (strict) · **Architecture:** DDD
> **Base URL:** `http://localhost:PORT` (configure in `index.ts`)

This document defines every REST endpoint required to support all frontend tasks and user flows, derived from:
- FE-UI-TASK #14 — Request A Service main page & forms
- FE-UI-TASK #15 — Caretaker Selection
- FE-UI-TASK #16 — Checkout
- FE-UI-TASK #17 — Booking Confirmation Page
- The full user flow PDF (Onboarding, Activities, Caretaker Booking, and Caretaking session flows)
- The full system class diagram (`full-system-diagram.svg`)

---

## Table of Contents

1. [Global Conventions](#1-global-conventions)
2. [Auth Endpoints](#2-auth-endpoints) ✅ Implemented
3. [User Endpoints](#3-user-endpoints) — partially implemented
4. [Senior Endpoints](#4-senior-endpoints) — partially implemented
5. [Caretaker / Provider Endpoints](#5-caretaker--provider-endpoints) 🔴 Needs implementation
6. [Booking Endpoints](#6-booking-endpoints) 🔴 Needs implementation
7. [Payment Endpoints](#7-payment-endpoints) 🔴 Needs implementation
8. [Status Log Endpoints](#8-status-log-endpoints) 🔴 Needs implementation
9. [Incident Log Endpoints](#9-incident-log-endpoints) 🔴 Needs implementation
10. [Verification Endpoints](#10-verification-endpoints) 🔴 Needs implementation
11. [Real-time / Notifications](#11-real-time--notifications) 🔴 Needs implementation
12. [Enumerations & Shared Types](#12-enumerations--shared-types)
13. [New Entities & Services to Create](#13-new-entities--services-to-create)

---

## 1. Global Conventions

### Authentication

All protected endpoints require a valid JWT access token in the `Authorization` header:

```
Authorization: Bearer <accessToken>
```

The `Router` resolves the session and injects it into `handler(ctx, services, session)`. If the session is missing or expired, the endpoint returns `401 Unauthorized`.

### Standard Error Shape

```json
{ "error": "Human-readable message" }
```

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200 OK` | Successful GET / PUT / PATCH |
| `201 Created` | Resource successfully created |
| `204 No Content` | Successful DELETE or logout |
| `400 Bad Request` | Validation failure — missing or invalid fields |
| `401 Unauthorized` | Missing or invalid session token |
| `403 Forbidden` | Authenticated but not permitted (e.g. wrong role) |
| `404 Not Found` | Resource does not exist |
| `500 Internal Server Error` | Unhandled exception |

### Role-based Access

| Role | Description |
|------|-------------|
| `adult_child` | The primary user who books services for their senior |
| `caretaker` | Service provider who carries out sessions |
| `admin` | Platform administrator |

---

## 2. Auth Endpoints

> ✅ **Already implemented** in `src/endpoint/auth/`

---

### `POST /auth/register`

Creates a new user account. Called on first-time OAuth sign-in.

**Auth required:** No

**Request body:**

```json
{
  "email": "user@example.com",
  "firstname": "Jane",
  "lastname": "Doe",
  "role": "adult_child",
  "oauthToken": "optional-oauth-provider-token"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `email` | `string` | ✅ | Must be unique |
| `firstname` | `string` | ✅ | |
| `lastname` | `string` | ✅ | |
| `role` | `RoleEnum` | ✅ | `adult_child`, `admin`, `caretaker` |
| `oauthToken` | `string` | ❌ | Reserved for OAuth provider validation |

**Response `201`:**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstname": "Jane",
  "lastname": "Doe",
  "role": "adult_child",
  "createdAt": 1700000000000
}
```

---

### `POST /auth/login`

Authenticates an existing user and issues a JWT access + refresh token pair.

**Auth required:** No

**Request body:**

```json
{
  "email": "user@example.com",
  "oauthToken": "optional-oauth-token"
}
```

**Response `200`:**

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "expiresIn": 3600
}
```

---

### `POST /auth/refresh`

Issues a new access token using a valid refresh token.

**Auth required:** No

**Request body:**

```json
{ "refreshToken": "eyJ..." }
```

**Response `200`:**

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "expiresIn": 3600
}
```

---

### `POST /auth/logout`

Revokes the current session token.

**Auth required:** Yes

**Response `204`:** _(empty body)_

---

### `GET /auth/session`

Returns the currently authenticated user's session payload.

**Auth required:** Yes

**Response `200`:**

```json
{
  "userId": "uuid",
  "type": "access",
  "iat": 1700000000,
  "exp": 1700003600
}
```

---

## 3. User Endpoints

> `PUT /users/update` is ✅ implemented. The endpoints below are required additions.

---

### `GET /users/me`

Returns the full profile of the currently authenticated user.

**Auth required:** Yes
**File to create:** `src/endpoint/users/getMe.ts`
**Service method needed:** `UserService.getUserById(id)`

**Response `200`:**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstname": "Jane",
  "lastname": "Doe",
  "role": "adult_child",
  "createdAt": 1700000000000
}
```

---

### `PUT /users/update`

> ✅ Already implemented. Updates `firstname`, `lastname`, and/or `email` for the current user.

**Auth required:** Yes

**Request body (all fields optional):**

```json
{
  "firstname": "Jane",
  "lastname": "Smith",
  "email": "newemail@example.com"
}
```

**Response `200`:** _(empty body)_

---

## 4. Senior Endpoints

> `POST /users/seniors` and `GET /users/seniors` are ✅ implemented.

---

### `POST /users/seniors`

> ✅ Already implemented. Adds a senior profile to the currently authenticated adult child.

**Auth required:** Yes (`adult_child` role)

**Request body:**

```json
{
  "fullname": "Robert Doe",
  "dateOfBirth": "1945-06-15",
  "mobilityLevel": "wheelchair",
  "healthNote": "Diabetic, requires insulin at 12pm"
}
```

**Response `201`:**

```json
{
  "id": "uuid",
  "adultChildId": "uuid",
  "fullname": "Robert Doe",
  "dateOfBirth": "1945-06-15",
  "mobilityLevel": "wheelchair",
  "healthNote": "Diabetic, requires insulin at 12pm",
  "createdAt": 1700000000000
}
```

---

### `GET /users/seniors`

> ✅ Already implemented. Returns all seniors linked to the current adult child.

**Auth required:** Yes (`adult_child` role)

**Response `200`:**

```json
[
  {
    "id": "uuid",
    "adultChildId": "uuid",
    "fullname": "Robert Doe",
    "dateOfBirth": "1945-06-15",
    "mobilityLevel": "wheelchair",
    "healthNote": "...",
    "createdAt": 1700000000000
  }
]
```

---

### `GET /users/seniors/:seniorId`

Returns a single senior profile. Needed to pre-populate the "Patient Information" field in the request form (UI #14).

**Auth required:** Yes
**File to create:** `src/endpoint/seniors/getSeniorById.ts`
**Service method needed:** `SeniorManagementService.getSeniorById(adultChildId, seniorId)`

**Path params:** `seniorId: UUID`

**Response `200`:** Single `SeniorDTO` object (same shape as above)

**Errors:**

| Status | Condition |
|--------|-----------|
| `404` | Senior not found or does not belong to current user |

---

### `DELETE /users/seniors/:seniorId`

Removes a senior profile from the current adult child's account.

**Auth required:** Yes (`adult_child` role)
**File to create:** `src/endpoint/seniors/removeSenior.ts`
**Service method:** `SeniorManagementService.removeSeniorFromAdultChild(adultChildId, seniorId)` ✅ already on service

**Path params:** `seniorId: UUID`

**Response `204`:** _(empty body)_

**Errors:**

| Status | Condition |
|--------|-----------|
| `404` | Senior not found |
| `403` | Senior does not belong to current user |

---

## 5. Caretaker / Provider Endpoints

> 🔴 Needs implementation. Required by FE-UI-TASK #15 (Caretaker Selection page).

The caretaker selection screen shows a grid of caretaker cards with name, photo, rating, experience, specialization, hourly rate, and an availability badge. Users can filter by specialties, experience, rating, and price range, and sort by recommendation.

---

### `GET /caretakers`

Returns a list of caretakers filtered by availability and service requirements. This is the primary call for the "Select Your Preferred Caretaker" page (UI #15).

**Auth required:** Yes
**File to create:** `src/endpoint/caretakers/getAvailableCaretakers.ts`
**Service to create:** `CaretakerService`

**Query parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceType` | `ServiceType` | ✅ | `medical_escort`, `home_care`, `outings` |
| `startDate` | `ISO 8601 string` | ✅ | e.g. `2024-10-24T09:00:00` |
| `endDate` | `ISO 8601 string` | ✅ | e.g. `2024-10-24T15:00:00` |
| `location` | `string` | ❌ | Address string or `lat,lng` for proximity sorting |
| `specialization` | `string` | ❌ | Filter by specialization tag (e.g. `Geriatric Care`) |
| `minRating` | `number` | ❌ | Minimum average rating (0–5) |
| `minExperience` | `number` | ❌ | Minimum years of experience |
| `maxHourlyRate` | `number` | ❌ | Maximum hourly rate in local currency |
| `sortBy` | `string` | ❌ | `recommended` (default), `rating`, `experience`, `price_asc`, `price_desc` |

**Response `200`:**

```json
[
  {
    "id": "uuid",
    "fullname": "Sarah Jenkins",
    "profilePhoto": "https://cdn.oonjai.com/caretakers/uuid.jpg",
    "role": "RN",
    "rating": 4.9,
    "reviewCount": 48,
    "experience": 8,
    "specialization": "Geriatric Care, Rehab",
    "hourlyRate": 300,
    "currency": "THB",
    "isVerified": true,
    "isAvailable": true,
    "bio": "Short bio string"
  }
]
```

**Errors:**

| Status | Condition |
|--------|-----------|
| `400` | `serviceType`, `startDate`, or `endDate` missing |

---

### `GET /caretakers/:caretakerId`

Returns the full profile of a single caretaker. Used in the checkout summary panel (UI #16) to display selected caretaker details.

**Auth required:** Yes
**File to create:** `src/endpoint/caretakers/getCaretakerById.ts`

**Path params:** `caretakerId: UUID`

**Response `200`:**

```json
{
  "id": "uuid",
  "fullname": "Sarah Jenkins, RN",
  "profilePhoto": "https://cdn.oonjai.com/caretakers/uuid.jpg",
  "role": "RN",
  "rating": 4.9,
  "reviewCount": 48,
  "experience": 8,
  "specialization": "Geriatric Care, Rehab",
  "hourlyRate": 300,
  "currency": "THB",
  "isVerified": true,
  "bio": "Full bio text...",
  "contactInfo": "Provided after booking confirmation only",
  "permission": "caretaker"
}
```

**Errors:**

| Status | Condition |
|--------|-----------|
| `404` | Caretaker not found |

---

### `PUT /caretakers/profile`

Allows a caretaker to update their own profile (rate, bio, specialization, etc.).

**Auth required:** Yes (`caretaker` role)
**File to create:** `src/endpoint/caretakers/updateCaretakerProfile.ts`

**Request body (all optional):**

```json
{
  "bio": "Updated bio",
  "specialization": "Geriatric Care, Post-Surgical",
  "hourlyRate": 350,
  "experience": 9,
  "contactInfo": "+66812345678"
}
```

**Response `200`:** Updated caretaker profile (same shape as GET /caretakers/:id)

---

## 6. Booking Endpoints

> 🔴 Needs implementation. This is the **core feature** for FE-UI-TASK #14, #15, #16, #17 and the Caretaker Booking Flow in the user flow PDF.

The booking flow goes: fill request form → choose caretaker → review & checkout → confirmation. The booking entity maps directly to the `Booking` class in the system diagram with status: `Created → Confirmed → Completed | Cancelled`.

---

### `GET /bookings`

Returns all bookings for the current user. For `adult_child`: returns bookings they created. For `caretaker`: returns bookings assigned to them. This drives the "Service Requests" list on the main page (UI #14).

**Auth required:** Yes
**File to create:** `src/endpoint/bookings/getBookings.ts`
**Service method:** `BookingService.getListOfBookings(ownerId)`

**Query parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | `BookingStatus` | ❌ | Filter by status: `created`, `confirmed`, `completed`, `cancelled` |
| `upcoming` | `boolean` | ❌ | If `true`, return only future bookings sorted by start date ascending |

**Response `200`:**

```json
[
  {
    "id": "uuid",
    "serviceType": "home_care",
    "status": "confirmed",
    "startDate": "2024-10-24T09:00:00",
    "endDate": "2024-10-24T15:00:00",
    "location": "123 Health Ave, San Francisco",
    "caretaker": {
      "id": "uuid",
      "fullname": "Sarah Jenkins",
      "profilePhoto": "https://cdn.oonjai.com/...",
      "rating": 4.9
    },
    "senior": {
      "id": "uuid",
      "fullname": "Robert Doe"
    },
    "estimatedCost": 350.00,
    "currency": "USD",
    "createdAt": 1700000000000
  }
]
```

---

### `POST /bookings`

Creates a new booking request. Called when the user clicks "Check Out" on the checkout page (UI #16). This is the primary write endpoint for the entire "Request a Service" feature.

**Auth required:** Yes (`adult_child` role)
**File to create:** `src/endpoint/bookings/createBooking.ts`
**Service method:** `BookingService.createBooking(...)`

**Request body:**

```json
{
  "seniorId": "uuid",
  "caretakerId": "uuid",
  "serviceType": "home_care",
  "startDate": "2024-10-24T09:00:00",
  "endDate": "2024-10-24T15:00:00",
  "location": "123 Health Ave, San Francisco",
  "note": "Patient requires medication reminder at 12 PM. Prefers quiet environment.",
  "paymentMethod": "qr_promptpay"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `seniorId` | `UUID` | ✅ | Must belong to current user |
| `caretakerId` | `UUID` | ✅ | Must be available for the requested time window |
| `serviceType` | `ServiceType` | ✅ | `medical_escort`, `home_care`, `outings` |
| `startDate` | `ISO 8601 string` | ✅ | Booking start datetime |
| `endDate` | `ISO 8601 string` | ✅ | Booking end datetime |
| `location` | `string` | ✅ | Address string |
| `note` | `string` | ❌ | Special instructions for the caretaker |
| `paymentMethod` | `string` | ✅ | `qr_promptpay`, `credit_card` |

**Response `201`:**

```json
{
  "id": "BK-8829",
  "status": "created",
  "serviceType": "home_care",
  "startDate": "2024-10-24T09:00:00",
  "endDate": "2024-10-24T15:00:00",
  "location": "123 Health Ave, San Francisco",
  "note": "Patient requires medication reminder at 12 PM.",
  "estimatedCost": 350.00,
  "currency": "USD",
  "caretaker": {
    "id": "uuid",
    "fullname": "Sarah Jenkins",
    "profilePhoto": "https://cdn.oonjai.com/..."
  },
  "senior": {
    "id": "uuid",
    "fullname": "Robert Doe"
  },
  "payment": {
    "id": "uuid",
    "status": "pending",
    "method": "qr_promptpay",
    "qrCodeUrl": "https://payment.gateway/qr/uuid.png"
  },
  "createdAt": 1700000000000
}
```

**Errors:**

| Status | Condition |
|--------|-----------|
| `400` | Any required field is missing or invalid |
| `404` | `seniorId` or `caretakerId` not found |
| `403` | Senior does not belong to current user, or caretaker is not available |
| `409` | Caretaker already booked for that time window |

---

### `GET /bookings/:bookingId`

Returns full detail for a single booking. Used by the Booking Confirmation page (UI #17) and by the caretaker's session detail screen.

**Auth required:** Yes
**File to create:** `src/endpoint/bookings/getBookingById.ts`
**Service method:** `BookingService.getBookingDetail(bookingId)`

**Path params:** `bookingId: string`

**Response `200`:**

```json
{
  "id": "BK-8829",
  "status": "confirmed",
  "serviceType": "Post-Surgical Home Care",
  "startDate": "2024-10-24T09:00:00",
  "endDate": "2024-10-24T15:00:00",
  "location": "123 Health Ave, San Francisco",
  "note": "Patient requires medication reminder at 12 PM.",
  "estimatedCost": 350.00,
  "currency": "USD",
  "caretaker": {
    "id": "uuid",
    "fullname": "Sarah Jenkins",
    "profilePhoto": "https://cdn.oonjai.com/...",
    "rating": 4.9,
    "specialization": "Post-Surgical Home Care",
    "hourlyRate": 300,
    "isVerified": true,
    "phoneNumber": "+66812345678"
  },
  "senior": {
    "id": "uuid",
    "fullname": "Robert Doe",
    "dateOfBirth": "1945-06-15",
    "mobilityLevel": "wheelchair",
    "healthNote": "...",
    "phoneNumber": "+66898765432"
  },
  "payment": {
    "id": "uuid",
    "status": "paid",
    "method": "qr_promptpay",
    "amount": 350.00,
    "currency": "USD",
    "paidAt": "2024-10-23T15:32:00"
  },
  "statusLogs": [
    {
      "id": "uuid",
      "statusType": "confirmed",
      "notes": "Caretaker accepted the booking",
      "createdAt": 1700000000000
    }
  ],
  "createdAt": 1700000000000
}
```

**Errors:**

| Status | Condition |
|--------|-----------|
| `404` | Booking not found |
| `403` | Booking does not belong to current user or assigned caretaker |

---

### `PUT /bookings/:bookingId`

Updates mutable fields of a booking (reschedule, update notes). Only allowed while `status === "created"`.

**Auth required:** Yes (`adult_child` role)
**File to create:** `src/endpoint/bookings/updateBooking.ts`
**Service method:** `BookingService.updateBooking(bookingId, startDate, endDate, note)`

**Path params:** `bookingId: string`

**Request body (all optional):**

```json
{
  "startDate": "2024-10-25T10:00:00",
  "endDate": "2024-10-25T16:00:00",
  "note": "Updated special instructions",
  "location": "456 New Address, San Francisco"
}
```

**Response `200`:** Updated booking object (same shape as GET)

**Errors:**

| Status | Condition |
|--------|-----------|
| `403` | Booking is already confirmed or completed — cannot be edited |
| `404` | Booking not found |

---

### `DELETE /bookings/:bookingId`

Cancels a booking. Sets status to `cancelled`. Triggers cancellation payment logic if needed.

**Auth required:** Yes (`adult_child` role)
**File to create:** `src/endpoint/bookings/cancelBooking.ts`
**Service method:** `BookingService.cancelBooking(bookingId)`

**Path params:** `bookingId: string`

**Response `204`:** _(empty body)_

**Errors:**

| Status | Condition |
|--------|-----------|
| `403` | Booking is already completed or does not belong to user |
| `404` | Booking not found |

---

### `POST /bookings/:bookingId/confirm`

Caretaker confirms acceptance of a booking request. Transitions status from `created` → `confirmed`. The adult child receives a push notification.

**Auth required:** Yes (`caretaker` role)
**File to create:** `src/endpoint/bookings/confirmBooking.ts`
**Service method:** `BookingService.confirmBooking(bookingId)`

**Path params:** `bookingId: string`

**Response `200`:** Updated booking with `status: "confirmed"`

**Errors:**

| Status | Condition |
|--------|-----------|
| `403` | Booking is not assigned to this caretaker |
| `409` | Booking is already confirmed or cancelled |

---

### `POST /bookings/:bookingId/review`

Submits a review after a booking is completed. Used by the adult child after the session ends.

**Auth required:** Yes (`adult_child` role)
**File to create:** `src/endpoint/bookings/submitReview.ts`
**Service method:** `BookingService.submitReview(bookingId, rating, comment, reviewType)`

**Path params:** `bookingId: string`

**Request body:**

```json
{
  "rating": 5,
  "comment": "Sarah was incredibly attentive and professional.",
  "reviewType": "caretaker"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `rating` | `number` | ✅ | Integer 1–5 |
| `comment` | `string` | ❌ | Free-text feedback |
| `reviewType` | `string` | ✅ | `caretaker` or `platform` |

**Response `200`:**

```json
{
  "bookingId": "BK-8829",
  "rating": 5,
  "comment": "Sarah was incredibly attentive and professional.",
  "reviewType": "caretaker",
  "createdAt": 1700000000000
}
```

**Errors:**

| Status | Condition |
|--------|-----------|
| `400` | Booking status is not `completed` |
| `409` | Review already submitted for this booking |

---

## 7. Payment Endpoints

> 🔴 Needs implementation. Supports QR PromptPay and Credit/Debit Card as seen in the Checkout UI (UI #16).

---

### `POST /bookings/:bookingId/payment`

Initiates payment for a booking. For QR PromptPay, returns a QR code URL. For credit/debit card, returns a redirect URL to the payment gateway.

**Auth required:** Yes (`adult_child` role)
**File to create:** `src/endpoint/payments/initiatePayment.ts`

**Path params:** `bookingId: string`

**Request body:**

```json
{
  "method": "qr_promptpay",
  "amount": 350.00,
  "currency": "THB"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `method` | `string` | ✅ | `qr_promptpay`, `credit_card` |
| `amount` | `number` | ✅ | Must match estimated cost |
| `currency` | `string` | ✅ | ISO 4217 currency code |

**Response `201`:**

```json
{
  "paymentId": "uuid",
  "status": "pending",
  "method": "qr_promptpay",
  "qrCodeUrl": "https://payment.gateway/qr/uuid.png",
  "redirectUrl": null,
  "expiresAt": "2024-10-24T09:15:00"
}
```

---

### `GET /bookings/:bookingId/payment`

Returns the current payment status for a booking. Frontend polls this to detect successful QR payment.

**Auth required:** Yes
**File to create:** `src/endpoint/payments/getPaymentStatus.ts`

**Path params:** `bookingId: string`

**Response `200`:**

```json
{
  "paymentId": "uuid",
  "status": "paid",
  "method": "qr_promptpay",
  "amount": 350.00,
  "currency": "THB",
  "transactionRef": "TXN-20241024-001",
  "paidAt": "2024-10-24T09:12:00"
}
```

**Payment `status` values:** `pending`, `paid`, `failed`, `refunded`

---

### `POST /payments/webhook`

Receives payment confirmation callbacks from the payment gateway (PromptPay, Omise, Stripe, etc.). Updates the corresponding `Payment` record to `paid` and triggers booking confirmation notification to caretaker.

**Auth required:** No (secured by webhook secret header, e.g. `X-Webhook-Secret`)
**File to create:** `src/endpoint/payments/paymentWebhook.ts`

**Request body:** _(Depends on payment gateway — document once provider is chosen)_

**Response `200`:** `{ "received": true }`

> **Note:** The user flow PDF describes this as "some payment api magic" — finalize the provider and update this endpoint with the exact payload signature.

---

## 8. Status Log Endpoints

> 🔴 Needs implementation. Drives the real-time caretaking status updates shown to adult children during all Caretaking Flows (Medical Escort, Outings, Home Care).

Status flows per service type:

| Service Type | Status Sequence |
|---|---|
| Medical Escort | `driving_to_pickup` → `at_pickup` → `driving_to_hospital` → `at_hospital` → `driving_home` → `completed` |
| Outings (pickup req.) | `driving_to_pickup` → `at_pickup` → `driving_to_outing` → `at_outing` → `driving_home` → `completed` |
| Outings (no pickup) | `driving_to_outing` → `in_session` → `completed` |
| Home Care | `driving_to_location` → `at_location` → `in_session` → `completed` |

---

### `GET /bookings/:bookingId/status`

Returns the full status log history for a booking. Used by the adult child's session tracking screen.

**Auth required:** Yes
**File to create:** `src/endpoint/statusLogs/getStatusLogs.ts`
**Service method:** `StatusLogService.getStatusLogsForBooking(bookingId)`

**Path params:** `bookingId: string`

**Response `200`:**

```json
[
  {
    "id": "uuid",
    "bookingId": "uuid",
    "statusType": "driving_to_pickup",
    "notes": "On the way, ETA 10 minutes",
    "photoUrl": null,
    "createdAt": 1700000000000
  },
  {
    "id": "uuid",
    "bookingId": "uuid",
    "statusType": "at_pickup",
    "notes": "Arrived at pickup location",
    "photoUrl": "https://cdn.oonjai.com/photos/session-uuid-001.jpg",
    "createdAt": 1700000000600
  }
]
```

---

### `POST /bookings/:bookingId/status`

Caretaker creates a new status update during an active session. Triggers a push notification to the adult child. Optionally includes a photo upload (as a CDN URL after upload).

**Auth required:** Yes (`caretaker` role)
**File to create:** `src/endpoint/statusLogs/createStatusLog.ts`
**Service method:** `StatusLogService.createStatusLog(bookingId, statusType, notes, photoUrl?)`

**Path params:** `bookingId: string`

**Request body:**

```json
{
  "statusType": "at_pickup",
  "notes": "Arrived safely. Robert is ready.",
  "photoUrl": "https://cdn.oonjai.com/photos/session-uuid-001.jpg"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `statusType` | `string` | ✅ | See status sequences above |
| `notes` | `string` | ❌ | Short note for the adult child |
| `photoUrl` | `string` | ❌ | Pre-uploaded photo CDN URL (upload separately to a `/media/upload` endpoint) |

**Response `201`:** Created `StatusLog` object

**Errors:**

| Status | Condition |
|--------|-----------|
| `403` | Booking is not assigned to this caretaker |
| `400` | Invalid `statusType` for the booking's service type |

---

### `POST /bookings/:bookingId/end`

Caretaker clicks "End Session". Transitions booking status to `completed`. Triggers final notification to adult child.

**Auth required:** Yes (`caretaker` role)
**File to create:** `src/endpoint/bookings/endSession.ts`

**Path params:** `bookingId: string`

**Response `200`:** Updated booking with `status: "completed"`

---

## 9. Incident Log Endpoints

> 🔴 Needs implementation. Used by caretakers to log unexpected events during a session (falls, medication issues, medical emergencies).

---

### `GET /bookings/:bookingId/incidents`

Returns all incident logs for a booking.

**Auth required:** Yes
**File to create:** `src/endpoint/incidentLogs/getIncidentLogs.ts`
**Service method:** `IncidentLogService.getIncidentLogsFromBooking(bookingId)`

**Path params:** `bookingId: string`

**Response `200`:**

```json
[
  {
    "id": "uuid",
    "bookingId": "uuid",
    "seniorId": "uuid",
    "incidentType": "medication_missed",
    "detail": "Senior refused medication at 12 PM. Notified adult child.",
    "status": "noted",
    "createdAt": 1700000000000
  }
]
```

---

### `POST /bookings/:bookingId/incidents`

Creates an incident log for a session.

**Auth required:** Yes (`caretaker` role)
**File to create:** `src/endpoint/incidentLogs/createIncidentLog.ts`
**Service method:** `IncidentLogService.createIncidentLog(bookingId, seniorId, incidentType, detail)`

**Path params:** `bookingId: string`

**Request body:**

```json
{
  "seniorId": "uuid",
  "incidentType": "fall",
  "detail": "Minor fall in bathroom. No injuries. Adult child notified."
}
```

**Response `201`:** Created `IncidentLog` object

---

### `PUT /bookings/:bookingId/incidents/:logId`

Updates an existing incident log (e.g. to add follow-up detail or change status).

**Auth required:** Yes (`caretaker` or `admin` role)
**File to create:** `src/endpoint/incidentLogs/updateIncidentLog.ts`
**Service method:** `IncidentLogService.updateIncidentLog(logId, status, detail)`

**Path params:** `bookingId: string`, `logId: UUID`

**Request body:**

```json
{
  "status": "resolved",
  "detail": "Updated: Senior confirmed well after rest. No further action needed."
}
```

**Response `200`:** Updated `IncidentLog` object

---

## 10. Verification Endpoints

> 🔴 Needs implementation. Supports caretaker identity and background check verification shown as the verified badge in the Caretaker Selection UI (#15).

---

### `POST /verifications`

Caretaker uploads a verification document (ID, background check, nursing license etc.).

**Auth required:** Yes (`caretaker` role)
**File to create:** `src/endpoint/verifications/createVerification.ts`
**Service method:** `VerificationService.createVerification(uploaderId, providerId, uploaderType, docType, docFileRef)`

**Request body:**

```json
{
  "docType": "nursing_license",
  "docFileRef": "https://cdn.oonjai.com/docs/caretaker-uuid-license.pdf",
  "uploaderType": "caretaker"
}
```

**Response `201`:**

```json
{
  "id": "uuid",
  "status": "pending",
  "docType": "nursing_license",
  "docFileRef": "https://cdn.oonjai.com/docs/...",
  "uploaderId": "uuid",
  "createdAt": 1700000000000
}
```

---

### `GET /verifications/pending`

Returns all pending verifications. Admin-only. Used on the admin dashboard to review caretaker documents.

**Auth required:** Yes (`admin` role)
**File to create:** `src/endpoint/verifications/getPendingVerifications.ts`
**Service method:** `VerificationService.getPendingVerifications()`

**Response `200`:** Array of `Verification` objects with `status: "pending"`

---

### `PUT /verifications/:verificationId`

Admin approves or rejects a verification document. Updating to `verified` sets `isVerified = true` on the caretaker's profile.

**Auth required:** Yes (`admin` role)
**File to create:** `src/endpoint/verifications/updateVerification.ts`
**Service method:** `VerificationService.approveVerification(verificationId, adminId)` or `markAsFailed(reason)`

**Path params:** `verificationId: UUID`

**Request body:**

```json
{
  "status": "verified",
  "reason": null
}
```

Or rejection:

```json
{
  "status": "rejected",
  "reason": "Document is expired. Please re-upload."
}
```

**Response `200`:** Updated `Verification` object

---

## 11. Real-time / Notifications

> 🔴 Needs implementation. The Caretaking Flows in the user flow PDF require real-time status pushes from caretaker to adult child.

### Recommended Approach: Server-Sent Events (SSE)

For the caretaking session flows, the adult child's app should subscribe to a SSE stream for their active booking. Status log `POST` calls trigger events on this stream.

### `GET /bookings/:bookingId/stream`

Opens a persistent SSE connection. The server pushes events when:
- A new `StatusLog` is created (`status_update` event)
- A photo is attached to a status update (`photo_update` event)
- The session ends (`session_completed` event)

**Auth required:** Yes (`adult_child` role)
**Response:** `Content-Type: text/event-stream`

**Example event payload:**

```
event: status_update
data: {"statusType":"at_pickup","notes":"Arrived safely.","photoUrl":"https://cdn.oonjai.com/...","timestamp":1700000000600}

event: session_completed
data: {"bookingId":"BK-8829","completedAt":1700010000000}
```

> **Note:** For mobile clients where SSE is less practical, use Firebase Cloud Messaging (FCM) push notifications. The SSE endpoint still serves the web client. Both can be served from the same `StatusLog` write path.

---

### Media Upload

Photo uploads during sessions (user flow: caretaker sends photo to adult child via chat) require a separate file upload endpoint before posting a status log.

### `POST /media/upload`

Accepts a multipart form upload and returns a CDN URL for use in status log `photoUrl` fields.

**Auth required:** Yes (`caretaker` role)
**Request:** `multipart/form-data` with field `file`
**Response `201`:**

```json
{ "url": "https://cdn.oonjai.com/photos/uuid-filename.jpg" }
```

---

## 12. Enumerations & Shared Types

These types need to be created in `src/type/` or relevant entity files:

### `ServiceType`

```ts
export enum ServiceType {
  MEDICAL_ESCORT = "medical_escort",
  HOME_CARE      = "home_care",
  OUTINGS        = "outings",
}
```

### `BookingStatus`

```ts
export enum BookingStatus {
  CREATED    = "created",
  CONFIRMED  = "confirmed",
  COMPLETED  = "completed",
  CANCELLED  = "cancelled",
}
```

### `CareSessionStatus`

```ts
export enum CareSessionStatus {
  DRIVING_TO_PICKUP   = "driving_to_pickup",
  AT_PICKUP           = "at_pickup",
  DRIVING_TO_HOSPITAL = "driving_to_hospital",
  AT_HOSPITAL         = "at_hospital",
  DRIVING_TO_OUTING   = "driving_to_outing",
  AT_OUTING           = "at_outing",
  DRIVING_TO_LOCATION = "driving_to_location",
  AT_LOCATION         = "at_location",
  IN_SESSION          = "in_session",
  DRIVING_HOME        = "driving_home",
  COMPLETED           = "completed",
}
```

### `PaymentMethod`

```ts
export enum PaymentMethod {
  QR_PROMPTPAY = "qr_promptpay",
  CREDIT_CARD  = "credit_card",
}
```

### `UploaderType`

```ts
export enum UploaderType {
  CARETAKER = "caretaker",
  ADMIN     = "admin",
}
```

---

## 13. New Entities & Services to Create

Following the existing DDD pattern (entity → repository interface → service → endpoint file → register in `index.ts`):

### New Entities

| Entity | Key Fields | Notes |
|--------|-----------|-------|
| `Caretaker` | `id`, `userId`, `bio`, `specialization`, `hourlyRate`, `experience`, `rating`, `isVerified`, `contactInfo` | Extends user with provider-specific data |
| `Booking` | `id`, `adultChildId`, `seniorId`, `caretakerId`, `serviceType`, `status`, `startDate`, `endDate`, `location`, `note`, `review` | Core booking record |
| `Payment` | `id`, `bookingId`, `amount`, `currency`, `method`, `status`, `transactionRef`, `paidAt` | |
| `StatusLog` | `id`, `bookingId`, `statusType`, `notes`, `photoUrl`, `createdAt` | One per status update during session |
| `IncidentLog` | `id`, `bookingId`, `seniorId`, `incidentType`, `detail`, `status`, `createdAt` | |
| `Verification` | `id`, `uploaderId`, `providerId`, `uploaderType`, `docType`, `docFileRef`, `status`, `approvedByAdmin`, `approvalDate` | |

### New Services

| Service | Depends on |
|---------|-----------|
| `CaretakerService` | `ICaretakerRepository`, `IUserRepository` |
| `BookingService` | `IBookingRepository`, `ISeniorRepository`, `ICaretakerRepository`, `IUserRepository` |
| `StatusLogService` | `IStatusLogRepository`, `IBookingRepository` |
| `IncidentLogService` | `IIncidentLogRepository`, `IBookingRepository` |
| `VerificationService` | `IVerificationRepository` |

### New Repository Interfaces to Define

- `ICaretakerRepository` — `findById`, `findAvailable(serviceType, start, end, filters)`, `insert`, `save`
- `IBookingRepository` — `findById`, `findByOwnerId`, `findByCaretakerId`, `insert`, `save`, `delete`
- `IPaymentRepository` — `findById`, `findByBookingId`, `insert`, `save`
- `IStatusLogRepository` — `findByBookingId`, `findById`, `insert`, `save`
- `IIncidentLogRepository` — `findByBookingId`, `findBySeniorId`, `findById`, `insert`, `save`
- `IVerificationRepository` — `findById`, `findPending`, `insert`, `save`

### Registration Pattern (add to `index.ts`)

```ts
// Instantiate new repos and services
const caretakerRepo     = new TestCaretakerRepository(db)
const bookingRepo       = new TestBookingRepository(db)
const paymentRepo       = new TestPaymentRepository(db)
const statusLogRepo     = new TestStatusLogRepository(db)
const incidentLogRepo   = new TestIncidentLogRepository(db)
const verificationRepo  = new TestVerificationRepository(db)

const caretakerService    = new CaretakerService(caretakerRepo, userRepo)
const bookingService      = new BookingService(bookingRepo, seniorRepo, caretakerRepo, userRepo)
const statusLogService    = new StatusLogService(statusLogRepo, bookingRepo)
const incidentLogService  = new IncidentLogService(incidentLogRepo, bookingRepo)
const verificationService = new VerificationService(verificationRepo)

// Register new endpoints
registry
  .register(getAvailableCaretakers,   [caretakerService])
  .register(getCaretakerById,         [caretakerService])
  .register(updateCaretakerProfile,   [caretakerService])
  .register(getBookings,              [bookingService])
  .register(createBooking,            [bookingService])
  .register(getBookingById,           [bookingService])
  .register(updateBooking,            [bookingService])
  .register(cancelBooking,            [bookingService])
  .register(confirmBooking,           [bookingService])
  .register(endSession,               [bookingService])
  .register(submitReview,             [bookingService])
  .register(initiatePayment,          [bookingService])
  .register(getPaymentStatus,         [bookingService])
  .register(paymentWebhook,           [bookingService])
  .register(getStatusLogs,            [statusLogService])
  .register(createStatusLog,          [statusLogService])
  .register(getIncidentLogs,          [incidentLogService])
  .register(createIncidentLog,        [incidentLogService])
  .register(updateIncidentLog,        [incidentLogService])
  .register(createVerification,       [verificationService])
  .register(getPendingVerifications,  [verificationService])
  .register(updateVerification,       [verificationService])
```

---

*Last updated: 2026-03-17*
*Derived from: FE-UI-TASK #14–#17, Oonjai User Flow PDF, full-system-diagram.svg*
