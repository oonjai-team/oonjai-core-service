import type {UUID} from "@type/uuid"
import type {StatusLog} from "@entity/StatusLog"

export interface IStatusLogRepository {
  save(log: StatusLog): Promise<boolean>
  findById(id: UUID): Promise<StatusLog | undefined>
  findByBookingId(bookingId: string): Promise<StatusLog[]>
  insert(log: StatusLog): Promise<UUID>
}
