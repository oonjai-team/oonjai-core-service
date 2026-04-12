import type {Timestamp} from "@type/timestamp"

export interface ActivityDTO {
  id: string | undefined
  title: string
  category: string
  tags: string[]
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
