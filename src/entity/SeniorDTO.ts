import type {UUID} from "@type/uuid"
import type {Timestamp} from "@type/timestamp"

export interface SeniorDTO {
  id: string | undefined
  adultChildId: string
  fullname: string
  dateOfBirth: string
  mobilityLevel: string
  healthNote: string
  createdAt: Timestamp
}