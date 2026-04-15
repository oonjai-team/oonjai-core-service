import type {SeniorPrecaution} from "@serv/OllamaService"

export interface PrecautionCacheEntry {
  activityId: string
  userId: string
  signature: string
  result: SeniorPrecaution[]
  createdAt: Date
}

export interface IPrecautionCacheRepository {
  findByActivityAndUser(activityId: string, userId: string): Promise<PrecautionCacheEntry | undefined>
  upsert(activityId: string, userId: string, signature: string, result: SeniorPrecaution[]): Promise<void>
}
