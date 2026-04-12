import {type Endpoint, ok, unauthorized} from "@http/HttpContext"
import type {BookingService} from "@serv/BookingService"
import type {UserService} from "@serv/UserService"
import {BookingStatus} from "@type/booking"
import type {BookingFilter} from "@type/booking"
import {UUID} from "@type/uuid"

export const getBookings: Endpoint<[BookingService, UserService]> = {
  method: "GET",
  path: "/bookings",
  handler: async (ctx, [service, userService], session) => {
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
    const bookings = service.getListOfBookings(userId, role, filter)

    return ok(bookings.map(b => {
      const dto = b.toDTO()

      // Enrich with caretaker info
      let caretakerName: string | undefined
      let caretakerSpecialization: string | undefined
      if (dto.caretakerId) {
        const caretakerUser = userService.getUserById(new UUID(dto.caretakerId))
        if (caretakerUser) {
          const cuDto = caretakerUser.toDTO()
          caretakerName = `${cuDto.firstname} ${cuDto.lastname}`.trim()
          caretakerSpecialization = cuDto.caretaker?.specialization
        }
      }

      return { ...dto, caretakerName, caretakerSpecialization }
    }))
  },
}
