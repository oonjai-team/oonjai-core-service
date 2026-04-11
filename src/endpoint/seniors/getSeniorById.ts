import {type Endpoint, unauthorized, ok, notFound} from "@http/HttpContext"
import type {SeniorManagementService} from "@serv/SeniorManagementService"
import {UUID} from "@type/uuid"

export const getSeniorById: Endpoint<[SeniorManagementService]> = {
  method: "GET",
  path: "/users/seniors/:seniorId",
  handler: async (ctx, [service], session) => {
    const user = session?.getUser()

    if (!user) {
      return unauthorized("User must be logged in")
    }

    const seniorIdParam = ctx.params?.seniorId
    if (!seniorIdParam || typeof seniorIdParam !== "string") {
      return notFound("Senior not found")
    }

    const adultChildId = new UUID(user.getId())
    const seniorId = new UUID(seniorIdParam)

    const senior = service.getSeniorById(adultChildId, seniorId)

    if (!senior) {
      return notFound("Senior not found")
    }

    return ok(senior.toDTO())
  },
}