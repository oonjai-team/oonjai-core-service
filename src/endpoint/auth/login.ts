import {type Endpoint, redirectTo, sessionCookies, withCookies} from "@http/HttpContext"
import {badRequest, ok, unauthorized} from "@http/HttpContext"
import type {AuthService} from "@serv/AuthService"

export const login: Endpoint<[AuthService]> = {
  method: "POST",
  path: "/auth/login",
  handler: async (ctx, [service], _session) => {
    const body = ctx.body as Record<string, unknown>

    if (!body?.email) {
      return badRequest("email is required")
    }

    try {
      const token = await service.login(
        body.email as string,
        body.oauthToken as string | undefined
      )

      return withCookies(
        sessionCookies(token.accessToken, token.refreshToken),
        redirectTo("http://localhost:3001/")
      )
    } catch {
      return unauthorized("authentication failed")
    }
  },
}
