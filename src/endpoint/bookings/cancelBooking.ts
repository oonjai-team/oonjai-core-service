import {type Endpoint, notFound, noContent, unauthorized} from "@http/HttpContext"
import type {BookingService} from "@serv/BookingService"
import {UUID} from "@type/uuid"

export const cancelBooking: Endpoint<[BookingService]> = {
  method: "DELETE",
  path: "/bookings/:bookingId",
  handler: async (ctx, [service], session) => {
    const user = session?.getUser()
    if (!user) {
      return unauthorized("User must be logged in")
    }
    if (!user.isAdultChild()) {
      return {status: 403, body: {message: "Only adult_child users can cancel bookings"}}
    }

    const bookingId = ctx.params.bookingId as string

    try {
      service.cancelBooking(bookingId, new UUID(user.getId()))
      return noContent()
    } catch (err: unknown) {
      const message = (err as Error).message
      if (message.startsWith("NOT_FOUND")) return notFound("booking not found")
      if (message.startsWith("FORBIDDEN")) return {status: 403, body: {message}}
      throw err
    }
  },
}
