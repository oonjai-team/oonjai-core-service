import type {IUserRepository} from "./IUserRepository"
import {User} from "@entity/User"
import {Caretaker} from "@entity/Caretaker"
import {AdultChild} from "@entity/AdultChild"
import {UUID} from "@type/uuid"
import {Timestamp} from "@type/timestamp"
import {RoleEnum} from "@type/user"
import type {CaretakerFilter} from "@type/caretaker"
import type {AdultChildAttributes, CareTakerUserAttributes, UserDTO} from "@entity/UserDTO"
import sql from "../lib/postgres"


export class PgUserRepository implements IUserRepository {

  async save(user: User): Promise<[boolean, UUID?]> {
    const dto = user.toDTO()

    if (user.isNew()) {
      const result = await sql.begin(async (tx) => {
        const [row] = await tx`
          INSERT INTO "USER" ("FirstName", "LastName", "Email", "Phone", "Role", "CreatedDate")
          VALUES (${dto.firstname}, ${dto.lastname}, ${dto.email}, ${dto.phone ?? ''}, ${dto.role}, ${new Date()})
          RETURNING "UserID"
        `
        const userId = row!.UserID as string

        if (user.isCaretaker() && dto.caretaker) {
          const ct = dto.caretaker
          await tx`
            INSERT INTO "CARETAKER" (
              "UserID", "Bio", "Specialization", "HourlyRate", "Currency",
              "Experience", "Rating", "ReviewCount", "IsVerified",
              "ContactInfo", "Permission"
            ) VALUES (
              ${userId}, ${ct.bio}, ${ct.specialization}, ${ct.hourlyRate}, ${ct.currency},
              ${ct.experience}, ${ct.rating}, ${ct.reviewCount}, ${ct.isVerified},
              ${ct.contactInfo}, ${ct.permission}
            )
          `
        }

        if (user.isAdultChild() && dto.adultChild) {
          const ac = dto.adultChild
          await tx`
            INSERT INTO "ADULT_CHILD" ("UserID", "Relationship", "Goal", "Concerns")
            VALUES (
              ${userId}, ${ac.relationship}, ${ac.goal},
              ${sql.json(ac.concerns)}
            )
          `
        }

        return userId
      })

      return [true, new UUID(result)]
    }

    // Existing user — update
    const uid = user.getId()
    if (!uid) {
      throw new Error("user id is undefined")
    }

    await sql.begin(async (tx) => {
      await tx`
        UPDATE "USER"
        SET "FirstName" = ${dto.firstname},
            "LastName" = ${dto.lastname},
            "Email" = ${dto.email},
            "Phone" = ${dto.phone ?? ''},
            "Role" = ${dto.role}
        WHERE "UserID" = ${uid.toString()}
      `

      if (user.isCaretaker() && dto.caretaker) {
        const ct = dto.caretaker
        await tx`
          INSERT INTO "CARETAKER" (
            "UserID", "Bio", "Specialization", "HourlyRate", "Currency",
            "Experience", "Rating", "ReviewCount", "IsVerified",
            "ContactInfo", "Permission"
          ) VALUES (
            ${uid.toString()}, ${ct.bio}, ${ct.specialization}, ${ct.hourlyRate}, ${ct.currency},
            ${ct.experience}, ${ct.rating}, ${ct.reviewCount}, ${ct.isVerified},
            ${ct.contactInfo}, ${ct.permission}
          )
          ON CONFLICT ("UserID") DO UPDATE SET
            "Bio" = EXCLUDED."Bio",
            "Specialization" = EXCLUDED."Specialization",
            "HourlyRate" = EXCLUDED."HourlyRate",
            "Currency" = EXCLUDED."Currency",
            "Experience" = EXCLUDED."Experience",
            "Rating" = EXCLUDED."Rating",
            "ReviewCount" = EXCLUDED."ReviewCount",
            "IsVerified" = EXCLUDED."IsVerified",
            "ContactInfo" = EXCLUDED."ContactInfo",
            "Permission" = EXCLUDED."Permission"
        `
      }

      if (user.isAdultChild() && dto.adultChild) {
        const ac = dto.adultChild
        await tx`
          INSERT INTO "ADULT_CHILD" ("UserID", "Relationship", "Goal", "Concerns")
          VALUES (
            ${uid.toString()}, ${ac.relationship}, ${ac.goal},
            ${sql.json(ac.concerns)}
          )
          ON CONFLICT ("UserID") DO UPDATE SET
            "Relationship" = EXCLUDED."Relationship",
            "Goal" = EXCLUDED."Goal",
            "Concerns" = EXCLUDED."Concerns"
        `
      }
    })

    return [true, undefined]
  }

