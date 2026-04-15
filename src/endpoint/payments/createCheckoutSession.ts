import {type Endpoint, badRequest, created, unauthorized} from "@http/HttpContext"
import type {PaymentService} from "@serv/PaymentService"
import {PaymentMethod} from "@type/payment"

export const createCheckoutSession: Endpoint<[PaymentService]> = {
  method: "POST",
  path: "/payments/checkout-session",
  handler: async (ctx, [service], session) => {
    const user = session?.getUser()
    if (!user) return unauthorized()

    const body = ctx.body as Record<string, unknown>
    if (!body) return badRequest("request body is required")

    const {bookingId, amount, currency, method} = body as {
      bookingId?: string
      amount?: number
      currency?: string
      method?: string
    }

    if (!bookingId) return badRequest("bookingId is required")
    if (typeof amount !== "number" || amount <= 0) {
      return badRequest("amount must be a positive number")
    }
    if (!currency) return badRequest("currency is required")
    if (!method || !Object.values(PaymentMethod).includes(method as PaymentMethod)) {
      return badRequest(`method must be one of: ${Object.values(PaymentMethod).join(", ")}`)
    }

    try {
      const result = await service.createCheckoutSession(
        bookingId,
        amount,
        currency,
        method as PaymentMethod,
      )

      const dto = result.payment.toDTO()
      return created({
        paymentId: dto.id,
        checkoutSessionId: dto.checkoutSessionId,
        checkoutUrl: result.checkoutUrl,
        amount: dto.amount,
        currency: dto.currency,
        method: dto.method,
        status: dto.status,
      })
    } catch (err: unknown) {
      const message = (err as Error).message
      if (message.startsWith("NOT_FOUND")) return {status: 404, body: {message}}
      throw err
    }
  },
}
