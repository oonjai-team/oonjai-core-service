import {type Endpoint, unauthorized, ok} from "@http/HttpContext"
import {RoleEnum} from "@type/user"
import {UUID} from "@type/uuid"
import type {UserService} from "@serv/UserService"

export const updateCaretakerProfile: Endpoint<[UserService]> = {
method: "PUT",
path: "/caretakers/profile",
handler: async (ctx, [service], session) => {
    const user = session?.getUser()
    if (!user) {
      return unauthorized("User must be logged in")
    }


    if (!user.isCaretaker()) {
      return { status: 403, body: { message: "Only caretakers can update a caretaker profile" } }
    }

    const body = ctx.body as Record<string, unknown>
    service.updateUser(new UUID(user.getId() as string), body)

    return ok({message: "profile updated"})
  },
}