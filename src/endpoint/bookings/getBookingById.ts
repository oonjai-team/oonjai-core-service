import {type Endpoint, notFound, ok, unauthorized} from "@http/HttpContext"
import type {BookingService} from "@serv/BookingService"

export const getBookingById: Endpoint<[BookingService]> = {
  method: "GET",
  path: "/bookings/:bookingId",
  handler: async (ctx, [service], session) => {
    const user = session?.getUser()
    if (!user) {
      return unauthorized("User must be logged in")
    }

    const bookingId = ctx.params.bookingId as string
    const booking = await service.getBookingDetail(bookingId)
    if (!booking) {
      return notFound("booking not found")
    }

    const userId = user.getId()
    const isOwner = booking.getAdultChildId().is(userId)
    const caretakerId = booking.getCaretakerId()
    const isAssignedCaretaker = caretakerId ? caretakerId.is(userId) : false
    if (!isOwner && !isAssignedCaretaker) {
      return {status: 403, body: {message: "Access denied"}}
    }

    return ok(booking.toDTO())
  },
}
