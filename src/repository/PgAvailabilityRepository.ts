import type {IAvailabilityRepository} from "./IAvailabilityRepository"
import type {UUID} from "@type/uuid"
import type {AvailabilitySlot} from "@type/caretaker"
import sql from "../lib/postgres"

export class PgAvailabilityRepository implements IAvailabilityRepository {

  async listByCaretaker(caretakerId: UUID): Promise<AvailabilitySlot[]> {
    const rows = await sql`
      SELECT "Availability_ID", "StartDateTime", "EndDateTime", "isActive", "CreatedDate"
      FROM "Caretaker_Availability"
      WHERE "CaretakerID" = ${caretakerId.toString()}
      ORDER BY "StartDateTime" ASC
    `
    return rows.map((r: any) => ({
      id: r.Availability_ID,
      startDateTime: new Date(r.StartDateTime).toISOString(),
      endDateTime: new Date(r.EndDateTime).toISOString(),
      isActive: r.isActive,
      createdDate: new Date(r.CreatedDate).toISOString(),
    }))
  }

  async replaceForCaretaker(caretakerId: UUID, slots: AvailabilitySlot[]): Promise<void> {
    const idStr = caretakerId.toString()
    await sql.begin(async (tx) => {
      await tx`DELETE FROM "Caretaker_Availability" WHERE "CaretakerID" = ${idStr}`
      for (const slot of slots) {
        await tx`
          INSERT INTO "Caretaker_Availability" (
            "CaretakerID", "StartDateTime", "EndDateTime", "isActive"
          ) VALUES (
            ${idStr}, ${slot.startDateTime}, ${slot.endDateTime}, ${slot.isActive ?? true}
          )
        `
      }
    })
  }

  async setActiveInRange(caretakerId: UUID, startDate: string, endDate: string, active: boolean): Promise<void> {
    // Flip every 1-hour row that sits entirely inside [startDate, endDate).
    await sql`
      UPDATE "Caretaker_Availability"
      SET "isActive" = ${active}
      WHERE "CaretakerID" = ${caretakerId.toString()}
        AND "StartDateTime" >= ${startDate}
        AND "EndDateTime"   <= ${endDate}
    `
  }
}
