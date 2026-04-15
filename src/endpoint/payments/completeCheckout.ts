import {type Endpoint, badRequest, redirectTo} from "@http/HttpContext"
import type {PaymentService} from "@serv/PaymentService"

/**
 * GET /payments/complete?session=xxx
 *
 * Called when the simulated payment gateway redirects back after successful payment.
 * Marks payment as PAID, bookings as CONFIRMED, then 302-redirects to the
 * frontend confirmation page.
 */
export const completeCheckout: Endpoint<[PaymentService]> = {
  method: "GET",
  path: "/payments/complete",
  handler: async (ctx, [service]) => {
    const sessionId = ctx.query["session"]
    if (!sessionId) return badRequest("session query parameter is required")

    try {
      const result = await service.completeCheckout(sessionId)
      return redirectTo(result.redirectUrl)
    } catch (err: unknown) {
      const message = (err as Error).message
      if (message.startsWith("NOT_FOUND")) return badRequest("Invalid or expired checkout session")
      if (message.startsWith("CONFLICT")) return redirectTo(
        (process.env["FRONTEND_URL"] ?? "http://localhost:3000") + "/activities?error=already_paid"
      )
      throw err
    }
  },
}
