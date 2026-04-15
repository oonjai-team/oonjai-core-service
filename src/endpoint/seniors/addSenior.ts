import {type Endpoint, unauthorized} from "@http/HttpContext"
import {badRequest, created} from "@http/HttpContext"
import type {SeniorManagementService} from "@serv/SeniorManagementService"
import {UUID} from "@type/uuid"

export const addSenior: Endpoint<[SeniorManagementService]> = {
  method: "POST",
  path: "/users/seniors",
  handler: async (ctx, [service], session) => {
    const body = ctx.body as Record<string, unknown>
    const user = session?.getUser()
    if (!user) {
      return unauthorized("User must be logged in to add a senior")
    }

    if (!body?.fullname || !body?.dateOfBirth || !body?.mobilityLevel || !body?.healthNote) {
      return badRequest("fullname, dateOfBirth, mobilityLevel and healthNote are required")
    }

    const senior = await service.addSeniorToAdultChild(
      new UUID(user.getId()),
      body.fullname as string,
      body.dateOfBirth as string,
      body.mobilityLevel as string,
      body.healthNote as string
    )

    return created(senior.toDTO())
  },
}
