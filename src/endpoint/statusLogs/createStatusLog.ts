import {type Endpoint, unauthorized, badRequest, created} from "@http/HttpContext"
import type {StatusLogService} from "@serv/StatusLogService"
import {UUID} from "@type/uuid"
import {CareSessionStatus} from "@type/careSession"

export const createStatusLog: Endpoint<[StatusLogService]> = {
method: "POST",
path: "/bookings/:bookingId/status",
handler: async (ctx, [service], session) => {
    const user = session?.getUser()
    if (!user) {
      return unauthorized("User must be logged in")
    }


    // TODO
    // A only caretaker can create status log
    // Checking if the booking is related to the caretaker or not

    const body = ctx.body as Record<string, unknown>
    if (!body?.statusType || !body?.notes) {
      return badRequest("statusType and notes are required")
    }

    const bookingId = ctx.params?.bookingId as string

    try {
      const log = await service.createStatusLog(
        bookingId,
        new UUID(user.getId()),
        body.statusType as CareSessionStatus,
        body.notes as string,
        body.photoUrl as string | undefined
)
return created(log.toDTO())
    } catch (err: unknown) {
      const message = (err as Error).message
      if (message.startsWith("FORBIDDEN")) return { status: 403, body: { message } }
      if (message.startsWith("INVALID_STATUS")) return badRequest(message)
      throw err
    }
  },
}