import {type Endpoint, unauthorized, badRequest, ok} from "@http/HttpContext"
import type {IncidentLogService} from "@serv/IncidentLogService"
import {UUID} from "@type/uuid"

export const updateIncidentLog: Endpoint<[IncidentLogService]> = {
  method: "PUT",
  path: "/bookings/:bookingId/incidents/:logId",
  handler: async (ctx, [service], session) => {
    const user = session?.getUser()
    if (!user) {
      return unauthorized("User must be logged in")
    }

    if (!user.isCaretaker() && !user.isAdmin()) {
      return { status: 403, body: { message: "FORBIDDEN: only caretakers or admins can update incident logs" } }
    }

    const body = ctx.body as Record<string, unknown>
    if (!body?.status || !body?.detail) {
      return badRequest("status and detail are required")
    }

    const logId = ctx.params?.logId as string

    try {
      const log = await service.updateIncidentLog(
        new UUID(logId),
        body.status as string,
        body.detail as string
      )
      return ok(log.toDTO())
    } catch (err: unknown) {
      const message = (err as Error).message
      if (message.startsWith("NOT_FOUND")) return { status: 404, body: { message } }
      if (message.startsWith("INVALID_STATUS")) return badRequest(message)
      if (message.startsWith("INVALID_TRANSITION")) return badRequest(message)
      throw err
    }
  },
}
