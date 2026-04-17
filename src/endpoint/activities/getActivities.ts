import {type Endpoint, ok} from "@http/HttpContext"
import type {ActivityService} from "@serv/ActivityService"
import type {ActivityFilter} from "@repo/IActivityRepository"

const MAX_LIMIT = 100

export const getActivities: Endpoint<[ActivityService]> = {
  method: "GET",
  path: "/activities",
  handler: async (ctx, [service]) => {
    const q = ctx.query as Record<string, string>

    const filter: ActivityFilter = {}
    if (q.search) filter.search = q.search
    if (q.category) filter.category = q.category
    if (q.location) filter.location = q.location
    if (q.priceMin !== undefined && q.priceMin !== "") {
      const n = Number(q.priceMin)
      if (Number.isFinite(n)) filter.priceMin = n
    }
    if (q.priceMax !== undefined && q.priceMax !== "") {
      const n = Number(q.priceMax)
      if (Number.isFinite(n)) filter.priceMax = n
    }
    if (q.limit !== undefined && q.limit !== "") {
      const n = Number(q.limit)
      if (Number.isFinite(n) && n > 0) filter.limit = Math.min(MAX_LIMIT, Math.floor(n))
    }
    if (q.offset !== undefined && q.offset !== "") {
      const n = Number(q.offset)
      if (Number.isFinite(n) && n >= 0) filter.offset = Math.floor(n)
    }

    const hasFilter = Object.keys(filter).length > 0
    if (!hasFilter) {
      const all = await service.getAllActivities()
      return ok({
        activities: all.map(a => a.toDTO()),
        total: all.length,
      })
    }

    const [activities, total] = await Promise.all([
      service.findActivities(filter),
      service.countActivities(filter),
    ])
    return ok({
      activities: activities.map(a => a.toDTO()),
      total,
    })
  },
}
