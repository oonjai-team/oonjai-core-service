import type {UUID} from "@type/uuid"
import type {IncidentLog} from "@entity/IncidentLog"

export interface IIncidentLogRepository {
  findByBookingId(bookingId: string): IncidentLog[]
  findBySeniorId(seniorId: UUID): IncidentLog[]
  findById(id: UUID): IncidentLog | undefined
  insert(log: IncidentLog): UUID
  save(log: IncidentLog): boolean
}
