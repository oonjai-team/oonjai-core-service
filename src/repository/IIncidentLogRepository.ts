import type {UUID} from "@type/uuid"
import type {IncidentLog} from "@entity/IncidentLog"

export interface IIncidentLogRepository {
  findByBookingId(bookingId: string): Promise<IncidentLog[]>
  findBySeniorId(seniorId: UUID): Promise<IncidentLog[]>
  findById(id: UUID): Promise<IncidentLog | undefined>
  insert(log: IncidentLog): Promise<UUID>
  save(log: IncidentLog): Promise<boolean>
}