  async delete(user: User): Promise<void> {
    if (user.isNew()) {
      throw new Error("cannot delete a new user")
    }

    const id = user.getId() as UUID
    await sql`DELETE FROM "USER" WHERE "UserID" = ${id.toString()}`
  }

  async findById(id: UUID): Promise<User | undefined> {
    const rows = await sql`
      SELECT
        u."UserID", u."FirstName", u."LastName", u."Email", u."Phone", u."Role", u."CreatedDate",
        c."Bio", c."Specialization", c."HourlyRate", c."Currency",
        c."Experience", c."Rating", c."ReviewCount", c."IsVerified",
        c."ContactInfo", c."Permission",
        ac."UserID" AS "ac_UserID", ac."Relationship", ac."Goal", ac."Concerns"
      FROM "USER" u
      LEFT JOIN "CARETAKER" c ON c."UserID" = u."UserID"
      LEFT JOIN "ADULT_CHILD" ac ON ac."UserID" = u."UserID"
      WHERE u."UserID" = ${id.toString()}
    `

    if (rows.length === 0) return undefined
    return this.reconstruct(rows[0]!)
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const rows = await sql`
      SELECT
        u."UserID", u."FirstName", u."LastName", u."Email", u."Phone", u."Role", u."CreatedDate",
        c."Bio", c."Specialization", c."HourlyRate", c."Currency",
        c."Experience", c."Rating", c."ReviewCount", c."IsVerified",
        c."ContactInfo", c."Permission",
        ac."UserID" AS "ac_UserID", ac."Relationship", ac."Goal", ac."Concerns"
      FROM "USER" u
      LEFT JOIN "CARETAKER" c ON c."UserID" = u."UserID"
      LEFT JOIN "ADULT_CHILD" ac ON ac."UserID" = u."UserID"
      WHERE LOWER(u."Email") = LOWER(${email})
    `

    if (rows.length === 0) return undefined
    return this.reconstruct(rows[0]!)
  }

  async findAvailableCaretaker(filter: CaretakerFilter): Promise<User[]> {
    const startISO = filter.startDate.toISOString()
    const endISO = filter.endDate.toISOString()
    // Each Caretaker_Availability row is exactly 1 hour. A caretaker can serve
    // [start, end) iff every hour in the range has a matching active row.
    const requiredHours = Math.max(
      1,
      Math.round((filter.endDate.getTime() - filter.startDate.getTime()) / (60 * 60 * 1000)),
    )

    const rows = await sql`
      SELECT
        u."UserID", u."FirstName", u."LastName", u."Email", u."Phone", u."Role", u."CreatedDate",
        c."Bio", c."Specialization", c."HourlyRate", c."Currency",
        c."Experience", c."Rating", c."ReviewCount", c."IsVerified",
        c."ContactInfo", c."Permission"
      FROM "CARETAKER" c
      JOIN "USER" u ON u."UserID" = c."UserID"
      WHERE 1 = 1
        ${filter.specialization ? sql`AND c."Specialization" ILIKE ${'%' + filter.specialization + '%'}` : sql``}
        ${filter.minRating !== undefined ? sql`AND c."Rating" >= ${filter.minRating}` : sql``}
        ${filter.minExperience !== undefined ? sql`AND c."Experience" >= ${filter.minExperience}` : sql``}
        ${filter.maxHourlyRate !== undefined ? sql`AND c."HourlyRate" <= ${filter.maxHourlyRate}` : sql``}
        AND (
          SELECT COUNT(*)::int FROM "Caretaker_Availability" a
          WHERE a."CaretakerID" = c."UserID"
            AND a."isActive" = TRUE
            AND a."StartDateTime" >= ${startISO}
            AND a."EndDateTime"   <= ${endISO}
        ) = ${requiredHours}
        AND NOT EXISTS (
          SELECT 1 FROM "BOOKING"
          WHERE "CaretakerID" = c."UserID"
            AND "Status" NOT IN ('cancelled')
            AND "StartDateTime" < ${endISO}
            AND "EndDateTime" > ${startISO}
        )
      ${
        filter.sortBy === 'rating' ? sql`ORDER BY c."Rating" DESC` :
        filter.sortBy === 'experience' ? sql`ORDER BY c."Experience" DESC` :
        filter.sortBy === 'price_asc' ? sql`ORDER BY c."HourlyRate" ASC` :
        filter.sortBy === 'price_desc' ? sql`ORDER BY c."HourlyRate" DESC` :
        sql`ORDER BY c."Rating" DESC`
      }
    `

    return rows.map((row: any) => this.reconstruct(row))
  }

