import type {Booking} from "@entity/Booking"
import type {UUID} from "@type/uuid"
import type {BookingFilter} from "@type/booking"

export interface IBookingRepository {
  findById(id: string): Promise<Booking | undefined>
  findByOwnerId(adultChildId: UUID, filter?: BookingFilter): Promise<Booking[]>
  findByCaretakerId(caretakerId: UUID, filter?: BookingFilter): Promise<Booking[]>
  findByActivityId(activityId: string): Promise<Booking[]>
  findBySeniorId(seniorId: UUID): Promise<Booking[]>
  insert(booking: Booking): Promise<string>
  save(booking: Booking): Promise<boolean>
  delete(booking: Booking): Promise<void>
}
