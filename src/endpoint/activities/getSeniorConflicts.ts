import {type Endpoint, ok, notFound, unauthorized} from "@http/HttpContext"
import type {BookingService} from "@serv/BookingService"
import type {ActivityService} from "@serv/ActivityService"
import type {SeniorManagementService} from "@serv/SeniorManagementService"
import {UUID} from "@type/uuid"

export const getSeniorConflicts: Endpoint<[BookingService, ActivityService, SeniorManagementService]> = {
  method: "GET",
  path: "/activities/:activityId/senior-conflicts",
  handler: async (ctx, [bookingService, activityService, seniorService], session) => {
    if (!session?.getUser()) return unauthorized()

    const {activityId} = ctx.params
    const activity = activityService.getActivityById(activityId)
    if (!activity) return notFound("Activity not found")

    // Get seniors already booked for this specific activity
    const alreadyBooked = bookingService.getBookedSeniorIds(activityId)

    // For the frontend to check time conflicts, also return which seniors have
    // overlapping bookings (different activity, same time window)
    const startDate = activity.getStartDate()
    const endDate = activity.getEndDate()

    // Get ALL seniors belonging to this user (not just ones with bookings)
    const userId = session!.getUser()!.getId()
    const userSeniors = seniorService.getAllSeniorsFromUser(new UUID(userId))
    const userSeniorIds = userSeniors.map(s => s.toDTO().id).filter(Boolean) as string[]

    const timeConflicts: string[] = []
    for (const sid of userSeniorIds) {
      if (alreadyBooked.includes(sid)) continue // already caught by duplicate
      if (bookingService.hasSeniorTimeConflict(new UUID(sid), startDate, endDate, activityId)) {
        timeConflicts.push(sid)
      }
    }

    return ok({
      alreadyBooked,
      timeConflicts,
    })
  },
}
