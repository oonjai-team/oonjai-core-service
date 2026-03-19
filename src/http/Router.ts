import type {Endpoint, HttpContext, HttpResult, IService, Method} from "@http/HttpContext"
import type {ISessionService} from "@serv/ISessionService"
import {Session} from "@entity/Session"
import {internalError, notFound} from "@http/HttpContext"

interface Route {
  method: Method
  segments: string[]
  invoke: (ctx: HttpContext, session: Session | null) => Promise<HttpResult>
}

export class Router {
  private routes: Route[] = []

  constructor(private sessionService: ISessionService) {}

  public route(endpoint: Endpoint, services: IService[]): this {
    const segments = endpoint.path.split("/").filter(Boolean)
    this.routes.push({
      method: endpoint.method,
      segments,
      invoke: (ctx, session) => endpoint.handler(ctx, services, session),
    })
    return this
  }

  public async dispatch(method: string, pathname: string, ctx: HttpContext): Promise<HttpResult> {
    const incoming = pathname.split("/").filter(Boolean)

    // Resolve session: prefer Authorization header, fall back to access_token cookie
    const rawToken =
      ctx.headers["authorization"]?.replace(/^Bearer\s+/i, "") ??
      ctx.cookies["access_token"] ??
      null
    const session = rawToken ? await this.sessionService.resolveSession(rawToken) : null

    for (const route of this.routes) {
      if (route.method !== method) continue
      if (route.segments.length !== incoming.length) continue

      const params: Record<string, string> = {}
      let matched = true

      for (let i = 0; i < route.segments.length; i++) {
        const seg = route.segments[i]!
        const inc = incoming[i]!
        if (seg.startsWith(":")) {
          params[seg.slice(1)] = inc
        } else if (seg !== inc) {
          matched = false
          break
        }
      }

      if (!matched) continue

      try {
        return await route.invoke({...ctx, params}, session)
      } catch (err) {
        const message = err instanceof Error ? err.message : "internal server error"
        return internalError(message)
      }
    }

    return notFound()
  }
}
