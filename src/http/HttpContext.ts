import type {IService} from "@serv/IService"
import type {Session} from "@entity/Session"

export type {IService}

export interface CookieOptions {
  name: string
  value: string
  httpOnly?: boolean
  secure?: boolean
  sameSite?: "Strict" | "Lax" | "None"
  /** Max-Age in seconds */
  maxAge?: number
  path?: string
}

export interface HttpContext {
  params: Record<string, string>
  query: Record<string, string>
  headers: Record<string, string>
  cookies: Record<string, string>
  body: unknown
}

export interface HttpResult {
  status: number
  body?: unknown
  contentType?: string
  redirect?: string
  cookies?: CookieOptions[]
}

export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export type Handler<S extends IService[] = IService[]> = (
  ctx: HttpContext,
  services: S,
  session: Session | null
) => Promise<HttpResult>

export type Endpoint<S extends IService[] = IService[]> = {
  method: Method
  path: string
  handler: Handler<S>
}

// ── Response helpers ──────────────────────────────────────────────────────────

export const ok = (body?: unknown): HttpResult => ({ status: 200, body })
export const redirectTo = (url: string): HttpResult => ({ status: 302, redirect: url })
export const created = (body?: unknown): HttpResult => ({ status: 201, body })
export const noContent = (): HttpResult => ({ status: 204 })
export const notFound = (message = "not found"): HttpResult => ({ status: 404, body: { message } })
export const badRequest = (message = "bad request"): HttpResult => ({ status: 400, body: { message } })
export const unauthorized = (message = "unauthorized"): HttpResult => ({ status: 401, body: { message } })
export const forbidden = (message = "forbidden"): HttpResult => ({ status: 403, body: { message } })
export const internalError = (message = "internal server error"): HttpResult => ({ status: 500, body: { message } })

/**
 * Attach cookies to any HttpResult.
 * @example
 * return withCookies(sessionCookies(token), redirectTo("/dashboard"))
 */
export const withCookies = (cookies: CookieOptions[], base: HttpResult): HttpResult => ({
  ...base,
  cookies: [...(base.cookies ?? []), ...cookies],
})

/** Build the standard httpOnly access + refresh token cookie pair. */
export const sessionCookies = (accessToken: string, refreshToken: string): CookieOptions[] => [
  {
    name: "access_token",
    value: accessToken,
    httpOnly: true,
    sameSite: "Lax",
    maxAge: 60 * 60,          // 1 hour — mirrors ACCESS_TTL_SECONDS
    path: "/",
  },
  {
    name: "refresh_token",
    value: refreshToken,
    httpOnly: true,
    sameSite: "Lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days — mirrors REFRESH_TTL_SECONDS
    path: "/",
  },
]

/** Expire both session cookies (used on logout). Must mirror the same attributes as sessionCookies so the browser replaces them. */
export const clearSessionCookies = (): CookieOptions[] => [
  { name: "access_token",  value: "", maxAge: 0, path: "/", httpOnly: true, sameSite: "Lax" },
  { name: "refresh_token", value: "", maxAge: 0, path: "/", httpOnly: true, sameSite: "Lax" },
]
