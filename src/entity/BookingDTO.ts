import type {UUID} from "@type/uuid"
import type {Timestamp} from "@type/timestamp"
import type {BookingStatus, ServiceType} from "@type/booking"
import type {Review} from "@type/review"

export interface BookingDTO {
  id: string | undefined
  adultChildId: string
  seniorId: string
  caretakerId: string
  serviceType: ServiceType
  status: BookingStatus
  startDate: string
  endDate: string
  location: string
  note: string
  estimatedCost: number
  currency: string
  review: Review | null
  createdAt: Timestamp
}
