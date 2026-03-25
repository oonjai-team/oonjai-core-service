import type {Booking} from "@entity/Booking"
import type {UUID} from "@type/uuid"
import type {BookingFilter} from "@type/booking"

export interface IBookingRepository {
  findById(id: string): Booking | undefined
  findByOwnerId(adultChildId: UUID, filter?: BookingFilter): Booking[]
  findByCaretakerId(caretakerId: UUID, filter?: BookingFilter): Booking[]
  insert(booking: Booking): string
  save(booking: Booking): boolean
  delete(booking: Booking): void
}
