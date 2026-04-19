import {type Endpoint, badRequest, created, notFound, unauthorized} from "@http/HttpContext"
import type {BookingService} from "@serv/BookingService"
import type {ActivityService} from "@serv/ActivityService"
import {UUID} from "@type/uuid"

const TRANSPORT_FEE = 150

export const createActivityBooking: Endpoint<[BookingService, ActivityService]> = {
  method: "POST",
  path: "/bookings/activity",
  handler: async (ctx, [bookingService, activityService], session) => {
    const user = session?.getUser()
    if (!user) return unauthorized()

    const body = ctx.body as Record<string, unknown>
    if (!body) return badRequest("request body is required")

    const {
      activityId,
      seniorIds,
      pickupMode,
      pickupLocation,
      dropoffMode,
      dropoffLocation,
      note,
    } = body as {
      activityId?: string
      seniorIds?: string[]
      pickupMode?: string
      pickupLocation?: string
      dropoffMode?: string
      dropoffLocation?: string
      note?: string
    }

    if (pickupMode !== "self" && pickupMode !== "arrange") {
      return badRequest("pickupMode must be 'self' or 'arrange'")
    }
    if (dropoffMode !== "self" && dropoffMode !== "arrange") {
      return badRequest("dropoffMode must be 'self' or 'arrange'")
    }
    if (pickupMode === "arrange" && !pickupLocation) {
      return badRequest("pickupLocation is required when pickupMode is 'arrange'")
    }
    if (dropoffMode === "arrange" && !dropoffLocation) {
      return badRequest("dropoffLocation is required when dropoffMode is 'arrange'")
    }

    if (!activityId) return badRequest("activityId is required")
    if (!seniorIds || !Array.isArray(seniorIds) || seniorIds.length === 0) {
      return badRequest("seniorIds must be a non-empty array")
    }

    // Validate activity exists
    const activity = await activityService.getActivityById(activityId)
    if (!activity) return notFound("Activity not found")

    // ── Duplicate check: prevent seniors already booked for this activity ──
    const alreadyBooked = await bookingService.getBookedSeniorIds(activityId)
    const duplicates = seniorIds.filter(id => alreadyBooked.includes(id))
    if (duplicates.length > 0) {
      return badRequest(`DUPLICATE: senior(s) already booked for this activity: ${duplicates.join(", ")}`)
    }

    // ── Time-overlap check: prevent seniors with conflicting bookings ──
    const startDate = activity.getStartDate()
    const endDate = activity.getEndDate()
    const conflicting: string[] = []
    for (const sid of seniorIds) {
      if (await bookingService.hasSeniorTimeConflict(new UUID(sid), startDate, endDate, activityId)) {
        conflicting.push(sid)
      }
    }
    if (conflicting.length > 0) {
      return badRequest(`TIME_CONFLICT: senior(s) have overlapping bookings: ${conflicting.join(", ")}`)
    }

    // ── Reserve spots — addParticipants validates capacity and throws if full ──
    try {
      activity.addParticipants(seniorIds.length)
    } catch (err: unknown) {
      const message = (err as Error).message
      if (message.startsWith("FULL")) return badRequest(message)
      return badRequest("Cannot reserve spots: " + message)
    }

    const activityDTO = activity.toDTO()

    // Calculate cost
    const activityFee = activityDTO.price * seniorIds.length
    const pickupFee = pickupMode === "arrange" ? TRANSPORT_FEE : 0
    const dropoffFee = dropoffMode === "arrange" ? TRANSPORT_FEE : 0
    const transportFee = pickupFee + dropoffFee
    const totalAmount = activityFee + transportFee

    // ── Per-senior transport allocation: even split to 2 decimals, rounding
    //    residue absorbed into the first booking so SUM(estimatedCost) == totalAmount.
    const perSeniorTransport = Math.floor((transportFee / seniorIds.length) * 100) / 100
    const firstSeniorTransport = Math.round((transportFee - perSeniorTransport * (seniorIds.length - 1)) * 100) / 100

    const transportMeta = `Pickup: ${pickupMode}${pickupMode === "arrange" ? ` (${pickupLocation})` : ""} | Dropoff: ${dropoffMode}${dropoffMode === "arrange" ? ` (${dropoffLocation})` : ""}`

    try {
      // Create one BOOKING per senior so each senior's activity-status view
      // has its own record (cancel, review, conflicts are all tracked per-booking).
      const bookingIds: string[] = []
      for (let i = 0; i < seniorIds.length; i++) {
        const sid = seniorIds[i]
        const seniorTransport = i === 0 ? firstSeniorTransport : perSeniorTransport
        const seniorCost = Math.round((activityDTO.price + seniorTransport) * 100) / 100
        const seniorNote = note
          ? `${note} | ${transportMeta}`
          : transportMeta

        const booking = await bookingService.createActivityBooking(
          new UUID(user.getId()),
          new UUID(sid),
          activityId,
          startDate,
          endDate,
          activityDTO.location,
          seniorCost,
          "THB",
          seniorNote,
        )
        const bookingDTO = booking.toDTO()
        if (bookingDTO.id) bookingIds.push(bookingDTO.id)
      }

      // Persist the updated participant count once, after all bookings succeed.
      await activityService.saveActivity(activity)

      return created({
        // `bookingId` kept (= first booking id) for backward compatibility with
        // existing clients that still read the singular field.
        bookingId: bookingIds[0],
        bookingIds,
        activityId,
        seniorIds,
        pickupMode,
        pickupLocation: pickupMode === "arrange" ? pickupLocation : undefined,
        dropoffMode,
        dropoffLocation: dropoffMode === "arrange" ? dropoffLocation : undefined,
        activityFee,
        transportFee,
        totalAmount,
        currency: "THB",
      })
    } catch (err: unknown) {
      const message = (err as Error).message
      if (message.startsWith("NOT_FOUND")) return notFound(message)
      throw err
    }
  },
}
