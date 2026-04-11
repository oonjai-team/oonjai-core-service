import {type Endpoint, badRequest, created, notFound, unauthorized} from "@http/HttpContext"
import type {PaymentService} from "@serv/PaymentService"
import {PaymentMethod} from "@type/payment"
import {UUID} from "@type/uuid"

export const initiatePayment: Endpoint<[PaymentService]> = {
  method: "POST",
  path: "/bookings/:bookingId/payment",
  handler: async (ctx, [service], session) => {
    const user = session?.getUser()
    if (!user) return unauthorized()

    const body = ctx.body as Record<string, unknown>
    if (!body?.method || !body?.amount || !body?.currency) {
      return badRequest("method, amount and currency are required")
    }

    if (!Object.values(PaymentMethod).includes(body.method as PaymentMethod)) {
      return badRequest(`method must be one of: ${Object.values(PaymentMethod).join(", ")}`)
    }

    if (typeof body.amount !== "number" || body.amount <= 0) {
      return badRequest("amount must be a positive number")
    }

    try {
      const payment = service.initiatePayment(
        ctx.params["bookingId"] as string,
        new UUID(user.getId()),
        body.method as PaymentMethod,
        body.amount as number,
        body.currency as string,
      )

      const dto = payment.toDTO()
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

      return created({
        paymentId: dto.id,
        status: dto.status,
        method: dto.method,
        qrCodeUrl: dto.qrCodeUrl,
        redirectUrl: dto.redirectUrl,
        expiresAt,
      })
    } catch (err: unknown) {
      const message = (err as Error).message
      if (message.startsWith("NOT_FOUND")) return notFound(message)
      if (message.startsWith("FORBIDDEN")) return {status: 403, body: {message}}
      if (message.startsWith("CONFLICT")) return {status: 409, body: {message}}
      if (message.startsWith("BAD_REQUEST")) return badRequest(message)
      throw err
    }
  },
}
