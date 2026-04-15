import {type Endpoint, unauthorized, notFound, ok} from "@http/HttpContext"
import {UUID} from "@type/uuid"
import type {UserService} from "@serv/UserService"

export const getCaretakerById: Endpoint<[UserService]> = {
method: "GET",
path: "/caretakers/:caretakerId",
handler: async (ctx, [service], session) => {
    const user = session?.getUser()
    if (!user) {
      return unauthorized("User must be logged in")
    }

    const caretaker = await service.getUserById(new UUID(ctx.params?.caretakerId as string))
    if (!caretaker) {
      return notFound("caretaker not found")
    }

    return ok(caretaker.toDTO())
  },
}