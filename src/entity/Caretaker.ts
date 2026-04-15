import type {CareTakerUserAttributes, UserDTO, BookedSlot} from "@entity/UserDTO"

export class Caretaker {
  private bio: string
  private specialization: string
  private hourlyRate: number
  private currency: string
  private experience: number
  private rating: number
  private reviewCount: number
  private isVerified: boolean
  private isAvailable: boolean
  private contactInfo: string
  private permission: string
  private availability: Record<string, number[]> | undefined
  private bookedSlots: BookedSlot[]

  constructor(caretakerAttr: CareTakerUserAttributes)
  constructor(bio: string, specialization: string, hourlyRate: number, currency: string, experience: number, rating: number, reviewCount: number, isVerified: boolean, isAvailable: boolean, contactInfo: string, permission: string, availability?: Record<string, number[]>, bookedSlots?: BookedSlot[])

  constructor(...args: [CareTakerUserAttributes] | [string, string, number, string, number, number, number, boolean, boolean, string, string, Record<string, number[]>?, BookedSlot[]?]) {
    if (typeof args[0] === "object" && "bio" in args[0]) {
      const attr = args[0] as CareTakerUserAttributes
      this.bio = attr.bio
      this.specialization = attr.specialization
      this.hourlyRate = attr.hourlyRate
      this.currency = attr.currency
      this.experience = attr.experience
      this.rating = attr.rating
      this.reviewCount = attr.reviewCount
      this.isVerified = attr.isVerified
      this.isAvailable = attr.isAvailable
      this.contactInfo = attr.contactInfo
      this.permission = attr.permission
      this.availability = attr.availability
      this.bookedSlots = attr.bookedSlots ?? []
      return
    }

    const arr = args as [string, string, number, string, number, number, number, boolean, boolean, string, string, Record<string, number[]>?, BookedSlot[]?]
    this.bio = arr[0]
    this.specialization = arr[1]
    this.hourlyRate = arr[2]
    this.currency = arr[3]
    this.experience = arr[4]
    this.rating = arr[5]
    this.reviewCount = arr[6]
    this.isVerified = arr[7]
    this.isAvailable = arr[8]
    this.contactInfo = arr[9]
    this.permission = arr[10]
    this.availability = arr[11]
    this.bookedSlots = arr[12] ?? []
  }

  public toDTO(): CareTakerUserAttributes {
    return {
      bio: this.bio,
      specialization: this.specialization,
      hourlyRate: this.hourlyRate,
      currency: this.currency,
      experience: this.experience,
      rating: this.rating,
      reviewCount: this.reviewCount,
      isVerified: this.isVerified,
      isAvailable: this.isAvailable,
      contactInfo: this.contactInfo,
      permission: this.permission,
      availability: this.availability,
      bookedSlots: this.bookedSlots,
    }
  }

  /** Mark 1-hour slots as booked for a specific booking */
  public bookSlots(startDate: string, endDate: string, bookingId: string): void {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const cursor = new Date(start.getTime())
    while (cursor.getTime() < end.getTime()) {
      const dateStr = cursor.toISOString().split("T")[0] ?? ""
      this.bookedSlots.push({ date: dateStr, hour: cursor.getHours(), bookingId })
      cursor.setTime(cursor.getTime() + 60 * 60 * 1000)
    }
  }

  /** Remove booked slots for a cancelled booking */
  public releaseSlots(bookingId: string): void {
    this.bookedSlots = this.bookedSlots.filter(s => s.bookingId !== bookingId)
  }

  public setProfile(data: Partial<CareTakerUserAttributes>) {
    if (data.bio !== undefined) this.bio = data.bio
    if (data.specialization !== undefined) this.specialization = data.specialization
    if (data.hourlyRate !== undefined) this.hourlyRate = data.hourlyRate
    if (data.currency !== undefined) this.currency = data.currency
    if (data.contactInfo !== undefined) this.contactInfo = data.contactInfo
    if (data.availability !== undefined) this.availability = data.availability
    if (data.bookedSlots !== undefined) this.bookedSlots = data.bookedSlots
  }
}
