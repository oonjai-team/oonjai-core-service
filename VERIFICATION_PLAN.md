# Caretaker Verification Domain — Implementation Plan

## Task Reference
BE-VERIFICATION-TASK: Caretaker Verification Domain — Entity, Service & Endpoints

---

## Context & Patterns to Follow

This codebase uses Domain-Driven Design with a strict one-directional dependency flow:
```
Endpoint → Service → Repository → Database
```

Key patterns:
- Entities have overloaded constructors: `constructor(dto)` OR `constructor(...fields)`
- Every entity has a `toDTO()` method — always call it before returning from a handler
- Services throw prefixed errors: `"NOT_FOUND: ..."`, `"FORBIDDEN: ..."` for endpoint-level mapping
- Endpoints import service **types** only, never instances
- Response helpers: `ok()`, `created()`, `notFound()`, `badRequest()`, `unauthorized()` from `@http/HttpContext`
- `UUID` extends `String`; `Timestamp` is a custom class — use `TimestampHelper.now()` to get current time
- Database collections are accessed by string key (e.g., `"verification"`)

Reference existing implementations for exact patterns:
- Entity: `src/entity/User.ts` + `src/entity/UserDTO.ts`
- Repository: `src/repository/IUserRepository.ts` + `src/repository/TestUserRepository.ts`
- Service: `src/services/BookingService.ts`
- Endpoint: `src/endpoint/bookings/createBooking.ts`

---

## Files to Create

```
src/
├── type/
│   └── verification.ts
├── entity/
│   ├── Verification.ts
│   └── VerificationDTO.ts
├── repository/
│   ├── IVerificationRepository.ts
│   └── TestVerificationRepository.ts
├── services/
│   └── VerificationService.ts
└── endpoint/
    └── verifications/
        ├── createVerification.ts
        ├── getPendingVerifications.ts
        └── updateVerification.ts
```

---

## Step 1 — `src/type/verification.ts`

```typescript
export enum UploaderType {
  CARETAKER = "caretaker",
  ADMIN     = "admin",
}
```

---

## Step 2 — `src/entity/VerificationDTO.ts`

```typescript
import type { UploaderType } from "@type/verification"

export interface VerificationDTO {
  id: string | undefined
  uploaderId: string
  providerId: string
  uploaderType: UploaderType
  docType: string
  docFileRef: string
  status: string
  approvedByAdmin: string | null
  approvalDate: string | null
  createdAt: number
}
```

Notes:
- `createdAt` is stored as a raw `number` (milliseconds) — consistent with other DTOs
- `id` is `string | undefined` — undefined until persisted

---

## Step 3 — `src/entity/Verification.ts`

```typescript
import { UUID } from "@type/uuid"
import { Timestamp, TimestampHelper } from "@type/timestamp"
import { UploaderType } from "@type/verification"
import type { VerificationDTO } from "@entity/VerificationDTO"

export class Verification {
  private id: UUID | undefined
  private uploaderId: UUID
  private providerId: UUID
  private uploaderType: UploaderType
  private docType: string
  private docFileRef: string
  private status: string
  private approvedByAdmin: UUID | null
  private approvalDate: string | null
  private createdAt: Timestamp

  constructor(dto: VerificationDTO)
  constructor(
    uploaderId: UUID,
    providerId: UUID,
    uploaderType: UploaderType,
    docType: string,
    docFileRef: string,
    status: string,
    approvedByAdmin: UUID | null,
    approvalDate: string | null,
    createdAt: Timestamp,
    id?: UUID
  )

  constructor(
    ...args:
      | [VerificationDTO]
      | [UUID, UUID, UploaderType, string, string, string, UUID | null, string | null, Timestamp, UUID?]
  ) {
    if (typeof args[0] === "object" && "uploaderId" in args[0]) {
      const dto = args[0] as VerificationDTO
      this.id = dto.id ? new UUID(dto.id) : undefined
      this.uploaderId = new UUID(dto.uploaderId)
      this.providerId = new UUID(dto.providerId)
      this.uploaderType = dto.uploaderType
      this.docType = dto.docType
      this.docFileRef = dto.docFileRef
      this.status = dto.status
      this.approvedByAdmin = dto.approvedByAdmin ? new UUID(dto.approvedByAdmin) : null
      this.approvalDate = dto.approvalDate
      this.createdAt = new Timestamp(dto.createdAt)
      return
    }

    const arr = args as [UUID, UUID, UploaderType, string, string, string, UUID | null, string | null, Timestamp, UUID?]
    this.uploaderId = arr[0]
    this.providerId = arr[1]
    this.uploaderType = arr[2]
    this.docType = arr[3]
    this.docFileRef = arr[4]
    this.status = arr[5]
    this.approvedByAdmin = arr[6]
    this.approvalDate = arr[7]
    this.createdAt = arr[8]
    this.id = arr[9]
  }

  public isNew(): boolean {
    return !this.id
  }

  public getId(): UUID | undefined {
    return this.id
  }

  public getUploaderId(): UUID {
    return this.uploaderId
  }

  public approve(adminId: UUID): void {
    this.status = "verified"
    this.approvedByAdmin = adminId
    this.approvalDate = new Date().toISOString()
  }

  public reject(): void {
    this.status = "rejected"
  }

  public toDTO(): VerificationDTO {
    return {
      id: this.id?.toString(),
      uploaderId: this.uploaderId.toString(),
      providerId: this.providerId.toString(),
      uploaderType: this.uploaderType,
      docType: this.docType,
      docFileRef: this.docFileRef,
      status: this.status,
      approvedByAdmin: this.approvedByAdmin?.toString() ?? null,
      approvalDate: this.approvalDate,
      createdAt: this.createdAt.getTime(),
    }
  }
}
```

