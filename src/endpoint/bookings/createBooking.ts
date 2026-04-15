import {type Endpoint, badRequest, created, unauthorized} from "@http/HttpContext"
import type {BookingService} from "@serv/BookingService"
import {ServiceType} from "@type/booking"
import {UUID} from "@type/uuid"

export const createBooking: Endpoint<[BookingService]> = {
  method: "POST",
  path: "/bookings",
  handler: async (ctx, [service], session) => {
    const user = session?.getUser()
    if (!user) {
      return unauthorized("User must be logged in")
    }
    if (!user.isAdultChild()) {
      return {status: 403, body: {message: "Only adult_child users can create bookings"}}
    }

    const body = ctx.body as Record<string, unknown>
    if (!body?.seniorId || !body?.caretakerId || !body?.serviceType || !body?.startDate || !body?.endDate || !body?.location) {
      return badRequest("seniorId, caretakerId, serviceType, startDate, endDate and location are required")
    }

    const serviceTypeValues = Object.values(ServiceType) as string[]
    if (!serviceTypeValues.includes(body.serviceType as string)) {
      return badRequest(`serviceType must be one of: ${serviceTypeValues.join(", ")}`)
    }

    try {
      const booking = await service.createBooking(
        new UUID(user.getId()),
        new UUID(body.seniorId as string),
        new UUID(body.caretakerId as string),
        body.serviceType as ServiceType,
        body.startDate as string,
        body.endDate as string,
        body.location as string,
        (body.note as string) ?? ""
      )
      return created(booking.toDTO())
    } catch (err: unknown) {
      const message = (err as Error).message
      if (message.startsWith("CONFLICT")) return {status: 409, body: {message}}
      if (message.startsWith("SENIOR_CONFLICT")) return {status: 409, body: {message}}
      if (message.startsWith("CARETAKER_NOT_FOUND")) return {status: 404, body: {message}}
      throw err
    }
  },
}
