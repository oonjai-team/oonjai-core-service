import {type Endpoint, ok, unauthorized} from "@http/HttpContext"
import type {BookingService} from "@serv/BookingService"

export const getBookedSeniors: Endpoint<[BookingService]> = {
  method: "GET",
  path: "/activities/:activityId/booked-seniors",
  handler: async (ctx, [bookingService], session) => {
    if (!session?.getUser()) return unauthorized()

    const {activityId} = ctx.params
    const seniorIds = bookingService.getBookedSeniorIds(activityId)

    return ok({seniorIds})
  },
}
