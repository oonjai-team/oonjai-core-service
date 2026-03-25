import {UUID} from "@type/uuid"
import type {Timestamp} from "@type/timestamp"
import type {BookingDTO} from "@entity/BookingDTO"
import {BookingStatus, ServiceType} from "@type/booking"
import type {Review} from "@type/review"

export class Booking {
  private id?: UUID
  private adultChildId: UUID
  private seniorId: UUID
  private caretakerId: UUID
  private serviceType: ServiceType
  private status: BookingStatus
  private startDate: string
  private endDate: string
  private location: string
  private note: string
  private estimatedCost: number
  private currency: string
  private review: Review | null
  private createdAt: Timestamp

  constructor(dto: BookingDTO)
  constructor(
    adultChildId: UUID,
    seniorId: UUID,
    caretakerId: UUID,
    serviceType: ServiceType,
    status: BookingStatus,
    startDate: string,
    endDate: string,
    location: string,
    note: string,
    estimatedCost: number,
    currency: string,
    review: Review | null,
    createdAt: Timestamp,
    id?: UUID
  )

  constructor(
    ...args:
      | [BookingDTO]
      | [UUID, UUID, UUID, ServiceType, BookingStatus, string, string, string, string, number, string, Review | null, Timestamp, UUID?]
  ) {
    if (typeof args[0] === "object" && "adultChildId" in args[0]) {
      const dto = args[0] as BookingDTO
      this.id = new UUID(dto.id)
      this.adultChildId = new UUID(dto.adultChildId)
      this.seniorId = new UUID(dto.seniorId)
      this.caretakerId = new UUID(dto.caretakerId)
      this.serviceType = dto.serviceType
      this.status = dto.status
      this.startDate = dto.startDate
      this.endDate = dto.endDate
      this.location = dto.location
      this.note = dto.note
      this.estimatedCost = dto.estimatedCost
      this.currency = dto.currency
      this.review = dto.review
      this.createdAt = dto.createdAt
      return
    }

    const arr = args as [UUID, UUID, UUID, ServiceType, BookingStatus, string, string, string, string, number, string, Review | null, Timestamp, UUID?]
    this.adultChildId = arr[0]
    this.seniorId = arr[1]
    this.caretakerId = arr[2]
    this.serviceType = arr[3]
    this.status = arr[4]
    this.startDate = arr[5]
    this.endDate = arr[6]
    this.location = arr[7]
    this.note = arr[8]
    this.estimatedCost = arr[9]
    this.currency = arr[10]
    this.review = arr[11]
    this.createdAt = arr[12]
    this.id = arr[13]
  }

  public isNew(): boolean {
    return !this.id
  }

  public getId(): UUID | undefined {
    return this.id
  }

  public getStatus(): BookingStatus {
    return this.status
  }

  public getAdultChildId(): UUID {
    return this.adultChildId
  }

  public getCaretakerId(): UUID {
    return this.caretakerId
  }

  public cancel(requesterId: UUID): void {
    if (this.adultChildId.toString() !== requesterId.toString()) {
      throw new Error("FORBIDDEN: only the booking owner can cancel")
    }
    if (this.status !== BookingStatus.CREATED) {
      throw new Error("FORBIDDEN: only created bookings can be cancelled")
    }
    this.status = BookingStatus.CANCELLED
  }

  public confirm(caretakerId: UUID): void {
    if (this.caretakerId.toString() !== caretakerId.toString()) {
      throw new Error("FORBIDDEN: only the assigned caretaker can confirm this booking")
    }
    if (this.status === BookingStatus.CONFIRMED) {
      throw new Error("CONFLICT: booking is already confirmed")
    }
    if (this.status !== BookingStatus.CREATED) {
      throw new Error("FORBIDDEN: booking cannot be confirmed in its current status")
    }
    this.status = BookingStatus.CONFIRMED
  }

  public end(caretakerId: UUID): void {
    if (this.caretakerId.toString() !== caretakerId.toString()) {
      throw new Error("FORBIDDEN: only the assigned caretaker can end this session")
    }
    if (this.status !== BookingStatus.CONFIRMED) {
      throw new Error("BAD_REQUEST: end session is only allowed on confirmed bookings")
    }
    this.status = BookingStatus.COMPLETED
  }

  public addReview(rating: number, comment: string, reviewType: string): Review {
    if (this.review !== null) {
      throw new Error("CONFLICT: a review has already been submitted for this booking")
    }
    const review: Review = {rating, comment, reviewType, createdAt: Date.now()}
    this.review = review
    return review
  }

  public update(data: Partial<Pick<BookingDTO, "startDate" | "endDate" | "location" | "note">>): void {
    if (this.status !== BookingStatus.CREATED) {
      throw new Error("FORBIDDEN: only created bookings can be updated")
    }
    if (data.startDate !== undefined) this.startDate = data.startDate
    if (data.endDate !== undefined) this.endDate = data.endDate
    if (data.location !== undefined) this.location = data.location
    if (data.note !== undefined) this.note = data.note
  }

  public toDTO(): BookingDTO {
    return {
      id: this.id?.toString(),
      adultChildId: this.adultChildId.toString(),
      seniorId: this.seniorId.toString(),
      caretakerId: this.caretakerId.toString(),
      serviceType: this.serviceType,
      status: this.status,
      startDate: this.startDate,
      endDate: this.endDate,
      location: this.location,
      note: this.note,
      estimatedCost: this.estimatedCost,
      currency: this.currency,
      review: this.review,
      createdAt: this.createdAt,
    }
  }
}
