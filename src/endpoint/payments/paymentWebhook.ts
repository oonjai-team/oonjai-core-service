import {type Endpoint, badRequest, notFound, ok} from "@http/HttpContext"
import type {PaymentService} from "@serv/PaymentService"

export const paymentWebhook: Endpoint<[PaymentService]> = {
  method: "POST",
  path: "/payments/webhook",
  handler: async (ctx, [service], _session) => {
    const secret = ctx.headers["x-webhook-secret"]
    const expectedSecret = process.env["WEBHOOK_SECRET"]

    if (!secret || !expectedSecret || secret !== expectedSecret) {
      return badRequest("missing or invalid webhook secret")
    }

    const body = ctx.body as Record<string, unknown>
    if (!body?.transactionRef || !body?.paidAt) {
      return badRequest("transactionRef and paidAt are required")
    }

    try {
      const payment = service.handleWebhook(
        body.transactionRef as string,
        body.paidAt as string,
      )
      return ok(payment.toDTO())
    } catch (err: unknown) {
      const message = (err as Error).message
      if (message.startsWith("NOT_FOUND")) return notFound(message)
      if (message.startsWith("CONFLICT")) return {status: 409, body: {message}}
      throw err
    }
  },
}
