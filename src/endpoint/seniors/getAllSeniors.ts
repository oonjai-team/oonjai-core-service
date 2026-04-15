import {type Endpoint, unauthorized} from "@http/HttpContext"
import {ok} from "@http/HttpContext"
import type {SeniorManagementService} from "@serv/SeniorManagementService"
import {UUID} from "@type/uuid"

export const getAllSeniors: Endpoint<[SeniorManagementService]> = {
  method: "GET",
  path: "/users/seniors",
  handler: async (ctx, [service], session) => {
    const user = session?.getUser()

    if (!user) {
      return unauthorized()
    }

    const seniors = await service.getAllSeniorsFromUser(new UUID(user.getId()))
    return ok(seniors.map(s => s.toDTO()))
  },
}
