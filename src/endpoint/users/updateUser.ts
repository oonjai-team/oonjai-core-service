import {type Endpoint, unauthorized} from "@http/HttpContext"
import {ok} from "@http/HttpContext"
import type {UserService} from "@serv/UserService"
import {UUID} from "@type/uuid"

export const updateUser: Endpoint<[UserService]> = {
  method: "PUT",
  path: "/users/update",
  handler: async (ctx, [service], session) => {
    const user = session?.getUser()
    if (!user) {
      return unauthorized("User must be logged in to update user")
    }

    const body = ctx.body as Record<string, unknown>

    const adultChild = body?.adultChild as Record<string, unknown> | undefined

    service.updateUser(new UUID(session?.getUserId()), {
      firstname: body?.firstname as string | undefined,
      lastname: body?.lastname as string | undefined,
      email: body?.email as string | undefined,
      phone: body?.phone as string | undefined,
      ...(adultChild ? {
        adultChild: {
          relationship: adultChild.relationship as string | undefined,
          goal: adultChild.goal as string | undefined,
          concerns: adultChild.concerns as string[] | undefined,
        },
      } : {}),
    })

    return ok()
  },
}
