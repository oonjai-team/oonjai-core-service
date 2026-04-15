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

    // Compose a note that preserves senior list + transport metadata
    const metaParts: string[] = []
    metaParts.push(`Seniors: ${seniorIds.join(", ")}`)
    metaParts.push(`Pickup: ${pickupMode}${pickupMode === "arrange" ? ` (${pickupLocation})` : ""}`)
    metaParts.push(`Dropoff: ${dropoffMode}${dropoffMode === "arrange" ? ` (${dropoffLocation})` : ""}`)
    const composedNote = note ? `${note} | ${metaParts.join(" | ")}` : metaParts.join(" | ")

    try {
      // Create a single booking for the activity (use first senior as primary)
      const booking = await bookingService.createActivityBooking(
        new UUID(user.getId()),
        new UUID(seniorIds[0]),
        activityId,
        startDate,
        endDate,
        activityDTO.location,
        totalAmount,
        "THB",
        composedNote,
      )

      // Persist the updated participant count
      await activityService.saveActivity(activity)

      const bookingDTO = booking.toDTO()

      return created({
        bookingId: bookingDTO.id,
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
