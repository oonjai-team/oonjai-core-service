import { type Endpoint, ok, unauthorized } from "@http/HttpContext"
import type { VerificationService } from "@serv/VerificationService"

export const getPendingVerifications: Endpoint<[VerificationService]> = {
  method: "GET",
  path: "/verifications/pending",
  handler: async (ctx, [service], session) => {
    const user = session?.getUser()
    if (!user) return unauthorized("User must be logged in")
    if (!user.isAdmin()) return { status: 403, body: { message: "Only admins can view pending verifications" } }

    const verifications = await service.getPendingVerifications()
    return ok(verifications.map((v) => v.toDTO()))
  },
}
