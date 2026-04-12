/**
 * Feature 3 — Booking Creation and Confirmation (TC23–TC33)
 *
 * Payment is explicitly out of scope per the prompt plan, so no payment /
 * refund / card cases are covered here.
 */
import {describe, expect, test} from "bun:test"
import {createBooking} from "@endpoint/bookings/createBooking"
import {getBookingById} from "@endpoint/bookings/getBookingById"
import {ServiceType} from "@type/booking"
import {emptyCtx, makeEnv, makeSessionFor, seedAdultChild, seedCaretaker} from "./helpers/factories"

const SLOT = {
  startDate: "2026-04-15T09:00:00.000Z",
  endDate: "2026-04-15T12:00:00.000Z",
}

function basePayload(seniorId: string, caretakerId: string, overrides: Record<string, unknown> = {}) {
  return {
    seniorId,
    caretakerId,
    serviceType: ServiceType.HOME_CARE,
    startDate: SLOT.startDate,
    endDate: SLOT.endDate,
    location: "Bangkok",
    note: "Please be on time",
    ...overrides,
  }
}

describe("Feature 3 — Booking Creation and Confirmation", () => {
  // ── TC23: Booking summary shows correct caretaker, date and time ──────────
  test("TC23 — created booking carries the chosen caretaker, date and time", async () => {
    const env = makeEnv()
    const {session, id: ownerId} = seedAdultChild(env)
    const {id: caretakerId} = seedCaretaker(env)

    const result = await createBooking.handler(
      emptyCtx({body: basePayload(ownerId.toString(), caretakerId.toString())}),
      [env.bookingService],
      session
    )

    expect(result.status).toBe(201)
    const dto = result.body as Record<string, unknown>
    expect(dto.caretakerId).toBe(caretakerId.toString())
    expect(dto.startDate).toBe(SLOT.startDate)
    expect(dto.endDate).toBe(SLOT.endDate)
  })

  // ── TC24: Successful booking submission creates a booking record ──────────
  test("TC24 — successful submission persists a booking", async () => {
    const env = makeEnv()
    const {session, id: ownerId} = seedAdultChild(env)
    const {id: caretakerId} = seedCaretaker(env)

    const result = await createBooking.handler(
      emptyCtx({body: basePayload(ownerId.toString(), caretakerId.toString())}),
      [env.bookingService],
      session
    )

    expect(result.status).toBe(201)
    const dto = result.body as {id: string}
    expect(dto.id).toMatch(/^BK-/)
    const persisted = env.bookingService.getBookingDetail(dto.id)
    expect(persisted).toBeDefined()
  })

  // ── TC25: Submission blocked when a required field is missing ─────────────
  test("TC25 — submission missing endDate is rejected", async () => {
    const env = makeEnv()
    const {session, id: ownerId} = seedAdultChild(env)
    const {id: caretakerId} = seedCaretaker(env)

    const payload = basePayload(ownerId.toString(), caretakerId.toString()) as Record<string, unknown>
    delete payload.endDate

    const result = await createBooking.handler(
      emptyCtx({body: payload}),
      [env.bookingService],
      session
    )
    expect(result.status).toBe(400)
    expect((result.body as {message: string}).message).toMatch(/endDate/)
  })

  // ── TC26: Submission with invalid serviceType is rejected ─────────────────
  test("TC26 — submission with invalid serviceType is rejected", async () => {
    const env = makeEnv()
    const {session, id: ownerId} = seedAdultChild(env)
    const {id: caretakerId} = seedCaretaker(env)

    const result = await createBooking.handler(
      emptyCtx({body: basePayload(ownerId.toString(), caretakerId.toString(), {serviceType: "spa"})}),
      [env.bookingService],
      session
    )
    expect(result.status).toBe(400)
    expect((result.body as {message: string}).message).toMatch(/serviceType/)
  })

  // ── TC27: Submission blocked when caretaker is unavailable (slot conflict) ─
  test("TC27 — overlapping booking on the same caretaker returns 409 CONFLICT", async () => {
    const env = makeEnv()
    const {session, id: ownerId} = seedAdultChild(env)
    const {id: caretakerId} = seedCaretaker(env)

    const first = await createBooking.handler(
      emptyCtx({body: basePayload(ownerId.toString(), caretakerId.toString())}),
      [env.bookingService],
      session
    )
    expect(first.status).toBe(201)

    const second = await createBooking.handler(
      emptyCtx({body: basePayload(ownerId.toString(), caretakerId.toString())}),
      [env.bookingService],
      session
    )
    expect(second.status).toBe(409)
    expect((second.body as {message: string}).message).toMatch(/CONFLICT/)
  })

  // ── TC28: Submission against a non-existent caretaker returns 404 ─────────
  test("TC28 — booking with unknown caretaker id is rejected", async () => {
    const env = makeEnv()
    const {session, id: ownerId} = seedAdultChild(env)

    const result = await createBooking.handler(
      emptyCtx({body: basePayload(ownerId.toString(), "00000000-0000-0000-0000-000000000000")}),
      [env.bookingService],
      session
    )
    expect(result.status).toBe(404)
    expect((result.body as {message: string}).message).toMatch(/CARETAKER_NOT_FOUND/)
  })

  // ── TC29: Authorisation — booking creation requires a session ─────────────
  test("TC29 — booking creation without a session returns 401", async () => {
    const env = makeEnv()
    const {id: ownerId} = seedAdultChild(env)
    const {id: caretakerId} = seedCaretaker(env)

    const result = await createBooking.handler(
      emptyCtx({body: basePayload(ownerId.toString(), caretakerId.toString())}),
      [env.bookingService],
      null
    )
    expect(result.status).toBe(401)
  })

  // ── TC30: Confirmation page (getBookingById) shows booking details ────────
  test("TC30 — owner can fetch their own booking details", async () => {
    const env = makeEnv()
    const {session, id: ownerId} = seedAdultChild(env)
    const {id: caretakerId} = seedCaretaker(env)

    const created = await createBooking.handler(
      emptyCtx({body: basePayload(ownerId.toString(), caretakerId.toString())}),
      [env.bookingService],
      session
    )
    const bookingId = (created.body as {id: string}).id

    const result = await getBookingById.handler(
      emptyCtx({params: {bookingId}}),
      [env.bookingService],
      session
    )
    expect(result.status).toBe(200)
    const dto = result.body as Record<string, unknown>
    expect(dto.id).toBe(bookingId)
    expect(dto.caretakerId).toBe(caretakerId.toString())
  })

  // ── TC31: Another user cannot access someone else's confirmation ──────────
  test("TC31 — a different user cannot view another user's booking", async () => {
    const env = makeEnv()
    const owner = seedAdultChild(env, "owner@example.com")
    const intruder = seedAdultChild(env, "intruder@example.com")
    const {id: caretakerId} = seedCaretaker(env)

    const created = await createBooking.handler(
      emptyCtx({body: basePayload(owner.id.toString(), caretakerId.toString())}),
      [env.bookingService],
      owner.session
    )
    const bookingId = (created.body as {id: string}).id

    const result = await getBookingById.handler(
      emptyCtx({params: {bookingId}}),
      [env.bookingService],
      makeSessionFor(intruder.user)
    )
    expect(result.status).toBe(403)
  })

  // ── TC32: Booking with reversed dates is rejected ─────────────────────────
  test("TC32 — booking with endDate before startDate is rejected", async () => {
    const env = makeEnv()
    const {session, id: ownerId} = seedAdultChild(env)
    const {id: caretakerId} = seedCaretaker(env)

    const result = await createBooking.handler(
      emptyCtx({
        body: basePayload(ownerId.toString(), caretakerId.toString(), {
          startDate: "2026-04-15T12:00:00.000Z",
          endDate: "2026-04-15T09:00:00.000Z",
        }),
      }),
      [env.bookingService],
      session
    )
    expect(result.status).toBe(400)
  })

  // ── TC33: Booking with zero-length slot is rejected ───────────────────────
  test("TC33 — booking with startDate equal to endDate is rejected", async () => {
    const env = makeEnv()
    const {session, id: ownerId} = seedAdultChild(env)
    const {id: caretakerId} = seedCaretaker(env)

    const result = await createBooking.handler(
      emptyCtx({
        body: basePayload(ownerId.toString(), caretakerId.toString(), {
          startDate: "2026-04-15T09:00:00.000Z",
          endDate: "2026-04-15T09:00:00.000Z",
        }),
      }),
      [env.bookingService],
      session
    )
    expect(result.status).toBe(400)
  })
})
