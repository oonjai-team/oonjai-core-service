import type {ISeniorRepository} from "@repo/ISeniorRepository"
import {Senior} from "@entity/Senior"
import {UUID} from "@type/uuid"
import {Timestamp} from "@type/timestamp"
import sql from "../lib/postgres"

export class PgSeniorRepository implements ISeniorRepository {

  async save(senior: Senior): Promise<boolean> {
    const dto = senior.toDTO()
    if (!dto.id) return false
    const result = await sql`
      UPDATE "SENIOR_PROFILE"
      SET "AdultChildID"  = ${dto.adultChildId},
          "FullName"      = ${dto.fullname},
          "DateOfBirth"   = ${dto.dateOfBirth},
          "MobilityLevel" = ${dto.mobilityLevel},
          "HealthNotes"   = ${dto.healthNote}
      WHERE "SeniorID" = ${dto.id}
    `
    return result.count > 0
  }

  async findById(id: UUID): Promise<Senior | undefined> {
    const rows = await sql`
      SELECT * FROM "SENIOR_PROFILE" WHERE "SeniorID" = ${id.toString()}
    `
    const row = rows[0]
    if (!row) return undefined
    return new Senior({
      id: row.SeniorID,
      adultChildId: row.AdultChildID,
      fullname: row.FullName,
      dateOfBirth: row.DateOfBirth,
      mobilityLevel: row.MobilityLevel,
      healthNote: row.HealthNotes,
      createdAt: new Timestamp(new Date(row.CreatedDate).getTime()),
    })
  }

  async findAllByAdultChildId(adultChildId: UUID): Promise<Senior[]> {
    const rows = await sql`
      SELECT * FROM "SENIOR_PROFILE" WHERE "AdultChildID" = ${adultChildId.toString()}
    `
    return rows.map(row => new Senior({
      id: row.SeniorID,
      adultChildId: row.AdultChildID,
      fullname: row.FullName,
      dateOfBirth: row.DateOfBirth,
      mobilityLevel: row.MobilityLevel,
      healthNote: row.HealthNotes,
      createdAt: new Timestamp(new Date(row.CreatedDate).getTime()),
    }))
  }

  async insert(senior: Senior): Promise<UUID> {
    const dto = senior.toDTO()
    const rows = await sql`
      INSERT INTO "SENIOR_PROFILE" ("AdultChildID", "FullName", "DateOfBirth", "MobilityLevel", "HealthNotes", "CreatedDate")
      VALUES (${dto.adultChildId}, ${dto.fullname}, ${dto.dateOfBirth}, ${dto.mobilityLevel}, ${dto.healthNote}, ${new Date(dto.createdAt.getTime())})
      RETURNING "SeniorID"
    `
    return new UUID(rows[0]!.SeniorID)
  }

  async delete(senior: Senior): Promise<void> {
    const id = senior.getId()
    if (!id) throw new Error("cannot delete a senior without an ID")
    await sql`
      DELETE FROM "SENIOR_PROFILE" WHERE "SeniorID" = ${id.toString()}
    `
  }
}
