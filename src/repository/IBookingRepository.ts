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
  /**
   * Atomic caretaker-booking insert. In one transaction:
   *   (1) locks the caretaker's covering Caretaker_Availability rows (FOR UPDATE),
   *   (2) verifies a covering active slot exists,
   *   (3) verifies no non-cancelled BOOKING overlaps,
   *   (4) inserts the booking,
   *   (5) flips overlapping availability rows to isActive=FALSE.
   * Any failed check rolls the transaction back — no booking row is created.
   */
  reserveAndInsert(booking: Booking): Promise<string>
  save(booking: Booking): Promise<boolean>
  delete(booking: Booking): Promise<void>
}
