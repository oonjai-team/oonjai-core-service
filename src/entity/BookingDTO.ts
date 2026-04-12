import type {Timestamp} from "@type/timestamp"
import type {BookingStatus, ServiceType} from "@type/booking"
import type {ReviewDTO} from "@entity/ReviewDTO"

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
  review: ReviewDTO | null
  createdAt: Timestamp
}
