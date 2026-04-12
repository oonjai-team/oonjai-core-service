import type {CookieOptions} from "@http/HttpContext"
import type {Router} from "@http/Router"
import {join} from "path"

export interface BunAdapterOptions {
  port?: number
  hostname?: string
  /** Allowed CORS origins. Defaults to "*" for local development. */
  allowedOrigins?: string[]
  /** Path to an HTML file served at GET /debug when DEBUG env is set. Defaults to ./debug/index.html */
  debugHtml?: string
  /** Port for the debug UI server. Defaults to main port + 1. Only used when DEBUG env is set. */
  debugPort?: number
}

const CORS_HEADERS = (origin: string, allowed: string[]): Record<string, string> => {
  const allowedOrigin = allowed.includes("*") || allowed.includes(origin) ? origin : allowed[0] ?? "*"
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  }
}

/** Parse the Cookie request header into a key/value map. */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {}
  for (const pair of cookieHeader.split(";")) {
    const eqIdx = pair.indexOf("=")
    if (eqIdx === -1) continue
    const name  = pair.slice(0, eqIdx).trim()
    const value = pair.slice(eqIdx + 1).trim()
    if (name) cookies[name] = decodeURIComponent(value)
  }
  return cookies
}

/** Serialize a CookieOptions object into a Set-Cookie header string. */
function serializeCookie(opt: CookieOptions): string {
  let header = `${opt.name}=${encodeURIComponent(opt.value)}`
  if (opt.path)               header += `; Path=${opt.path}`
  if (opt.maxAge !== undefined) header += `; Max-Age=${opt.maxAge}`
  if (opt.httpOnly)           header += `; HttpOnly`
  if (opt.secure)             header += `; Secure`
  if (opt.sameSite)           header += `; SameSite=${opt.sameSite}`
  return header
}

export function serveBun(router: Router, options: BunAdapterOptions = {}): void {
  const {port = 3000, hostname = "0.0.0.0", allowedOrigins = ["*"], debugHtml = "./debug/index.html", debugPort} = options
  const debugEnabled = Boolean(process.env["DEBUG"])
  const resolvedDebugPort = debugPort ?? port + 1

  Bun.serve({
    port,
    hostname,
    async fetch(req: Request): Promise<Response> {
      const url = new URL(req.url)
      const origin = req.headers.get("origin") ?? "*"
      const cors = CORS_HEADERS(origin, allowedOrigins)

      // Handle CORS preflight
      if (req.method === "OPTIONS") {
        return new Response(null, {status: 204, headers: cors})
      }

      const query: Record<string, string> = {}
      url.searchParams.forEach((value, key) => {
        query[key] = value
      })

      const headers: Record<string, string> = {}
      req.headers.forEach((value, key) => {
        headers[key] = value
      })

      // Parse cookies from the Cookie request header
      const cookies = parseCookies(req.headers.get("cookie") ?? "")

      let body: unknown = undefined
      const reqContentType = req.headers.get("content-type") ?? ""
      if (reqContentType.includes("application/json") && req.body) {
        try {
          body = await req.json()
        } catch {
          body = undefined
        }
      }

      const result = await router.dispatch(req.method, url.pathname, {query, headers, cookies, body, params: {}})

      // Build Set-Cookie headers — use Headers.append so multiple cookies are sent correctly
      const responseHeaders = new Headers(cors)
      for (const cookieOpt of result.cookies ?? []) {
        responseHeaders.append("Set-Cookie", serializeCookie(cookieOpt))
      }

      if (result.redirect) {
        responseHeaders.set("Location", result.redirect)
        return new Response(null, {status: result.status, headers: responseHeaders})
      }

      const resContentType = result.contentType ?? "application/json"
      responseHeaders.set("Content-Type", resContentType)

      const responseBody =
        result.body !== undefined
          ? resContentType.startsWith("text/") ? (result.body as string) : JSON.stringify(result.body)
          : null

      return new Response(responseBody, {status: result.status, headers: responseHeaders})
    },
  })

  const baseUrl = `http://localhost:${port}`
  console.log(`Server running on ${baseUrl}`)

  if (debugEnabled) {
    Bun.serve({
      port: resolvedDebugPort,
      hostname,
      async fetch(req: Request): Promise<Response> {
        const url = new URL(req.url)
        if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/debug")) {
          const file = Bun.file(join(process.cwd(), debugHtml))
          const html = await file.text()
          return new Response(html, {status: 200, headers: {"Content-Type": "text/html"}})
        }
        return new Response(null, {status: 404})
      },
    })

    const debugUrl = `http://localhost:${resolvedDebugPort}`
    console.log(`Debug UI available at ${debugUrl}`)
    Bun.spawn(["open", debugUrl])
  }
}
