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

    const {activityId, seniorIds, transport, note} = body as {
      activityId?: string
      seniorIds?: string[]
      transport?: string
      note?: string
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
    const transportFee = (transport === "pickup" || transport === "dropoff") ? TRANSPORT_FEE : 0
    const totalAmount = activityFee + transportFee

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
        note ?? `Seniors: ${seniorIds.join(", ")}`,
      )

      // Persist the updated participant count
      await activityService.saveActivity(activity)

      const bookingDTO = booking.toDTO()

      return created({
        bookingId: bookingDTO.id,
        activityId,
        seniorIds,
        transport: transport ?? "self",
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
