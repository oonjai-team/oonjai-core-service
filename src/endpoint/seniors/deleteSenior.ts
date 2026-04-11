import {type Endpoint, unauthorized, notFound, forbidden, noContent, ok} from "@http/HttpContext"
import type {SeniorManagementService} from "@serv/SeniorManagementService"
import {UUID} from "@type/uuid"

export const deleteSenior: Endpoint<[SeniorManagementService]> = {
  method: "DELETE",
  path: "/users/seniors/:seniorId",
  handler: async (ctx, [service], session) => {
    const user = session?.getUser()

    if (!user) {
      return unauthorized("User must be logged in")
    }

    const seniorIdParam = ctx.params?.seniorId
    if (!seniorIdParam || typeof seniorIdParam !== "string") {
      return notFound("Senior not found")
    }

    const adultChildId = new UUID(user.getId())
    const seniorId = new UUID(seniorIdParam)

    try {
      service.removeSeniorFromAdultChild(adultChildId, seniorId)
      
      // Attempt to use noContent, fallback to ok() with no body if not available
      return typeof noContent === "function" ? noContent() : ok()
    } catch (error: any) {
      if (error.message === "senior not found") {
        return notFound("Senior not found")
      }
      if (error.message === "senior does not belong to this adult child") {
        return forbidden("Senior does not belong to this adult child")
      }
      
      // Re-throw any unexpected errors to be caught by a global error handler
      throw error 
    }
  },
}