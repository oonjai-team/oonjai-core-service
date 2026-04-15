import type {IBookingRepository} from "@repo/IBookingRepository"
import type {IUserRepository} from "@repo/IUserRepository"
import type {IService} from "@serv/IService"
import {Booking} from "@entity/Booking"
import {Review} from "@entity/Review"
import type {BookingDTO} from "@entity/BookingDTO"
import {BookingStatus, ServiceType} from "@type/booking"
import type {BookingFilter} from "@type/booking"
import {TimestampHelper} from "@type/timestamp"
import {UUID} from "@type/uuid"
import {RoleEnum} from "@type/user"

export class BookingService implements IService {
  private bookingRepo: IBookingRepository
  private userRepo: IUserRepository

  constructor(bookingRepo: IBookingRepository, userRepo: IUserRepository) {
    this.bookingRepo = bookingRepo
    this.userRepo = userRepo
  }

  public getServiceId(): string {
    return "BookingService"
  }

  public async createBooking(
    adultChildId: UUID,
    seniorId: UUID,
    caretakerId: UUID,
    serviceType: ServiceType,
    startDate: string,
    endDate: string,
    location: string,
    note: string
  ): Promise<Booking> {
    const caretakerUser = await this.userRepo.findById(caretakerId)
    if (!caretakerUser || !caretakerUser.isCaretaker()) {
      throw new Error("CARETAKER_NOT_FOUND: caretaker not found")
    }

    const caretakerProfile = caretakerUser.getCaretaker()
    if (!caretakerProfile) {
      throw new Error("CARETAKER_NOT_FOUND: caretaker profile not found")
    }

    // Check for time conflicts
    const existing = await this.bookingRepo.findByCaretakerId(caretakerId)
    const newStart = new Date(startDate).getTime()
    const newEnd = new Date(endDate).getTime()
    const hasConflict = existing.some(b => {
      const dto = b.toDTO()
      if (dto.status === BookingStatus.CANCELLED) return false
      const existStart = new Date(dto.startDate).getTime()
      const existEnd = new Date(dto.endDate).getTime()
      return existStart < newEnd && existEnd > newStart
    })
    if (hasConflict) {
      throw new Error("CONFLICT: caretaker is not available for the requested time slot")
    }

    // Check senior time conflicts
    if (await this.hasSeniorTimeConflict(seniorId, startDate, endDate)) {
      throw new Error("SENIOR_CONFLICT: senior already has a booking during this time period")
    }

    const caretakerDTO = caretakerProfile.toDTO()
    const durationHours = (newEnd - newStart) / (1000 * 60 * 60)
    const estimatedCost = caretakerDTO.hourlyRate * durationHours

    const booking = new Booking(
      adultChildId,
      seniorId,
      caretakerId,
      serviceType,
      BookingStatus.CREATED,
      startDate,
      endDate,
      location,
      note,
      estimatedCost,
      caretakerDTO.currency,
      null,
      TimestampHelper.now()
    )

    const id = await this.bookingRepo.insert(booking)

    // Mark slots as booked on the caretaker
    caretakerProfile.bookSlots(startDate, endDate, id)
    await this.userRepo.updateAttrProfile(caretakerId, caretakerProfile.toDTO())

    return new Booking({...booking.toDTO(), id: id})
  }

  /** Return unique senior IDs that already have a non-cancelled booking for this activity */
  public async getBookedSeniorIds(activityId: string): Promise<string[]> {
    const bookings = await this.bookingRepo.findByActivityId(activityId)
    const ids = bookings
      .filter(b => b.getStatus() !== BookingStatus.CANCELLED)
      .map(b => b.toDTO().seniorId)
    return [...new Set(ids)]
  }

  /** Check if a senior has any non-cancelled booking that overlaps the given time window */
  public async hasSeniorTimeConflict(seniorId: UUID, startDate: string, endDate: string, excludeActivityId?: string): Promise<boolean> {
    const bookings = await this.bookingRepo.findBySeniorId(seniorId)
    const newStart = new Date(startDate).getTime()
    const newEnd = new Date(endDate).getTime()

    // Guard: if the activity dates can't be parsed, skip conflict check
    if (isNaN(newStart) || isNaN(newEnd)) return false

    return bookings.some(b => {
      const dto = b.toDTO()
      if (dto.status === BookingStatus.CANCELLED) return false
      // Skip bookings for the same activity (already caught by duplicate check)
      if (excludeActivityId && dto.activityId === excludeActivityId) return false
      const existStart = new Date(dto.startDate).getTime()
      const existEnd = new Date(dto.endDate).getTime()
      // Skip bookings with unparseable dates (legacy data)
      if (isNaN(existStart) || isNaN(existEnd)) return false
      return existStart < newEnd && existEnd > newStart
    })
  }

