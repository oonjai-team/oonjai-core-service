import {type Endpoint, internalError, redirectTo, sessionCookies, withCookies} from "@http/HttpContext"
import type {AuthService} from "@serv/AuthService"
import {RoleEnum} from "@type/user"
import type {OAuthRegistry} from "@serv/oauth/OAuthRegistry"

export const oauthCallback: Endpoint<[OAuthRegistry, AuthService]> = {
  method: "GET",
  path: "/auth/oauth/callback",
  handler: async (ctx, [reg, authService], _session) => {
    const {code, state, error} = ctx.query

    if (error) {
      return internalError()
    }

    if (!code || !state) {
      return internalError("missing_code_or_state")
    }

    // Validate state and recover the redirect_url the client originally supplied
    const result = await reg.getServiceFromState(state)
    if (!result) {
      return internalError("invalid_state")
    }

    const [validation, serv] = result

    try {
      const token = await serv.exchangeCodeForToken(code)
      const profile = await serv.getUserProfile(token)

      // Synthesize a local email from the LINE userId (LINE does not expose email by default)
      let email = profile.email

      // Find existing user or create a new one on first login
      let sessionToken
      try {
        sessionToken = await authService.login(email)
      } catch {
        await authService.register(
          email,
          token.access_token,
          profile.firstname,
          profile.lastname,
          RoleEnum.ADULTCHILD
        )
        sessionToken = await authService.login(email)
      }

      // Redirect to the URL requested by the client, or fall back to FRONTEND_URL env var
      const destination = validation.redirectUrl ?? process.env["FRONTEND_URL"] ?? "http://localhost:3000"

      return withCookies(
        sessionCookies(sessionToken.accessToken, sessionToken.refreshToken),
        redirectTo(destination)
      )
    } catch(e) {
      console.error("[oauthCallback] authentication failed:", e)
      const msg = e instanceof Error ? e.message : "auth error"
      return internalError(`auth error: ${msg}`)
    }
  },
}
