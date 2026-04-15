import {type Endpoint, unauthorized, ok} from "@http/HttpContext"
import {RoleEnum} from "@type/user"
import {UUID} from "@type/uuid"
import type {UserService} from "@serv/UserService"
import type {CareTakerUserAttributes} from "@entity/UserDTO"

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
    await service.updateUser(new UUID(user.getId()!.toString()), {caretaker: body as Partial<CareTakerUserAttributes>})

    return ok({message: "profile updated"})
  },
}