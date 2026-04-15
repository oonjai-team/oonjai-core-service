import { type Endpoint, badRequest, created, unauthorized } from "@http/HttpContext"
import type { VerificationService } from "@serv/VerificationService"
import { UploaderType } from "@type/verification"
import { UUID } from "@type/uuid"

export const createVerification: Endpoint<[VerificationService]> = {
  method: "POST",
  path: "/verifications",
  handler: async (ctx, [service], session) => {
    const user = session?.getUser()
    if (!user) return unauthorized("User must be logged in")
    if (!user.isCaretaker()) return { status: 403, body: { message: "Only caretakers can upload verification documents" } }

    const body = ctx.body as Record<string, unknown>
    if (!body?.docType || !body?.docFileRef || !body?.uploaderType) {
      return badRequest("docType, docFileRef, and uploaderType are required")
    }

    const uploaderTypeValues = Object.values(UploaderType) as string[]
    if (!uploaderTypeValues.includes(body.uploaderType as string)) {
      return badRequest(`uploaderType must be one of: ${uploaderTypeValues.join(", ")}`)
    }

    const userId = user.getId()
    if (!userId) return unauthorized("Invalid session")

    try {
      const verification = await service.createVerification(
        new UUID(userId.toString()),
        new UUID(userId.toString()),
        body.uploaderType as UploaderType,
        body.docType as string,
        body.docFileRef as string
      )
      return created(verification.toDTO())
    } catch (err: unknown) {
      const message = (err as Error).message
      if (message.startsWith("INVALID_DOC_TYPE")) return badRequest(message)
      throw err
    }
  },
}
