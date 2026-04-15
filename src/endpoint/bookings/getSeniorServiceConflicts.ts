import {type Endpoint, ok, unauthorized, badRequest} from "@http/HttpContext"
import type {BookingService} from "@serv/BookingService"
import type {SeniorManagementService} from "@serv/SeniorManagementService"
import {UUID} from "@type/uuid"

export const getSeniorServiceConflicts: Endpoint<[BookingService, SeniorManagementService]> = {
  method: "GET",
  path: "/bookings/senior-conflicts",
  handler: async (ctx, [bookingService, seniorService], session) => {
    const user = session?.getUser()
    if (!user) {
      return unauthorized("User must be logged in")
    }

    const {startDate, endDate} = ctx.query as Record<string, string>
    if (!startDate || !endDate) {
      return badRequest("startDate and endDate are required")
    }

    // Get all seniors for this user
    const userId = new UUID(user.getId())
    const seniors = await seniorService.getAllSeniorsFromUser(userId)

    // Check each senior for time conflicts
    const conflicts: string[] = []
    for (const senior of seniors) {
      const seniorId = new UUID(senior.toDTO().id!)
      if (await bookingService.hasSeniorTimeConflict(seniorId, startDate, endDate)) {
        conflicts.push(senior.toDTO().id!)
      }
    }

    return ok({conflicts})
  },
}
