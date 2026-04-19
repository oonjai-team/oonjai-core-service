import type {ActivityFilter, IActivityRepository} from "@repo/IActivityRepository"
import {Activity} from "@entity/Activity"
import {UUID} from "@type/uuid"
import {Timestamp} from "@type/timestamp"
import sql from "../lib/postgres"

// SELECT columns that ship back to toEntity. ACTIVITY LEFT JOIN POC LEFT JOIN PROVIDER.
const selectColumns = sql`
  a."ActivityID",
  a."Title",
  a."Category",
  a."Tags",
  a."POCID",
  a."StartDate",
  a."EndDate",
  a."Location",
  a."Price",
  a."ParticipantCount",
  a."Duration",
  a."MaxPeople",
  a."Rating",
  a."Reviews",
  a."Images",
  a."Overview",
  a."WhatToBring",
  a."CreatedDate",
  poc."FirstName"   AS "HostFirstName",
  poc."LastName"    AS "HostLastName",
  poc."PhoneNumber" AS "HostPhoneNumber",
  poc."Avatar"      AS "HostAvatar",
  poc."Description" AS "HostDescription",
  pr."ProviderID"   AS "ProviderID",
  pr."ProviderName" AS "ProviderName"
`

const selectFrom = sql`
  FROM "ACTIVITY" a
  LEFT JOIN "Point_of_Contact" poc ON poc."POCID" = a."POCID"
  LEFT JOIN "PROVIDER"         pr  ON pr."ProviderID" = poc."ProviderID"
`

export class PgActivityRepository implements IActivityRepository {

  async findAll(): Promise<Activity[]> {
    const rows = await sql`SELECT ${selectColumns} ${selectFrom}`
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
      SELECT ${selectColumns}
      ${selectFrom}
      WHERE 1 = 1
        ${category ? sql`AND LOWER(a."Category") = LOWER(${category})` : sql``}
        ${location ? sql`AND a."Location" ILIKE ${'%' + location + '%'}` : sql``}
        ${priceMin !== undefined ? sql`AND a."Price" >= ${priceMin}` : sql``}
        ${priceMax !== undefined ? sql`AND a."Price" <= ${priceMax}` : sql``}
        ${search ? sql`AND (
          a."Title" ILIKE ${'%' + search + '%'}
          OR a."Category" ILIKE ${'%' + search + '%'}
          OR (poc."FirstName" || ' ' || poc."LastName") ILIKE ${'%' + search + '%'}
          OR a."Location" ILIKE ${'%' + search + '%'}
          OR a."Tags"::text ILIKE ${'%' + search + '%'}
        )` : sql``}
      ORDER BY a."StartDate" ASC NULLS LAST, a."ActivityID" ASC
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
      SELECT COUNT(*)::int AS count
      ${selectFrom}
      WHERE 1 = 1
        ${category ? sql`AND LOWER(a."Category") = LOWER(${category})` : sql``}
        ${location ? sql`AND a."Location" ILIKE ${'%' + location + '%'}` : sql``}
        ${priceMin !== undefined ? sql`AND a."Price" >= ${priceMin}` : sql``}
        ${priceMax !== undefined ? sql`AND a."Price" <= ${priceMax}` : sql``}
        ${search ? sql`AND (
          a."Title" ILIKE ${'%' + search + '%'}
          OR a."Category" ILIKE ${'%' + search + '%'}
          OR (poc."FirstName" || ' ' || poc."LastName") ILIKE ${'%' + search + '%'}
          OR a."Location" ILIKE ${'%' + search + '%'}
          OR a."Tags"::text ILIKE ${'%' + search + '%'}
        )` : sql``}
    `
    return Number(rows[0]?.count ?? 0)
  }

  async findById(id: string): Promise<Activity | undefined> {
    const rows = await sql`
      SELECT ${selectColumns}
      ${selectFrom}
      WHERE a."ActivityID" = ${id}
    `
    const row = rows[0]
    if (!row) return undefined
    return this.toEntity(row)
  }

  async insert(activity: Activity): Promise<string> {
    const dto = activity.toDTO()
    const rows = await sql`
      INSERT INTO "ACTIVITY" (
        "Title", "Category", "Tags", "POCID",
        "StartDate", "EndDate", "Location", "Price", "ParticipantCount",
        "Duration", "MaxPeople", "Rating", "Reviews", "Images",
        "Overview", "WhatToBring", "CreatedDate"
      )
      VALUES (
        ${dto.title}, ${dto.category}, ${JSON.stringify(dto.tags)}, ${dto.pocId ?? null},
        ${dto.startDate}, ${dto.endDate}, ${dto.location},
        ${dto.price}, ${dto.participantCount}, ${dto.duration},
        ${dto.maxPeople}, ${dto.rating}, ${dto.reviews},
        ${JSON.stringify(dto.images)},
        ${dto.overview ?? ""}, ${JSON.stringify(dto.whatToBring ?? [])},
        ${new Date(dto.createdAt.getTime())}
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
          "POCID"            = ${dto.pocId ?? null},
          "StartDate"        = ${dto.startDate},
          "EndDate"          = ${dto.endDate},
          "Location"         = ${dto.location},
          "Price"            = ${dto.price},
          "ParticipantCount" = ${dto.participantCount},
          "Duration"         = ${dto.duration},
          "MaxPeople"        = ${dto.maxPeople},
          "Rating"           = ${dto.rating},
          "Reviews"          = ${dto.reviews},
          "Images"           = ${JSON.stringify(dto.images)},
          "Overview"         = ${dto.overview ?? ""},
          "WhatToBring"      = ${JSON.stringify(dto.whatToBring ?? [])}
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
      pocId: row.POCID ?? undefined,
      hostFirstName: row.HostFirstName ?? undefined,
      hostLastName: row.HostLastName ?? undefined,
      hostPhoneNumber: row.HostPhoneNumber ?? undefined,
      providerId: row.ProviderID ?? undefined,
      providerName: row.ProviderName ?? undefined,
      host: "",                                          // composed in Activity.toDTO
      hostAvatar: row.HostAvatar ?? "",                  // from Point_of_Contact.Avatar
      hostDescription: row.HostDescription ?? "",        // from Point_of_Contact.Description
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
      overview: row.Overview ?? "",
      whatToBring: parseJsonArray(row.WhatToBring),
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
