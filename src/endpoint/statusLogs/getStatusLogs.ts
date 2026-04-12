import {type Endpoint, unauthorized, ok} from "@http/HttpContext"
import type {StatusLogService} from "@serv/StatusLogService"

export const getStatusLogs: Endpoint<[StatusLogService]> = {
method: "GET",
path: "/bookings/:bookingId/status",
handler: async (ctx, [service], session) => {
    const user = session?.getUser()
    if (!user) {
      return unauthorized("User must be logged in")
    }

    // TODO
    // Check if booking is related to the user or not

    const bookingId = ctx.params?.bookingId as string
    const logs = service.getStatusLogsForBooking(bookingId)
    return ok(logs.map(log => log.toDTO()))
  },
}