import {type Endpoint, ok, notFound, unauthorized} from "@http/HttpContext"
import type {ActivityService} from "@serv/ActivityService"
import type {SeniorManagementService} from "@serv/SeniorManagementService"
import {OllamaService} from "@serv/OllamaService"
import type {IPrecautionCacheRepository} from "@repo/IPrecautionCacheRepository"
import type {IService} from "@serv/IService"
import {UUID} from "@type/uuid"

class PrecautionCacheRepoService implements IService {
  constructor(public repo: IPrecautionCacheRepository) {}
  getServiceId(): string { return "PrecautionCacheRepoService" }
}

export const makePrecautionCacheRepoService = (repo: IPrecautionCacheRepository) =>
  new PrecautionCacheRepoService(repo)

export const getActivityPrecautions: Endpoint<[ActivityService, SeniorManagementService, OllamaService, PrecautionCacheRepoService]> = {
  method: "GET",
  path: "/activities/:activityId/precautions",
  handler: async (ctx, [activityService, seniorService, ollamaService, cacheSvc], session) => {
    const user = session?.getUser()
    if (!user) return unauthorized()

    const {activityId} = ctx.params
    const activity = await activityService.getActivityById(activityId!)
    if (!activity) return notFound("Activity not found")

    const userId = user.getId()!.toString()
    const seniors = await seniorService.getAllSeniorsFromUser(new UUID(userId))
    if (seniors.length === 0) {
      return ok({precautions: []})
    }

    const signature = OllamaService.buildSignature(seniors)
    const cacheRepo = cacheSvc.repo

    const cached = await cacheRepo.findByActivityAndUser(activityId!, userId)
    if (cached && cached.signature === signature) {
      return ok({precautions: cached.result, cached: true})
    }

    const precautions = await ollamaService.generateActivityPrecautions(activity, seniors)

    try {
      await cacheRepo.upsert(activityId!, userId, signature, precautions)
    } catch (err) {
      console.error("[getActivityPrecautions] cache upsert failed:", err)
    }

    return ok({precautions, cached: false})
  },
}
