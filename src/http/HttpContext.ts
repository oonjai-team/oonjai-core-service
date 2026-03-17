import type {IService} from "@serv/IService"

export interface HttpContext {
  params: Record<string, string>
  query: Record<string, string>
  headers: Record<string, string>
  body: unknown
}

export interface HttpResult {
  status: number
  body?: unknown
}

export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export type Handler<S extends IService[] = IService[]> = (ctx: HttpContext, service: S) => Promise<HttpResult>

export type Endpoint<S extends IService[] = IService[]> = {
  method: Method
  path: string
  handler: Handler<S>
}


export const ok = (body?: unknown): HttpResult => ({ status: 200, body })
export const created = (body?: unknown): HttpResult => ({ status: 201, body })
export const noContent = (): HttpResult => ({ status: 204 })
export const notFound = (message = "not found"): HttpResult => ({ status: 404, body: { message } })
export const badRequest = (message = "bad request"): HttpResult => ({ status: 400, body: { message } })
export const internalError = (message = "internal server error"): HttpResult => ({ status: 500, body: { message } })
