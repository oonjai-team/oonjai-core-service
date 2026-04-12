import {type Endpoint, ok, notFound} from "@http/HttpContext"
import type {ActivityService} from "@serv/ActivityService"

export const getActivityById: Endpoint<[ActivityService]> = {
  method: "GET",
  path: "/activities/:activityId",
  handler: async (ctx, [service]) => {
    const {activityId} = ctx.params
    const activity = service.getActivityById(activityId)
    if (!activity) {
      return notFound("Activity not found")
    }
    return ok(activity.toDTO())
  },
}
