import type {Endpoint} from "@http/HttpContext"
import {ok} from "@http/HttpContext"
import type {UserService} from "@serv/UserService"
import {UUID} from "@type/uuid"
import type {SeniorManagementService} from "@serv/SeniorManagementService"

export const updateUser: Endpoint<[UserService]> = {
  method: "PUT",
  path: "/users/:id",
  handler: async (ctx, [service]) => {
    const body = ctx.body as Record<string, unknown>

    service.updateUser(new UUID(ctx.params.id!), {
      firstname: body?.firstname as string | undefined,
      lastname: body?.lastname as string | undefined,
      email: body?.email as string | undefined,
    })

    return ok()
  },
}
