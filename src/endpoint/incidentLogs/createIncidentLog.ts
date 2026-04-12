import {type Endpoint, unauthorized, badRequest, created} from "@http/HttpContext"
import type {IncidentLogService} from "@serv/IncidentLogService"
import {UUID} from "@type/uuid"

export const createIncidentLog: Endpoint<[IncidentLogService]> = {
  method: "POST",
  path: "/bookings/:bookingId/incidents",
  handler: async (ctx, [service], session) => {
    const user = session?.getUser()
    if (!user) {
      return unauthorized("User must be logged in")
    }

    if (!user.isCaretaker()) {
      return { status: 403, body: { message: "FORBIDDEN: only caretakers can create incident logs" } }
    }

    const body = ctx.body as Record<string, unknown>
    if (!body?.seniorId || !body?.incidentType || !body?.detail) {
      return badRequest("seniorId, incidentType, and detail are required")
    }

    const bookingId = ctx.params?.bookingId as string

    try {
      const log = service.createIncidentLog(
        bookingId,
        new UUID(body.seniorId as string),
        body.incidentType as string,
        body.detail as string
      )
      return created(log.toDTO())
    } catch (err: unknown) {
      const message = (err as Error).message
      if (message.startsWith("FORBIDDEN")) return { status: 403, body: { message } }
      if (message.startsWith("NOT_FOUND")) return { status: 404, body: { message } }
      if (message.startsWith("INVALID_TYPE")) return badRequest(message)
      throw err
    }
  },
}
