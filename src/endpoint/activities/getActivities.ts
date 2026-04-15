import {type Endpoint, ok} from "@http/HttpContext"
import type {ActivityService} from "@serv/ActivityService"

export const getActivities: Endpoint<[ActivityService]> = {
  method: "GET",
  path: "/activities",
  handler: async (_ctx, [service]) => {
    const activities = await service.getAllActivities()
    return ok(activities.map(a => a.toDTO()))
  },
}
