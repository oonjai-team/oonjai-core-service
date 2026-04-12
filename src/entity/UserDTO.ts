import type {UUID} from "@type/uuid"
import type {Timestamp} from "@type/timestamp"
import type {RoleEnum} from "@type/user"


export interface UserDTO{
  id: string | undefined
  email: string
  firstname: string
  lastname: string
  createdAt: Timestamp
  role: RoleEnum
  caretaker?: CareTakerUserAttributes
  adultChild?: AdultChildAttributes
}

export type PartialUserDTO = Partial<Omit<UserDTO, "caretaker" | "adultChild"> & {
  caretaker?: Partial<CareTakerUserAttributes>
  adultChild?: Partial<AdultChildAttributes>
}>

export interface AdultChildAttributes {
  phone: string
  relationship: string
  goal: string
  concerns: string[]
}

export interface CareTakerUserAttributes {
  bio: string
  specialization: string
  hourlyRate: number
  currency: string
  experience: number
  rating: number
  reviewCount: number
  isVerified: boolean
  isAvailable: boolean
  contactInfo: string
  permission: string
  availability?: Record<string, number[]>
  bookedSlots?: BookedSlot[]
}

export interface BookedSlot {
  date: string       // ISO date e.g. "2026-04-15"
  hour: number       // 0-23
  bookingId: string
}
