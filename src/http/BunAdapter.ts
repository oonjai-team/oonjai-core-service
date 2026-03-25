import type {Router} from "@http/Router"

export interface BunAdapterOptions {
  port?: number
  hostname?: string
  /** Allowed CORS origins. Defaults to "*" for local development. */
  allowedOrigins?: string[]
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

export function serveBun(router: Router, options: BunAdapterOptions = {}): void {
  const {port = 3000, hostname = "0.0.0.0", allowedOrigins = ["*"]} = options

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

      let body: unknown = undefined
      const contentType = req.headers.get("content-type") ?? ""
      if (contentType.includes("application/json") && req.body) {
        try {
          body = await req.json()
        } catch {
          body = undefined
        }
      }

      const result = await router.dispatch(req.method, url.pathname, {query, headers, body, params: {}})

      const responseHeaders = new Headers(cors)
      let responseBody: string | null = null

      if (result.status !== 204 && result.body !== undefined) {
        responseHeaders.set("Content-Type", "application/json")
        responseBody = JSON.stringify(result.body)
      }

      return new Response(responseBody, {
        status: result.status,
        headers: responseHeaders,
      })
    },
  })

  console.log(`Server running on http://${hostname}:${port}`)
}
