import {type Endpoint, badRequest, notFound, ok, unauthorized} from "@http/HttpContext"
import type {BookingService} from "@serv/BookingService"
import {UUID} from "@type/uuid"

export const endSession: Endpoint<[BookingService]> = {
  method: "POST",
  path: "/bookings/:bookingId/end",
  handler: async (ctx, [service], session) => {
    const user = session?.getUser()
    if (!user) {
      return unauthorized("User must be logged in")
    }
    if (!user.isCaretaker()) {
      return {status: 403, body: {message: "Only caretakers can end sessions"}}
    }

    const bookingId = ctx.params.bookingId as string

    try {
      const booking = service.endSession(bookingId, new UUID(user.getId()))
      return ok(booking.toDTO())
    } catch (err: unknown) {
      const message = (err as Error).message
      if (message.startsWith("NOT_FOUND")) return notFound("booking not found")
      if (message.startsWith("FORBIDDEN")) return {status: 403, body: {message}}
      if (message.startsWith("BAD_REQUEST")) return badRequest(message)
      throw err
    }
  },
}
