import type {Endpoint, HttpContext, HttpResult, Method} from "@http/HttpContext"
import {internalError, notFound} from "@http/HttpContext"
import type {IService} from "@serv/IService"

interface Route {
  method: Method
  segments: string[]
  invoke: (ctx: HttpContext) => Promise<HttpResult>
}

export class Router {
  private routes: Route[] = []

  public route(endpoint: Endpoint, service: IService[]): this {
    const segments = endpoint.path.split("/").filter(Boolean)
    this.routes.push({
      method: endpoint.method,
      segments,
      invoke: (ctx) => endpoint.handler(ctx, service),
    })
    return this
  }

  public async dispatch(method: string, pathname: string, ctx: Omit<HttpContext, "params">): Promise<HttpResult> {
    const incoming = pathname.split("/").filter(Boolean)

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
        return await route.invoke({...ctx, params})
      } catch (err) {
        const message = err instanceof Error ? err.message : "internal server error"
        return internalError(message)
      }
    }

    return notFound()
  }
}
