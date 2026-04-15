import type {IIncidentLogRepository} from "@repo/IIncidentLogRepository"
import {IncidentLog} from "@entity/IncidentLog"
import type {IncidentType, IncidentStatus} from "@entity/IncidentLogDTO"
import {UUID} from "@type/uuid"
import {Timestamp} from "@type/timestamp"
import sql from "../lib/postgres"

export class PgIncidentLogRepository implements IIncidentLogRepository {

  async findByBookingId(bookingId: string): Promise<IncidentLog[]> {
    const rows = await sql`
      SELECT * FROM "INCIDENT" WHERE "BookingID" = ${bookingId}
    `
    return rows.map(row => this.toEntity(row))
  }

  async findBySeniorId(seniorId: UUID): Promise<IncidentLog[]> {
    const rows = await sql`
      SELECT * FROM "INCIDENT" WHERE "SeniorID" = ${seniorId.toString()}
    `
    return rows.map(row => this.toEntity(row))
  }

  async findById(id: UUID): Promise<IncidentLog | undefined> {
    const rows = await sql`
      SELECT * FROM "INCIDENT" WHERE "IncidentID" = ${id.toString()}
    `
    const row = rows[0]
    if (!row) return undefined
    return this.toEntity(row)
  }

  async insert(log: IncidentLog): Promise<UUID> {
    const dto = log.toDTO()
    const rows = await sql`
      INSERT INTO "INCIDENT" ("BookingID", "SeniorID", "IncidentType", "IncidentStatus", "Details", "CreatedDate")
      VALUES (${dto.bookingId}, ${dto.seniorId}, ${dto.incidentType}, ${dto.status}, ${dto.detail}, ${new Date(dto.createdAt.getTime())})
      RETURNING "IncidentID"
    `
    return new UUID(rows[0]!.IncidentID)
  }

  async save(log: IncidentLog): Promise<boolean> {
    const dto = log.toDTO()
    if (!dto.id) return false
    const result = await sql`
      UPDATE "INCIDENT"
      SET "BookingID"       = ${dto.bookingId},
          "SeniorID"        = ${dto.seniorId},
          "IncidentType"    = ${dto.incidentType},
          "IncidentStatus"  = ${dto.status},
          "Details"         = ${dto.detail}
      WHERE "IncidentID" = ${dto.id}
    `
    return result.count > 0
  }

  private toEntity(row: Record<string, any>): IncidentLog {
    return new IncidentLog({
      id: row.IncidentID,
      bookingId: row.BookingID,
      seniorId: row.SeniorID,
      incidentType: row.IncidentType as IncidentType,
      detail: row.Details,
      status: row.IncidentStatus as IncidentStatus,
      createdAt: new Timestamp(new Date(row.CreatedDate).getTime()),
    })
  }
}
