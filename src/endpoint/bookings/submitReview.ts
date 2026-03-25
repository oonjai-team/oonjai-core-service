import {type Endpoint, badRequest, notFound, created, unauthorized} from "@http/HttpContext"
import type {BookingService} from "@serv/BookingService"

export const submitReview: Endpoint<[BookingService]> = {
  method: "POST",
  path: "/bookings/:bookingId/review",
  handler: async (ctx, [service], session) => {
    const user = session?.getUser()
    if (!user) {
      return unauthorized("User must be logged in")
    }
    if (!user.isAdultChild()) {
      return {status: 403, body: {message: "Only adult_child users can submit reviews"}}
    }

    const bookingId = ctx.params.bookingId as string
    const body = ctx.body as Record<string, unknown>

    if (!body?.rating || !body?.comment || !body?.reviewType) {
      return badRequest("rating, comment and reviewType are required")
    }

    const rating = Number(body.rating)
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return badRequest("rating must be a number between 1 and 5")
    }

    try {
      const review = service.submitReview(
        bookingId,
        rating,
        body.comment as string,
        body.reviewType as string
      )
      return created(review)
    } catch (err: unknown) {
      const message = (err as Error).message
      if (message.startsWith("NOT_FOUND")) return notFound("booking not found")
      if (message.startsWith("CONFLICT")) return {status: 409, body: {message}}
      throw err
    }
  },
}
