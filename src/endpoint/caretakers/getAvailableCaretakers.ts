import {type Endpoint, unauthorized, badRequest, ok} from "@http/HttpContext"
import type {UserService} from "@serv/UserService"

export const getAvailableCaretakers: Endpoint<[UserService]> = {
method: "GET",
path: "/caretakers",
handler: async (ctx, [service], session) => {
    const user = session?.getUser()
    if (!user) {
      return unauthorized("User must be logged in")
    }

    const q = ctx.query as Record<string, string>

    if (!q?.serviceType || !q?.startDate || !q?.endDate) {
      return badRequest("serviceType, startDate and endDate are required")
    }

    const caretakers = service.getAvailableCaretakers({
      serviceType: q.serviceType,
      startDate: new Date(q.startDate),
      endDate: new Date(q.endDate),
      specialization: q.specialization,
      minRating: q.minRating ? parseFloat(q.minRating) : undefined,
      minExperience: q.minExperience ? parseInt(q.minExperience) : undefined,
      maxHourlyRate: q.maxHourlyRate ? parseFloat(q.maxHourlyRate) : undefined,
      sortBy: q.sortBy as any,
    })

    return ok(caretakers.map(c => {
      const dto = c.toDTO()
      return {
        id: dto.id,
        firstname: dto.firstname,
        lastname: dto.lastname,
        ...dto.caretaker,
      }
    }))
  },
}