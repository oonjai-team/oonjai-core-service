import type {IBookingRepository} from "@repo/IBookingRepository"
import type {ITestDatabase} from "../lib/TestDatabase"
import {Booking} from "@entity/Booking"
import {UUID} from "@type/uuid"
import type {BookingFilter} from "@type/booking"

export class TestBookingRepository implements IBookingRepository {

  constructor(private db: ITestDatabase) {}

  public findById(id: string): Booking | undefined {
    try {
      const record = this.db.get("booking", new UUID(id))
      return new Booking(record)
    } catch (_) {
      return undefined
    }
  }

  public findByOwnerId(adultChildId: UUID, filter?: BookingFilter): Booking[] {
    return this.applyFilter(
      this.db.getAll("booking").filter(dto => dto.adultChildId === adultChildId.toString()),
      filter
    )
  }

  public findByCaretakerId(caretakerId: UUID, filter?: BookingFilter): Booking[] {
    return this.applyFilter(
      this.db.getAll("booking").filter(dto => dto.caretakerId === caretakerId.toString()),
      filter
    )
  }

  private applyFilter(records: any[], filter?: BookingFilter): Booking[] {
    let results = records

    if (filter?.status) {
      results = results.filter(dto => dto.status === filter.status)
    }

    if (filter?.upcoming) {
      const now = Date.now()
      results = results
        .filter(dto => new Date(dto.startDate).getTime() > now)
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    }

    return results.map(dto => new Booking(dto))
  }

  public insert(booking: Booking): string {
    const shortId = crypto.randomUUID().replace(/-/g, "").substring(0, 8).toUpperCase()
    const bookingId = `BK-${shortId}`
    this.db.set("booking", new UUID(bookingId), {...booking.toDTO(), id: bookingId})
    return bookingId
  }

  public save(booking: Booking): boolean {
    if (booking.isNew()) {
      throw new Error("cannot save new booking without id")
    }
    this.db.set("booking", booking.getId() as UUID, booking.toDTO())
    return true
  }

  public delete(booking: Booking): void {
    if (booking.isNew()) {
      throw new Error("cannot delete booking without id")
    }
    this.db.delete("booking", booking.getId() as UUID)
  }
}
