import type {Endpoint} from "@http/HttpContext"
import {ok} from "@http/HttpContext"
import type {SeniorManagementService} from "@serv/SeniorManagementService"
import {UUID} from "@type/uuid"

export const getAllSeniors: Endpoint<[SeniorManagementService]> = {
  method: "GET",
  path: "/users/:adultChildId/seniors",
  handler: async (ctx, [service]) => {
    const seniors = service.getAllSeniorsFromUser(new UUID(ctx.params.adultChildId!))
    return ok(seniors.map(s => s.toDTO()))
  },
}
