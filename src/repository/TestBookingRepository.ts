import type {IBookingRepository} from "@repo/IBookingRepository"
import type {ITestDatabase} from "../lib/TestDatabase"
import {Booking} from "@entity/Booking"
import type {ReviewDTO} from "@entity/ReviewDTO"
import {UUID} from "@type/uuid"
import type {BookingFilter} from "@type/booking"

export class TestBookingRepository implements IBookingRepository {

  constructor(private db: ITestDatabase) {}

  public findById(id: string): Booking | undefined {
    try {
      const record = this.db.get("booking", new UUID(id))
      return this.reconstruct(record, new UUID(id))
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

  public findByActivityId(activityId: string): Booking[] {
    return this.db.getAll("booking")
      .filter(dto => dto.activityId === activityId)
      .map(r => this.reconstruct(r, new UUID(r.id)))
  }

  public findBySeniorId(seniorId: UUID): Booking[] {
    return this.db.getAll("booking")
      .filter(dto => dto.seniorId === seniorId.toString())
      .map(r => this.reconstruct(r, new UUID(r.id)))
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

    return results.map(r => this.reconstruct(r, new UUID(r.id)))
  }

  public insert(booking: Booking): string {
    const shortId = crypto.randomUUID().replace(/-/g, "").substring(0, 8).toUpperCase()
    const bookingId = `BK-${shortId}`
    const {review, ...bookingData} = booking.toDTO()
    this.db.set("booking", new UUID(bookingId), {...bookingData, id: bookingId})
    return bookingId
  }

  public save(booking: Booking): boolean {
    if (booking.isNew()) {
      throw new Error("cannot save new booking without id")
    }
    const id = booking.getId() as UUID
    const {review, ...bookingData} = booking.toDTO()
    this.db.set("booking", id, bookingData)
    if (review) {
      this.db.set("review", id, review)
    }
    return true
  }

  public delete(booking: Booking): void {
    if (booking.isNew()) {
      throw new Error("cannot delete booking without id")
    }
    this.db.delete("booking", booking.getId() as UUID)
  }

  private reconstruct(record: any, id: UUID): Booking {
    let review: ReviewDTO | null = null
    try {
      review = this.db.get("review", id)
    } catch (_) {
      // no review for this booking yet
    }
    return new Booking({...record, review})
  }
}
