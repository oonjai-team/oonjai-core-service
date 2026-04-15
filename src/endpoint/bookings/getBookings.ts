import {type Endpoint, ok, unauthorized} from "@http/HttpContext"
import type {BookingService} from "@serv/BookingService"
import type {UserService} from "@serv/UserService"
import type {ActivityService} from "@serv/ActivityService"
import {BookingStatus, ServiceType} from "@type/booking"
import type {BookingFilter} from "@type/booking"
import {UUID} from "@type/uuid"

export const getBookings: Endpoint<[BookingService, UserService, ActivityService]> = {
  method: "GET",
  path: "/bookings",
  handler: async (ctx, [service, userService, activityService], session) => {
    const user = session?.getUser()
    if (!user) {
      return unauthorized("User must be logged in")
    }

    const {status, upcoming} = ctx.query
    const filter: BookingFilter = {
      status: status as BookingStatus | undefined,
      upcoming: upcoming === "true",
    }

    const userId = new UUID(user.getId())
    const role = user.toDTO().role
    const bookings = await service.getListOfBookings(userId, role, filter)

    // Cache activity lookups so we don't refetch the same activity repeatedly in a single page load.
    const activityCache = new Map<string, Awaited<ReturnType<ActivityService["getActivityById"]>>>()

    return ok(await Promise.all(bookings.map(async b => {
      const dto = b.toDTO()

      // Enrich with caretaker info
      let caretakerName: string | undefined
      let caretakerSpecialization: string | undefined
      if (dto.caretakerId) {
        const caretakerUser = await userService.getUserById(new UUID(dto.caretakerId))
        if (caretakerUser) {
          const cuDto = caretakerUser.toDTO()
          caretakerName = `${cuDto.firstname} ${cuDto.lastname}`.trim()
          caretakerSpecialization = cuDto.caretaker?.specialization
        }
      }

      // Enrich activity bookings with the activity summary so the UI can render
      // title / image / date / location without an extra round-trip per booking.
      let activity: {
        id: string
        title: string
        displayDate: string
        startDate: string
        endDate: string
        location: string
        images: string[]
        duration: string
        category: string
      } | undefined
      if (dto.serviceType === ServiceType.ACTIVITY && dto.activityId) {
        if (!activityCache.has(dto.activityId)) {
          activityCache.set(dto.activityId, await activityService.getActivityById(dto.activityId))
        }
        const found = activityCache.get(dto.activityId)
        if (found) {
          const a = found.toDTO()
          if (a.id) {
            activity = {
              id: a.id,
              title: a.title,
              displayDate: a.displayDate,
              startDate: a.startDate,
              endDate: a.endDate,
              location: a.location,
              images: a.images,
              duration: a.duration,
              category: a.category,
            }
          }
        }
      }

      return { ...dto, caretakerName, caretakerSpecialization, activity }
    })))
  },
}