---

## Step 4 — `src/repository/IVerificationRepository.ts`

```typescript
import type { Verification } from "@entity/Verification"
import type { UUID } from "@type/uuid"

export interface IVerificationRepository {
  findById(id: UUID): Verification | undefined
  findPending(): Verification[]
  insert(verification: Verification): UUID
  save(verification: Verification): boolean
}
```

---

## Step 5 — `src/repository/TestVerificationRepository.ts`

```typescript
import type { IVerificationRepository } from "@repo/IVerificationRepository"
import type { ITestDatabase } from "../lib/TestDatabase"
import { Verification } from "@entity/Verification"
import { UUID } from "@type/uuid"
import { UploaderType } from "@type/verification"

export class TestVerificationRepository implements IVerificationRepository {
  constructor(private db: ITestDatabase) {}

  findById(id: UUID): Verification | undefined {
    try {
      const record = this.db.get("verification", id)
      return this.reconstruct(record)
    } catch {
      return undefined
    }
  }

  findPending(): Verification[] {
    return this.db
      .getAll("verification")
      .filter((r) => r.status === "pending")
      .map((r) => this.reconstruct(r))
  }

  insert(verification: Verification): UUID {
    return this.db.insert("verification", verification.toDTO())
  }

  save(verification: Verification): boolean {
    const id = verification.getId()
    if (!id) throw new Error("Cannot save a verification without an id")
    return this.db.update("verification", id, verification.toDTO())
  }

  private reconstruct(record: any): Verification {
    return new Verification({
      id: record.id,
      uploaderId: record.uploaderId,
      providerId: record.providerId,
      uploaderType: record.uploaderType as UploaderType,
      docType: record.docType,
      docFileRef: record.docFileRef,
      status: record.status,
      approvedByAdmin: record.approvedByAdmin ?? null,
      approvalDate: record.approvalDate ?? null,
      createdAt: record.createdAt,
    })
  }
}
```

---

## Step 6 — `src/services/VerificationService.ts`

