import {type Endpoint, notFound, ok, unauthorized} from "@http/HttpContext"
import type {PaymentService} from "@serv/PaymentService"
import {UUID} from "@type/uuid"

export const getPaymentStatus: Endpoint<[PaymentService]> = {
  method: "GET",
  path: "/bookings/:bookingId/payment",
  handler: async (ctx, [service], session) => {
    const user = session?.getUser()
    if (!user) return unauthorized()

    try {
      const payment = await service.getPaymentStatus(
        ctx.params["bookingId"] as string,
        new UUID(user.getId()),
      )
      return ok(payment.toDTO())
    } catch (err: unknown) {
      const message = (err as Error).message
      if (message.startsWith("NOT_FOUND")) return notFound(message)
      if (message.startsWith("FORBIDDEN")) return {status: 403, body: {message}}
      throw err
    }
  },
}
