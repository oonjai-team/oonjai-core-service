import type {UUID} from "@type/uuid"
import type {Timestamp} from "@type/timestamp"
import type {RoleEnum} from "@type/user"


export interface UserDTO{
  id: UUID | undefined
  email: string
  firstname: string
  lastname: string
  createdAt: Timestamp
  role: RoleEnum
  caretaker?: CareTakerUserAttributes
}

export type PartialUserDTO = Partial<Omit<UserDTO, "caretaker"> & {caretaker?: Partial<CareTakerUserAttributes>}>

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
}