  public async createActivityBooking(
    adultChildId: UUID,
    seniorId: UUID,
    activityId: string,
    startDate: string,
    endDate: string,
    location: string,
    estimatedCost: number,
    currency: string,
    note: string,
  ): Promise<Booking> {
    const booking = new Booking(
      adultChildId,
      seniorId,
      adultChildId, // caretakerId not applicable — use self as placeholder
      ServiceType.ACTIVITY,
      BookingStatus.CREATED,
      startDate,
      endDate,
      location,
      note,
      estimatedCost,
      currency,
      null,
      TimestampHelper.now()
    )

    const id = await this.bookingRepo.insert(booking)
    const saved = new Booking({...booking.toDTO(), id, activityId})
    await this.bookingRepo.save(saved)
    return saved
  }

  public async getListOfBookings(userId: UUID, role: RoleEnum, filter?: BookingFilter): Promise<Booking[]> {
    if (role === RoleEnum.CARETAKER) {
      return this.bookingRepo.findByCaretakerId(userId, filter)
    }
    return this.bookingRepo.findByOwnerId(userId, filter)
  }

  public async getBookingDetail(bookingId: string): Promise<Booking | undefined> {
    return this.bookingRepo.findById(bookingId)
  }

  public async updateBooking(bookingId: string, data: Partial<BookingDTO>): Promise<Booking> {
    const booking = await this.bookingRepo.findById(bookingId)
    if (!booking) throw new Error("NOT_FOUND: booking not found")
    booking.update(data)
    await this.bookingRepo.save(booking)
    return booking
  }

  public async cancelBooking(bookingId: string, requesterId: UUID): Promise<void> {
    const booking = await this.bookingRepo.findById(bookingId)
    if (!booking) throw new Error("NOT_FOUND: booking not found")
    booking.cancel(requesterId)
    await this.bookingRepo.save(booking)

    // Release booked slots on the caretaker
    const dto = booking.toDTO()
    if (dto.caretakerId) {
      const caretakerUser = await this.userRepo.findById(new UUID(dto.caretakerId))
      if (caretakerUser) {
        const profile = caretakerUser.getCaretaker()
        if (profile) {
          profile.releaseSlots(bookingId)
          await this.userRepo.updateAttrProfile(new UUID(dto.caretakerId), profile.toDTO())
        }
      }
    }
  }

  public async confirmBooking(bookingId: string, caretakerId: UUID): Promise<Booking> {
    const booking = await this.bookingRepo.findById(bookingId)
    if (!booking) throw new Error("NOT_FOUND: booking not found")
    booking.confirm(caretakerId)
    await this.bookingRepo.save(booking)
    return booking
  }

  public async endSession(bookingId: string, caretakerId: UUID): Promise<Booking> {
    const booking = await this.bookingRepo.findById(bookingId)
    if (!booking) throw new Error("NOT_FOUND: booking not found")
    booking.end(caretakerId)
    await this.bookingRepo.save(booking)
    return booking
  }

  public async submitReview(bookingId: string, rating: number, comment: string, reviewType: string): Promise<Review> {
    const booking = await this.bookingRepo.findById(bookingId)
    if (!booking) throw new Error("NOT_FOUND: booking not found")
    const review = booking.addReview(rating, comment, reviewType)

    // bookingRepo.save handles persisting the review to its own table
    await this.bookingRepo.save(booking)

    // Recalculate caretaker's average rating
    const caretakerId = new UUID(booking.getCaretakerId().toString())
    const caretakerUser = await this.userRepo.findById(caretakerId)
    if (caretakerUser) {
      const profile = caretakerUser.getCaretaker()
      if (profile) {
        const dto = profile.toDTO()
        const newReviewCount = dto.reviewCount + 1
        const newRating = (dto.rating * dto.reviewCount + rating) / newReviewCount
        await this.userRepo.updateAttrProfile(caretakerId, {
          rating: Math.round(newRating * 100) / 100,
          reviewCount: newReviewCount,
        })
      }
    }

    return review
  }
}