This service takes **two** repository dependencies: `IVerificationRepository` (for verification CRUD) and `IUserRepository` (to set `isVerified = true` on the caretaker's profile on approval).

```typescript
import type { IVerificationRepository } from "@repo/IVerificationRepository"
import type { IUserRepository } from "@repo/IUserRepository"
import type { IService } from "@serv/IService"
import { Verification } from "@entity/Verification"
import { UploaderType } from "@type/verification"
import { UUID } from "@type/uuid"
import { TimestampHelper } from "@type/timestamp"

const VALID_DOC_TYPES = ["national_id", "nursing_license", "background_check", "work_permit"]

export class VerificationService implements IService {
  constructor(
    private verificationRepo: IVerificationRepository,
    private userRepo: IUserRepository
  ) {}

  public getServiceId(): string {
    return "VerificationService"
  }

  public createVerification(
    uploaderId: UUID,
    providerId: UUID,
    uploaderType: UploaderType,
    docType: string,
    docFileRef: string
  ): Verification {
    if (!VALID_DOC_TYPES.includes(docType)) {
      throw new Error(`INVALID_DOC_TYPE: docType must be one of: ${VALID_DOC_TYPES.join(", ")}`)
    }

    const verification = new Verification(
      uploaderId,
      providerId,
      uploaderType,
      docType,
      docFileRef,
      "pending",
      null,
      null,
      TimestampHelper.now()
    )

    const id = this.verificationRepo.insert(verification)
    return new Verification({ ...verification.toDTO(), id: id.toString() })
  }

  public getPendingVerifications(): Verification[] {
    return this.verificationRepo.findPending()
  }

  public approveVerification(verificationId: UUID, adminId: UUID): Verification {
    const verification = this.verificationRepo.findById(verificationId)
    if (!verification) throw new Error("NOT_FOUND: verification not found")

    verification.approve(adminId)
    this.verificationRepo.save(verification)

    // Side effect: set isVerified = true on the caretaker's profile
    const uploaderId = verification.getUploaderId()
    this.userRepo.updateAttrProfile(uploaderId, { isVerified: true })

    return verification
  }

  public rejectVerification(verificationId: UUID, adminId: UUID, reason: string): Verification {
    const verification = this.verificationRepo.findById(verificationId)
    if (!verification) throw new Error("NOT_FOUND: verification not found")

    verification.reject()
    this.verificationRepo.save(verification)

    return verification
  }
}
```

---

## Step 7 — `src/endpoint/verifications/createVerification.ts`

Restricted to **caretaker** role only (403 for others).

```typescript
import { type Endpoint, badRequest, created, unauthorized } from "@http/HttpContext"
import type { VerificationService } from "@serv/VerificationService"
import { UploaderType } from "@type/verification"
import { UUID } from "@type/uuid"

export const createVerification: Endpoint<[VerificationService]> = {
  method: "POST",
  path: "/verifications",
  handler: async (ctx, [service], session) => {
    const user = session?.getUser()
    if (!user) return unauthorized("User must be logged in")
    if (!user.isCaretaker()) return { status: 403, body: { message: "Only caretakers can upload verification documents" } }

    const body = ctx.body as Record<string, unknown>
    if (!body?.docType || !body?.docFileRef || !body?.uploaderType) {
      return badRequest("docType, docFileRef, and uploaderType are required")
    }

    const uploaderTypeValues = Object.values(UploaderType) as string[]
    if (!uploaderTypeValues.includes(body.uploaderType as string)) {
      return badRequest(`uploaderType must be one of: ${uploaderTypeValues.join(", ")}`)
    }

    const userId = user.getId()
    if (!userId) return unauthorized("Invalid session")

    try {
      const verification = service.createVerification(
        new UUID(userId.toString()),
        new UUID(userId.toString()),
        body.uploaderType as UploaderType,
        body.docType as string,
        body.docFileRef as string
      )
      return created(verification.toDTO())
    } catch (err: unknown) {
      const message = (err as Error).message
      if (message.startsWith("INVALID_DOC_TYPE")) return badRequest(message)
      throw err
    }
  },
}
```

---

## Step 8 — `src/endpoint/verifications/getPendingVerifications.ts`

Restricted to **admin** role only (403 for others).

```typescript
import { type Endpoint, ok, unauthorized } from "@http/HttpContext"
import type { VerificationService } from "@serv/VerificationService"

export const getPendingVerifications: Endpoint<[VerificationService]> = {
  method: "GET",
  path: "/verifications/pending",
  handler: async (ctx, [service], session) => {
    const user = session?.getUser()
    if (!user) return unauthorized("User must be logged in")
    if (!user.isAdmin()) return { status: 403, body: { message: "Only admins can view pending verifications" } }

    const verifications = service.getPendingVerifications()
    return ok(verifications.map((v) => v.toDTO()))
  },
}
```

---

## Step 9 — `src/endpoint/verifications/updateVerification.ts`

Restricted to **admin** role only. Requires `reason` when rejecting (400 if missing).

```typescript
import { type Endpoint, badRequest, ok, unauthorized } from "@http/HttpContext"
import type { VerificationService } from "@serv/VerificationService"
import { UUID } from "@type/uuid"

export const updateVerification: Endpoint<[VerificationService]> = {
  method: "PUT",
  path: "/verifications/:verificationId",
  handler: async (ctx, [service], session) => {
    const user = session?.getUser()
    if (!user) return unauthorized("User must be logged in")
    if (!user.isAdmin()) return { status: 403, body: { message: "Only admins can approve or reject verifications" } }

    const { verificationId } = ctx.params
    const body = ctx.body as Record<string, unknown>

    if (!body?.status) return badRequest("status is required")
    if (body.status !== "verified" && body.status !== "rejected") {
      return badRequest("status must be 'verified' or 'rejected'")
    }
    if (body.status === "rejected" && !body.reason) {
      return badRequest("reason is required when rejecting a verification")
    }

    const adminId = user.getId()
    if (!adminId) return unauthorized("Invalid session")

    try {
      let verification
      if (body.status === "verified") {
        verification = service.approveVerification(new UUID(verificationId), new UUID(adminId.toString()))
      } else {
        verification = service.rejectVerification(
          new UUID(verificationId),
          new UUID(adminId.toString()),
          body.reason as string
        )
      }
      return ok(verification.toDTO())
    } catch (err: unknown) {
      const message = (err as Error).message
      if (message.startsWith("NOT_FOUND")) return { status: 404, body: { message } }
      throw err
    }
  },
}
```

---

## Step 10 — Wire everything in `src/index.ts`

### Add imports (group with the other domain imports)

```typescript
// Verification
import { TestVerificationRepository } from "@repo/TestVerificationRepository"
import { VerificationService } from "@serv/VerificationService"
import { createVerification } from "@endpoint/verifications/createVerification"
import { getPendingVerifications } from "@endpoint/verifications/getPendingVerifications"
import { updateVerification } from "@endpoint/verifications/updateVerification"
```

### Add to Infrastructure section (after `bookingRepo`)

```typescript
const verificationRepo = new TestVerificationRepository(db)
```

### Add to Services section

```typescript
const verificationService = new VerificationService(verificationRepo, userRepo)
```

### Add to the registry chain (after the Bookings block)

```typescript
// Verifications
.register(createVerification, [verificationService])
.register(getPendingVerifications, [verificationService])
.register(updateVerification, [verificationService])
```

---

## Acceptance Criteria Checklist

| # | Criterion | Where |
|---|-----------|-------|
| 1 | Verification entity + VerificationDTO created | Steps 2–3 |
| 2 | `UploaderType` enum in `src/type/verification.ts` | Step 1 |
| 3 | `IVerificationRepository` + `TestVerificationRepository` created | Steps 4–5 |
| 4 | `VerificationService` implements `IService` with approve + reject | Step 6 |
| 5 | POST `/verifications` restricted to caretaker role | Step 7 |
| 6 | GET `/verifications/pending` restricted to admin, 403 for others | Step 8 |
| 7 | PUT `/verifications/:id` restricted to admin | Step 9 |
| 8 | Approving sets `caretaker.isVerified = true` | `approveVerification()` in Step 6 |
| 9 | Rejecting requires `reason` field, returns 400 if missing | Step 9 handler |
| 10 | All three endpoints registered in `index.ts` | Step 10 |

---

## Important Notes

1. **`VerificationService` takes two repos** — `IVerificationRepository` and `IUserRepository`. The approval side effect calls `userRepo.updateAttrProfile(uploaderId, { isVerified: true })` directly, which is consistent with how `BookingService` updates caretaker rating after a review.

2. **`providerId` = `uploaderId`** — the POST body does not include a separate `providerId`, so both are set to the authenticated caretaker's user ID.

3. **`reason` is validated at the endpoint, not the service** — the service accepts it as a parameter for future use but the current `Verification` entity does not persist it (not in the entity shape spec).

4. **Do not add a `rejectionReason` field to `Verification`** unless explicitly required — keep the entity shape exactly as specified.
