import {type Endpoint, ok, unauthorized} from "@http/HttpContext"
import type {UserService} from "@serv/UserService"

export const me: Endpoint<[UserService]> = {
  method: "GET",
  path: "/users/me",
  handler: async (ctx, services, session) => {
    if (!session) {
      return unauthorized("unauthorised")
    }

    const userDTO = session.getUser().toDTO()
    return ok(userDTO)
  }
}