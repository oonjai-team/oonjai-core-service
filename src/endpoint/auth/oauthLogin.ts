import type {Endpoint} from "@http/HttpContext"
import {badRequest, redirectTo} from "@http/HttpContext"
import type {OAuthRegistry} from "@serv/oauth/OAuthRegistry"


/** Parse and validate the ALLOWED_REDIRECT_URLS env var (comma-separated URLs). */
function getAllowedRedirectUrls(): string[] {
  return (process.env["ALLOWED_REDIRECT_URLS"] ?? "")
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean)
}

export const oauthLogin: Endpoint<[OAuthRegistry]> = {
  method: "GET",
  path: "/auth/oauth",
  handler: async (ctx, [reg], _session) => {
    const {provider, redirect_url} = ctx.query

    // ── Validate provider ────────────────────────────────────────────────────
    if (!provider) {
      return badRequest("provider query param is required")
    }
    if (!reg.isProviderSupported(provider)) {
      return badRequest(`unsupported provider "${provider}". Supported: ${reg.getSupportedProviders()}`)
    }

    // ── Validate redirect_url against allowlist ──────────────────────────────
    let validatedRedirectUrl: string | undefined
    if (redirect_url) {
      const allowed = getAllowedRedirectUrls()
      if (allowed.length > 0 && !allowed.some((a) => {
        const aURL = new URL(a)
        const tURL = new URL(redirect_url)
        return aURL.origin === tURL.origin && aURL.protocol ===  tURL.protocol
      })) {
        return badRequest("redirect_url is not in the allowed list")
      }
      validatedRedirectUrl = redirect_url
    }

    const serv = await reg.getServiceFromProvider(provider)
    if (!serv) {
      return badRequest(`unsupported provider "${provider}". Supported: ${reg.getSupportedProviders()}`)
    }

    const authUrl = await serv.buildAuthUrl(validatedRedirectUrl)
    return redirectTo(authUrl)
  },
}
