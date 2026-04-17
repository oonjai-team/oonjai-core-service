import type {ActivityFilter, IActivityRepository} from "@repo/IActivityRepository"
import {Activity} from "@entity/Activity"
import {UUID} from "@type/uuid"
import {Timestamp} from "@type/timestamp"
import sql from "../lib/postgres"

export class PgActivityRepository implements IActivityRepository {

  async findAll(): Promise<Activity[]> {
    const rows = await sql`SELECT * FROM "ACTIVITY"`
    return rows.map(row => this.toEntity(row))
  }

  async find(filter: ActivityFilter): Promise<Activity[]> {
    const search = filter.search?.trim()
    const category = filter.category?.trim()
    const location = filter.location?.trim()
    const priceMin = filter.priceMin
    const priceMax = filter.priceMax
    const limit = filter.limit
    const offset = filter.offset ?? 0

    const rows = await sql`
      SELECT * FROM "ACTIVITY"
      WHERE 1 = 1
        ${category ? sql`AND LOWER("Category") = LOWER(${category})` : sql``}
        ${location ? sql`AND "Location" ILIKE ${'%' + location + '%'}` : sql``}
        ${priceMin !== undefined ? sql`AND "Price" >= ${priceMin}` : sql``}
        ${priceMax !== undefined ? sql`AND "Price" <= ${priceMax}` : sql``}
        ${search ? sql`AND (
          "Title" ILIKE ${'%' + search + '%'}
          OR "Category" ILIKE ${'%' + search + '%'}
          OR "Host" ILIKE ${'%' + search + '%'}
          OR "Location" ILIKE ${'%' + search + '%'}
          OR "Tags"::text ILIKE ${'%' + search + '%'}
        )` : sql``}
      ORDER BY "StartDate" ASC NULLS LAST, "ActivityID" ASC
      ${limit !== undefined ? sql`LIMIT ${limit}` : sql``}
      ${offset > 0 ? sql`OFFSET ${offset}` : sql``}
    `
    return rows.map(row => this.toEntity(row))
  }

  async count(filter: ActivityFilter): Promise<number> {
    const search = filter.search?.trim()
    const category = filter.category?.trim()
    const location = filter.location?.trim()
    const priceMin = filter.priceMin
    const priceMax = filter.priceMax

    const rows = await sql`
      SELECT COUNT(*)::int AS count FROM "ACTIVITY"
      WHERE 1 = 1
        ${category ? sql`AND LOWER("Category") = LOWER(${category})` : sql``}
        ${location ? sql`AND "Location" ILIKE ${'%' + location + '%'}` : sql``}
        ${priceMin !== undefined ? sql`AND "Price" >= ${priceMin}` : sql``}
        ${priceMax !== undefined ? sql`AND "Price" <= ${priceMax}` : sql``}
        ${search ? sql`AND (
          "Title" ILIKE ${'%' + search + '%'}
          OR "Category" ILIKE ${'%' + search + '%'}
          OR "Host" ILIKE ${'%' + search + '%'}
          OR "Location" ILIKE ${'%' + search + '%'}
          OR "Tags"::text ILIKE ${'%' + search + '%'}
        )` : sql``}
    `
    return Number(rows[0]?.count ?? 0)
  }

  async findById(id: string): Promise<Activity | undefined> {
    const rows = await sql`
      SELECT * FROM "ACTIVITY" WHERE "ActivityID" = ${id}
    `
    const row = rows[0]
    if (!row) return undefined
    return this.toEntity(row)
  }

  async insert(activity: Activity): Promise<string> {
    const dto = activity.toDTO()
    const rows = await sql`
      INSERT INTO "ACTIVITY" (
        "Title", "Category", "Tags", "Host", "HostAvatar", "HostDescription",
        "StartDate", "EndDate", "Location", "Price", "ParticipantCount",
        "Duration", "MaxPeople", "Rating", "Reviews", "Images", "CreatedDate"
      )
      VALUES (
        ${dto.title}, ${dto.category}, ${JSON.stringify(dto.tags)},
        ${dto.host}, ${dto.hostAvatar}, ${dto.hostDescription},
        ${dto.startDate}, ${dto.endDate}, ${dto.location},
        ${dto.price}, ${dto.participantCount}, ${dto.duration},
        ${dto.maxPeople}, ${dto.rating}, ${dto.reviews},
        ${JSON.stringify(dto.images)}, ${new Date(dto.createdAt.getTime())}
      )
      RETURNING "ActivityID"
    `
    return rows[0]!.ActivityID
  }

  async save(activity: Activity): Promise<boolean> {
    const dto = activity.toDTO()
    if (!dto.id) return false
    const result = await sql`
      UPDATE "ACTIVITY"
      SET "Title"            = ${dto.title},
          "Category"         = ${dto.category},
          "Tags"             = ${JSON.stringify(dto.tags)},
          "Host"             = ${dto.host},
          "HostAvatar"       = ${dto.hostAvatar},
          "HostDescription"  = ${dto.hostDescription},
          "StartDate"        = ${dto.startDate},
          "EndDate"          = ${dto.endDate},
          "Location"         = ${dto.location},
          "Price"            = ${dto.price},
          "ParticipantCount" = ${dto.participantCount},
          "Duration"         = ${dto.duration},
          "MaxPeople"        = ${dto.maxPeople},
          "Rating"           = ${dto.rating},
          "Reviews"          = ${dto.reviews},
          "Images"           = ${JSON.stringify(dto.images)}
      WHERE "ActivityID" = ${dto.id}
    `
    return result.count > 0
  }

  async delete(activity: Activity): Promise<void> {
    const id = activity.getId()
    if (!id) throw new Error("cannot delete an activity without an ID")
    await sql`
      DELETE FROM "ACTIVITY" WHERE "ActivityID" = ${id.toString()}
    `
  }

  private toEntity(row: Record<string, any>): Activity {
    return new Activity({
      id: row.ActivityID,
      title: row.Title,
      category: row.Category,
      tags: parseJsonArray(row.Tags),
      host: row.Host,
      hostAvatar: row.HostAvatar,
      hostDescription: row.HostDescription,
      startDate: row.StartDate,
      endDate: row.EndDate,
      displayDate: "",
      location: row.Location,
      price: Number(row.Price),
      participantCount: Number(row.ParticipantCount),
      duration: row.Duration,
      maxPeople: Number(row.MaxPeople),
      rating: Number(row.Rating),
      reviews: Number(row.Reviews),
      images: parseJsonArray(row.Images),
      createdAt: new Timestamp(new Date(row.CreatedDate).getTime()),
    })
  }
}

// postgres.js returns JSON(B) columns as parsed values, but if these columns are
// plain TEXT the raw string is passed through — index-access then yields single
// characters like "[". Parse defensively so both shapes work.
function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value as string[]
  if (typeof value !== "string" || value.length === 0) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
