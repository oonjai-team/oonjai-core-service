import type {Endpoint} from "@http/HttpContext"
import {badRequest, created} from "@http/HttpContext"
import type {AuthService} from "@serv/AuthService"
import {RoleEnum} from "@type/user"
import type {CareTakerUserAttributes} from "@entity/UserDTO"

export const register: Endpoint<[AuthService]> = {
  method: "POST",
  path: "/auth/register",
  handler: async (ctx, [service], session) => {

    if (session) {
      return badRequest("session already exists")
    }

    const body = ctx.body as Record<string, unknown>

    if (!body?.email || !body?.firstname || !body?.lastname || !body?.role) {
      return badRequest("email, firstname, lastname and role are required")
    }

    if (!Object.values(RoleEnum).includes(body.role as RoleEnum)) {
      return badRequest(`role must be one of: ${Object.values(RoleEnum).join(", ")}`)
    }

    let caretakerAttr: CareTakerUserAttributes | undefined

    if (body.role === RoleEnum.CARETAKER) {
      const required = ["bio", "specialization", "hourlyRate", "currency", "experience", "contactInfo", "permission"]
      const missing = required.filter((k) => body[k] === undefined || body[k] === null)
      if (missing.length > 0) {
        return badRequest(`caretaker registration requires: ${missing.join(", ")}`)
      }

      caretakerAttr = {
        bio: body.bio as string,
        specialization: body.specialization as string,
        hourlyRate: body.hourlyRate as number,
        currency: body.currency as string,
        experience: body.experience as number,
        contactInfo: body.contactInfo as string,
        permission: body.permission as string,
        rating: 0,
        reviewCount: 0,
        isVerified: false,
        isAvailable: true,
      }
    }

    const user = await service.register(
      body.email as string,
      body.oauthToken as string,
      body.firstname as string,
      body.lastname as string,
      body.role as RoleEnum,
      caretakerAttr
    )

    return created(user.toDTO())
  },
}
