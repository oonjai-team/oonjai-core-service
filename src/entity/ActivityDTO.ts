import type {Timestamp} from "@type/timestamp"

export interface ActivityDTO {
  id: string | undefined
  title: string
  category: string
  tags: string[]

  // Host — canonical source is Point_of_Contact + PROVIDER (joined on read).
  // Only pocId is persisted on ACTIVITY; the rest is loaded via JOIN.
  pocId: string | undefined
  hostFirstName: string | undefined
  hostLastName: string | undefined
  hostPhoneNumber: string | undefined
  providerId: string | undefined
  providerName: string | undefined
  // Derived display fields (computed in Activity.toDTO).
  host: string
  hostAvatar: string
  hostDescription: string

  startDate: string
  endDate: string
  displayDate: string
  location: string
  price: number
  participantCount: number
  duration: string
  maxPeople: number
  rating: number
  reviews: number
  images: string[]
  createdAt: Timestamp
}
