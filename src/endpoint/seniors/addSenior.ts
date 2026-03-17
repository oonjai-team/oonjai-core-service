import type {Endpoint} from "@http/HttpContext"
import {badRequest, created} from "@http/HttpContext"
import type {SeniorManagementService} from "@serv/SeniorManagementService"
import {UUID} from "@type/uuid"

export const addSenior: Endpoint<[SeniorManagementService]> = {
  method: "POST",
  path: "/users/:adultChildId/seniors",
  handler: async (ctx, [service]) => {
    const body = ctx.body as Record<string, unknown>

    if (!body?.fullname || !body?.dateOfBirth || !body?.mobilityLevel || !body?.healthNote) {
      return badRequest("fullname, dateOfBirth, mobilityLevel and healthNote are required")
    }

    const senior = service.addSeniorToAdultChild(
      new UUID(ctx.params.adultChildId!),
      body.fullname as string,
      body.dateOfBirth as string,
      body.mobilityLevel as string,
      body.healthNote as string
    )

    return created(senior.toDTO())
  },
}
