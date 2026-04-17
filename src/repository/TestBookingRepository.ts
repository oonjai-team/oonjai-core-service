import type {IBookingRepository} from "@repo/IBookingRepository"
import type {ITestDatabase} from "../lib/TestDatabase"
import {Booking} from "@entity/Booking"
import type {ReviewDTO} from "@entity/ReviewDTO"
import {UUID} from "@type/uuid"
import type {BookingFilter} from "@type/booking"

export class TestBookingRepository implements IBookingRepository {

  constructor(private db: ITestDatabase) {}

  public async findById(id: string): Promise<Booking | undefined> {
    try {
      const record = this.db.get("booking", new UUID(id))
      return this.reconstruct(record, new UUID(id))
    } catch (_) {
      return undefined
    }
  }

  public async findByOwnerId(adultChildId: UUID, filter?: BookingFilter): Promise<Booking[]> {
    return this.applyFilter(
      this.db.getAll("booking").filter(dto => dto.adultChildId === adultChildId.toString()),
      filter
    )
  }

  public async findByCaretakerId(caretakerId: UUID, filter?: BookingFilter): Promise<Booking[]> {
    return this.applyFilter(
      this.db.getAll("booking").filter(dto => dto.caretakerId === caretakerId.toString()),
      filter
    )
  }

  public async findByActivityId(activityId: string): Promise<Booking[]> {
    return this.db.getAll("booking")
      .filter(dto => dto.activityId === activityId)
      .map(r => this.reconstruct(r, new UUID(r.id)))
  }

  public async findBySeniorId(seniorId: UUID): Promise<Booking[]> {
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

  public async insert(booking: Booking): Promise<string> {
    const shortId = crypto.randomUUID().replace(/-/g, "").substring(0, 8).toUpperCase()
    const bookingId = `BK-${shortId}`
    const {review, ...bookingData} = booking.toDTO()
    this.db.set("booking", new UUID(bookingId), {...bookingData, id: bookingId})
    return bookingId
  }

  public async reserveAndInsert(booking: Booking): Promise<string> {
    const dto = booking.toDTO()
    if (!dto.caretakerId) {
      throw new Error("reserveAndInsert requires a caretakerId")
    }
    const caretakerId = new UUID(dto.caretakerId)
    const reqStart = new Date(dto.startDate).getTime()
    const reqEnd = new Date(dto.endDate).getTime()
    const requiredHours = Math.max(1, Math.round((reqEnd - reqStart) / (60 * 60 * 1000)))

    // Every hour in [start, end) must have a matching active 1-hour slot
    let slots: {startDateTime: string; endDateTime: string; isActive: boolean}[] = []
    try {
      const stored = this.db.get("availability", caretakerId)
      slots = (stored?.slots ?? []) as typeof slots
    } catch (_) {
      // no availability record
    }
    const activeContained = slots.filter(s =>
      s.isActive &&
      new Date(s.startDateTime).getTime() >= reqStart &&
      new Date(s.endDateTime).getTime() <= reqEnd
    ).length
    if (activeContained !== requiredHours) {
      throw new Error("NOT_AVAILABLE: caretaker has no active availability covering this range")
    }

    // Re-check bookings
    const conflicts = this.db.getAll("booking")
      .filter(b => b.caretakerId === dto.caretakerId && b.status !== "cancelled")
      .some(b => new Date(b.startDate).getTime() < reqEnd && new Date(b.endDate).getTime() > reqStart)
    if (conflicts) {
      throw new Error("CONFLICT: caretaker is not available for the requested time slot")
    }

    const bookingId = await this.insert(booking)

    // Flip each contained hourly slot to inactive
    const updated = slots.map(s => {
      const contained =
        new Date(s.startDateTime).getTime() >= reqStart &&
        new Date(s.endDateTime).getTime() <= reqEnd
      return contained ? {...s, isActive: false} : s
    })
    this.db.set("availability", caretakerId, {slots: updated})

    return bookingId
  }

  public async save(booking: Booking): Promise<boolean> {
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

  public async delete(booking: Booking): Promise<void> {
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