  async updateUser(id: UUID, data: Partial<Omit<UserDTO, "caretaker" | "adultChild">>): Promise<boolean> {
    const sets: any[] = []
    if (data.firstname !== undefined) sets.push(sql`"FirstName" = ${data.firstname}`)
    if (data.lastname !== undefined) sets.push(sql`"LastName" = ${data.lastname}`)
    if (data.email !== undefined) sets.push(sql`"Email" = ${data.email}`)
    if (data.phone !== undefined) sets.push(sql`"Phone" = ${data.phone}`)
    if (data.role !== undefined) sets.push(sql`"Role" = ${data.role}`)

    if (sets.length === 0) return false

    const result = await sql`
      UPDATE "USER"
      SET ${sets.reduce((acc, s, i) => i === 0 ? s : sql`${acc}, ${s}`)}
      WHERE "UserID" = ${id.toString()}
    `

    return result.count > 0
  }

  async updateAttrProfile(id: UUID, data: Partial<CareTakerUserAttributes>): Promise<boolean> {
    const idStr = id.toString()

    await sql`
      INSERT INTO "CARETAKER" (
        "UserID", "Bio", "Specialization", "HourlyRate", "Currency",
        "Experience", "Rating", "ReviewCount", "IsVerified",
        "ContactInfo", "Permission"
      ) VALUES (
        ${idStr},
        ${data.bio ?? ''}, ${data.specialization ?? ''}, ${data.hourlyRate ?? 0}, ${data.currency ?? 'THB'},
        ${data.experience ?? 0}, ${data.rating ?? 0}, ${data.reviewCount ?? 0}, ${data.isVerified ?? false},
        ${data.contactInfo ?? ''}, ${data.permission ?? ''}
      )
      ON CONFLICT ("UserID") DO UPDATE SET
        ${data.bio !== undefined ? sql`"Bio" = ${data.bio},` : sql``}
        ${data.specialization !== undefined ? sql`"Specialization" = ${data.specialization},` : sql``}
        ${data.hourlyRate !== undefined ? sql`"HourlyRate" = ${data.hourlyRate},` : sql``}
        ${data.currency !== undefined ? sql`"Currency" = ${data.currency},` : sql``}
        ${data.experience !== undefined ? sql`"Experience" = ${data.experience},` : sql``}
        ${data.rating !== undefined ? sql`"Rating" = ${data.rating},` : sql``}
        ${data.reviewCount !== undefined ? sql`"ReviewCount" = ${data.reviewCount},` : sql``}
        ${data.isVerified !== undefined ? sql`"IsVerified" = ${data.isVerified},` : sql``}
        ${data.contactInfo !== undefined ? sql`"ContactInfo" = ${data.contactInfo},` : sql``}
        ${data.permission !== undefined ? sql`"Permission" = ${data.permission},` : sql``}
        "UserID" = "CARETAKER"."UserID"
    `

    return true
  }

  async updateAdultChildProfile(id: UUID, data: Partial<AdultChildAttributes>): Promise<boolean> {
    const idStr = id.toString()

    await sql`
      INSERT INTO "ADULT_CHILD" ("UserID", "Relationship", "Goal", "Concerns")
      VALUES (
        ${idStr},
        ${data.relationship ?? ''}, ${data.goal ?? ''},
        ${sql.json(data.concerns ?? [])}
      )
      ON CONFLICT ("UserID") DO UPDATE SET
        ${data.relationship !== undefined ? sql`"Relationship" = ${data.relationship},` : sql``}
        ${data.goal !== undefined ? sql`"Goal" = ${data.goal},` : sql``}
        ${data.concerns !== undefined ? sql`"Concerns" = ${sql.json(data.concerns)},` : sql``}
        "UserID" = "ADULT_CHILD"."UserID"
    `

    return true
  }

  private reconstruct(row: any): User {
    const ts = new Timestamp(new Date(row.CreatedDate))
    const id = new UUID(row.UserID)
    let ct: Caretaker | undefined
    let ac: AdultChild | undefined

    if (row.Role === RoleEnum.CARETAKER && row.Bio !== null) {
      ct = new Caretaker({
        bio: row.Bio ?? '',
        specialization: row.Specialization ?? '',
        hourlyRate: Number(row.HourlyRate) || 0,
        currency: row.Currency ?? 'THB',
        experience: Number(row.Experience) || 0,
        rating: Number(row.Rating) || 0,
        reviewCount: Number(row.ReviewCount) || 0,
        isVerified: row.IsVerified ?? false,
        contactInfo: row.ContactInfo ?? '',
        permission: row.Permission ?? '',
      })
    }

    if (row.Role === RoleEnum.ADULTCHILD && row.ac_UserID) {
      ac = new AdultChild({
        relationship: row.Relationship ?? '',
        goal: row.Goal ?? '',
        concerns: row.Concerns ?? [],
      })
    }

    return new User(row.Email, row.FirstName, row.LastName, ts, row.Role as RoleEnum, id, ct, ac, row.Phone ?? '')
  }
}
