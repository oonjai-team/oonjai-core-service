import {type Endpoint, badRequest, ok, unauthorized} from "@http/HttpContext"
import type {UserService} from "@serv/UserService"
import {UUID} from "@type/uuid"

export const onboarding: Endpoint<[UserService]> = {
  method: "POST",
  path: "/auth/onboarding",
  handler: async (ctx, [userService], session) => {
    const user = session?.getUser()
    if (!user) {
      return unauthorized("User must be logged in to complete onboarding")
    }

    const body = ctx.body as Record<string, unknown>

    if (!body?.phone || !body?.relationship || !body?.goal || !body?.concerns) {
      return badRequest("phone, relationship, goal and concerns are required")
    }

    const concerns = body.concerns as string[]
    if (!Array.isArray(concerns) || concerns.length === 0) {
      return badRequest("concerns must be a non-empty array")
    }

    userService.updateUser(new UUID(session?.getUserId()), {
      phone: body.phone as string,
      adultChild: {
        relationship: body.relationship as string,
        goal: body.goal as string,
        concerns,
      },
    })

    return ok()
  },
}
