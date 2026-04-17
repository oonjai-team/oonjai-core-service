import type {CareTakerUserAttributes} from "@entity/UserDTO"

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

  constructor(caretakerAttr: CareTakerUserAttributes)
  constructor(bio: string, specialization: string, hourlyRate: number, currency: string, experience: number, rating: number, reviewCount: number, isVerified: boolean, isAvailable: boolean, contactInfo: string, permission: string)

  constructor(...args: [CareTakerUserAttributes] | [string, string, number, string, number, number, number, boolean, boolean, string, string]) {
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
      return
    }

    const arr = args as [string, string, number, string, number, number, number, boolean, boolean, string, string]
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
    }
  }

  public setProfile(data: Partial<CareTakerUserAttributes>) {
    if (data.bio !== undefined) this.bio = data.bio
    if (data.specialization !== undefined) this.specialization = data.specialization
    if (data.hourlyRate !== undefined) this.hourlyRate = data.hourlyRate
    if (data.currency !== undefined) this.currency = data.currency
    if (data.contactInfo !== undefined) this.contactInfo = data.contactInfo
  }
}
