import type {IStatusLogRepository} from "@repo/IStatusLogRepository"
import {StatusLog} from "@entity/StatusLog"
import {UUID} from "@type/uuid"
import {Timestamp} from "@type/timestamp"
import type {CareSessionStatus} from "@type/careSession"
import sql from "../lib/postgres"

export class PgStatusLogRepository implements IStatusLogRepository {

  async save(log: StatusLog): Promise<boolean> {
    const dto = log.toDTO()
    if (!dto.id) return false
    const result = await sql`
      UPDATE "STATUS_LOG"
      SET "BookingID"        = ${dto.bookingId},
          "StatusType"       = ${dto.statusType},
          "Notes"            = ${dto.notes},
          "PhotoUrl"         = ${dto.photoUrl},
          "StatusTimestamp"   = ${new Date(dto.createdAt.getTime())}
      WHERE "StatusLogID" = ${dto.id}
    `
    return result.count > 0
  }

  async findById(id: UUID): Promise<StatusLog | undefined> {
    const rows = await sql`
      SELECT * FROM "STATUS_LOG" WHERE "StatusLogID" = ${id.toString()}
    `
    const row = rows[0]
    if (!row) return undefined
    return this.toEntity(row)
  }

  async findByBookingId(bookingId: string): Promise<StatusLog[]> {
    const rows = await sql`
      SELECT * FROM "STATUS_LOG" WHERE "BookingID" = ${bookingId}
    `
    return rows.map(row => this.toEntity(row))
  }

  async insert(log: StatusLog): Promise<UUID> {
    const dto = log.toDTO()
    const rows = await sql`
      INSERT INTO "STATUS_LOG" ("BookingID", "StatusType", "Notes", "PhotoUrl", "StatusTimestamp")
      VALUES (${dto.bookingId}, ${dto.statusType}, ${dto.notes}, ${dto.photoUrl}, ${new Date(dto.createdAt.getTime())})
      RETURNING "StatusLogID"
    `
    return new UUID(rows[0]!.StatusLogID)
  }

  private toEntity(row: Record<string, any>): StatusLog {
    return new StatusLog({
      id: row.StatusLogID,
      bookingId: row.BookingID,
      statusType: row.StatusType as CareSessionStatus,
      notes: row.Notes,
      photoUrl: row.PhotoUrl,
      createdAt: new Timestamp(new Date(row.StatusTimestamp).getTime()),
    })
  }
}
