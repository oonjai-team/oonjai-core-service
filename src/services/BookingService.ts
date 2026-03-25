import type {IBookingRepository} from "@repo/IBookingRepository"
import type {IUserRepository} from "@repo/IUserRepository"
import type {IService} from "@serv/IService"
import {Booking} from "@entity/Booking"
import type {BookingDTO} from "@entity/BookingDTO"
import {BookingStatus, ServiceType} from "@type/booking"
import type {BookingFilter} from "@type/booking"
import type {Review} from "@type/review"
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

  public createBooking(
    adultChildId: UUID,
    seniorId: UUID,
    caretakerId: UUID,
    serviceType: ServiceType,
    startDate: string,
    endDate: string,
    location: string,
    note: string
  ): Booking {
    const caretakerUser = this.userRepo.findById(caretakerId)
    if (!caretakerUser || !caretakerUser.isCaretaker()) {
      throw new Error("CARETAKER_NOT_FOUND: caretaker not found")
    }

    const caretakerProfile = caretakerUser.getCaretaker()
    if (!caretakerProfile) {
      throw new Error("CARETAKER_NOT_FOUND: caretaker profile not found")
    }

    // Check for time conflicts
    const existing = this.bookingRepo.findByCaretakerId(caretakerId)
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

    const id = this.bookingRepo.insert(booking)
    return new Booking({...booking.toDTO(), id: id})
  }

  public getListOfBookings(userId: UUID, role: RoleEnum, filter?: BookingFilter): Booking[] {
    if (role === RoleEnum.CARETAKER) {
      return this.bookingRepo.findByCaretakerId(userId, filter)
    }
    return this.bookingRepo.findByOwnerId(userId, filter)
  }

  public getBookingDetail(bookingId: string): Booking | undefined {
    return this.bookingRepo.findById(bookingId)
  }

  public updateBooking(bookingId: string, data: Partial<BookingDTO>): Booking {
    const booking = this.bookingRepo.findById(bookingId)
    if (!booking) throw new Error("NOT_FOUND: booking not found")
    booking.update(data)
    this.bookingRepo.save(booking)
    return booking
  }

  public cancelBooking(bookingId: string, requesterId: UUID): void {
    const booking = this.bookingRepo.findById(bookingId)
    if (!booking) throw new Error("NOT_FOUND: booking not found")
    booking.cancel(requesterId)
    this.bookingRepo.save(booking)
  }

  public confirmBooking(bookingId: string, caretakerId: UUID): Booking {
    const booking = this.bookingRepo.findById(bookingId)
    if (!booking) throw new Error("NOT_FOUND: booking not found")
    booking.confirm(caretakerId)
    this.bookingRepo.save(booking)
    return booking
  }

  public endSession(bookingId: string, caretakerId: UUID): Booking {
    const booking = this.bookingRepo.findById(bookingId)
    if (!booking) throw new Error("NOT_FOUND: booking not found")
    booking.end(caretakerId)
    this.bookingRepo.save(booking)
    return booking
  }

  public submitReview(bookingId: string, rating: number, comment: string, reviewType: string): Review {
    const booking = this.bookingRepo.findById(bookingId)
    if (!booking) throw new Error("NOT_FOUND: booking not found")
    const review = booking.addReview(rating, comment, reviewType)
    this.bookingRepo.save(booking)

    // Recalculate caretaker's average rating
    const caretakerId = new UUID(booking.getCaretakerId().toString())
    const caretakerUser = this.userRepo.findById(caretakerId)
    if (caretakerUser) {
      const profile = caretakerUser.getCaretaker()
      if (profile) {
        const dto = profile.toDTO()
        const newReviewCount = dto.reviewCount + 1
        const newRating = (dto.rating * dto.reviewCount + rating) / newReviewCount
        this.userRepo.updateAttrProfile(caretakerId, {
          rating: Math.round(newRating * 100) / 100,
          reviewCount: newReviewCount,
        })
      }
    }

    return review
  }
}
