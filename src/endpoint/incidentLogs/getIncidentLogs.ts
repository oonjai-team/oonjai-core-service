import {type Endpoint, unauthorized, ok, notFound} from "@http/HttpContext"
import type {IncidentLogService} from "@serv/IncidentLogService"
import type {BookingService} from "@serv/BookingService"

export const getIncidentLogs: Endpoint<[IncidentLogService, BookingService]> = {
  method: "GET",
  path: "/bookings/:bookingId/incidents",
  handler: async (ctx, [incidentLogService, bookingService], session) => {
    const user = session?.getUser()
    if (!user) {
      return unauthorized("User must be logged in")
    }

    const bookingId = ctx.params?.bookingId as string
    const booking = await bookingService.getBookingDetail(bookingId)
    if (!booking) {
      return notFound("Booking not found")
    }

    const userId = user.getId()!.toString()
    const dto = booking.toDTO()
    const isOwner = dto.adultChildId === userId
    const isAssignedCaretaker = dto.caretakerId === userId

    if (!isOwner && !isAssignedCaretaker && !user.isAdmin()) {
      return { status: 403, body: { message: "FORBIDDEN: only the booking owner or assigned caretaker can view incidents" } }
    }

    const logs = await incidentLogService.getIncidentLogsFromBooking(bookingId)
    return ok(logs.map(log => log.toDTO()))
  },
}
