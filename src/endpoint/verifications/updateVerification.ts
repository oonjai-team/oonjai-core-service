import { type Endpoint, badRequest, ok, unauthorized } from "@http/HttpContext"
import type { VerificationService } from "@serv/VerificationService"
import { UUID } from "@type/uuid"

export const updateVerification: Endpoint<[VerificationService]> = {
  method: "PUT",
  path: "/verifications/:verificationId",
  handler: async (ctx, [service], session) => {
    const user = session?.getUser()
    if (!user) return unauthorized("User must be logged in")
    if (!user.isAdmin()) return { status: 403, body: { message: "Only admins can approve or reject verifications" } }

    const { verificationId } = ctx.params
    const body = ctx.body as Record<string, unknown>

    if (!body?.status) return badRequest("status is required")
    if (body.status !== "verified" && body.status !== "rejected") {
      return badRequest("status must be 'verified' or 'rejected'")
    }
    if (body.status === "rejected" && !body.reason) {
      return badRequest("reason is required when rejecting a verification")
    }

    const adminId = user.getId()
    if (!adminId) return unauthorized("Invalid session")

    try {
      let verification
      if (body.status === "verified") {
        verification = service.approveVerification(new UUID(verificationId), new UUID(adminId.toString()))
      } else {
        verification = service.rejectVerification(
          new UUID(verificationId),
          new UUID(adminId.toString()),
          body.reason as string
        )
      }
      return ok(verification.toDTO())
    } catch (err: unknown) {
      const message = (err as Error).message
      if (message.startsWith("NOT_FOUND")) return { status: 404, body: { message } }
      throw err
    }
  },
}
