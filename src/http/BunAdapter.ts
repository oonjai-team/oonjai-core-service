import type {Router} from "@http/Router"

export interface BunAdapterOptions {
  port?: number
  hostname?: string
}

export function serveBun(router: Router, options: BunAdapterOptions = {}): void {
  const {port = 3000, hostname = "0.0.0.0"} = options

  Bun.serve({
    port,
    hostname,
    async fetch(req: Request): Promise<Response> {
      const url = new URL(req.url)

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

      const result = await router.dispatch(req.method, url.pathname, {query, headers, body})

      return new Response(
        result.body !== undefined ? JSON.stringify(result.body) : null,
        {
          status: result.status,
          headers: {"Content-Type": "application/json"},
        }
      )
    },
  })

  console.log(`Server running on http://${hostname}:${port}`)
}
