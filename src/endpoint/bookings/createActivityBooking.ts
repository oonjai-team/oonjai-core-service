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
    const activity = activityService.getActivityById(activityId)
    if (!activity) return notFound("Activity not found")

    const activityDTO = activity.toDTO()
    if (activityDTO.spotsLeft < seniorIds.length) {
      return badRequest("Not enough spots left for this activity")
    }

    // Calculate cost
    const activityFee = activityDTO.price * seniorIds.length
    const transportFee = (transport === "pickup" || transport === "dropoff") ? TRANSPORT_FEE : 0
    const totalAmount = activityFee + transportFee

    try {
      // Create a single booking for the activity (use first senior as primary)
      const booking = bookingService.createActivityBooking(
        new UUID(user.getId()),
        new UUID(seniorIds[0]),
        activityId,
        activityDTO.date,
        activityDTO.date,
        activityDTO.location,
        totalAmount,
        "THB",
        note ?? `Seniors: ${seniorIds.join(", ")}`,
      )

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
