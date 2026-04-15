import type {IPrecautionCacheRepository, PrecautionCacheEntry} from "@repo/IPrecautionCacheRepository"
import type {SeniorPrecaution} from "@serv/OllamaService"
import sql from "../lib/postgres"

export class PgPrecautionCacheRepository implements IPrecautionCacheRepository {

  async findByActivityAndUser(activityId: string, userId: string): Promise<PrecautionCacheEntry | undefined> {
    const rows = await sql`
      SELECT "ActivityID", "UserID", "Signature", "Result", "CreatedDate"
      FROM "ACTIVITY_PRECAUTION_CACHE"
      WHERE "ActivityID" = ${activityId} AND "UserID" = ${userId}
    `
    const row = rows[0]
    if (!row) return undefined
    const raw = row.Result
    const result: SeniorPrecaution[] = Array.isArray(raw)
      ? (raw as SeniorPrecaution[])
      : typeof raw === "string"
        ? (JSON.parse(raw) as SeniorPrecaution[])
        : []
    return {
      activityId: row.ActivityID,
      userId: row.UserID,
      signature: row.Signature,
      result,
      createdAt: new Date(row.CreatedDate),
    }
  }

  async upsert(activityId: string, userId: string, signature: string, result: SeniorPrecaution[]): Promise<void> {
    const json = JSON.stringify(result)
    await sql`
      INSERT INTO "ACTIVITY_PRECAUTION_CACHE" ("ActivityID", "UserID", "Signature", "Result", "CreatedDate")
      VALUES (${activityId}, ${userId}, ${signature}, ${json}::jsonb, NOW())
      ON CONFLICT ("ActivityID", "UserID") DO UPDATE
        SET "Signature" = EXCLUDED."Signature",
            "Result" = EXCLUDED."Result",
            "CreatedDate" = NOW()
    `
  }
}
