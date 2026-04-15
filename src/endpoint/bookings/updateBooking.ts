import {type Endpoint, notFound, ok, unauthorized} from "@http/HttpContext"
import type {BookingService} from "@serv/BookingService"

export const updateBooking: Endpoint<[BookingService]> = {
  method: "PUT",
  path: "/bookings/:bookingId",
  handler: async (ctx, [service], session) => {
    const user = session?.getUser()
    if (!user) {
      return unauthorized("User must be logged in")
    }
    if (!user.isAdultChild()) {
      return {status: 403, body: {message: "Only adult_child users can update bookings"}}
    }

    const bookingId = ctx.params.bookingId as string
    const body = ctx.body as Record<string, unknown>

    try {
      const booking = await service.updateBooking(bookingId, {
        startDate: body?.startDate as string | undefined,
        endDate: body?.endDate as string | undefined,
        location: body?.location as string | undefined,
        note: body?.note as string | undefined,
      })
      return ok(booking.toDTO())
    } catch (err: unknown) {
      const message = (err as Error).message
      if (message.startsWith("NOT_FOUND")) return notFound("booking not found")
      if (message.startsWith("FORBIDDEN")) return {status: 403, body: {message}}
      throw err
    }
  },
}
