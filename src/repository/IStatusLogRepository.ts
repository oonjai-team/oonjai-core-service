import type {UUID} from "@type/uuid"
import type {StatusLog} from "@entity/StatusLog"

export interface IStatusLogRepository {
save(log: StatusLog): boolean
  findById(id: UUID): StatusLog | undefined
  findByBookingId(bookingId: string): StatusLog[]
  insert(log: StatusLog): UUID
}