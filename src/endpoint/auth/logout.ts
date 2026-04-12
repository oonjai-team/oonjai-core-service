import type {Endpoint} from "@http/HttpContext"
import {clearSessionCookies, noContent, unauthorized, withCookies} from "@http/HttpContext"
import type {AuthService} from "@serv/AuthService"

export const logout: Endpoint<[AuthService]> = {
  method: "POST",
  path: "/auth/logout",
  handler: async (_ctx, [service], session) => {
    if (!session) return unauthorized()
    service.logout(session.getToken())
    return withCookies(clearSessionCookies(), noContent())
  },
}
