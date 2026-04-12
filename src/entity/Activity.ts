import {UUID} from "@type/uuid"
import type {Timestamp} from "@type/timestamp"
import type {ActivityDTO} from "@entity/ActivityDTO"

export class Activity {
  private id?: UUID
  private title: string
  private category: string
  private tags: string[]
  private host: string
  private hostAvatar: string
  private hostDescription: string
  private date: string
  private location: string
  private price: number
  private participantCount: number
  private duration: string
  private maxPeople: number
  private rating: number
  private reviews: number
  private images: string[]
  private createdAt: Timestamp

  constructor(dto: ActivityDTO)
  constructor(
    title: string, category: string, tags: string[],
    host: string, hostAvatar: string, hostDescription: string,
    date: string, location: string, price: number,
    spotsLeft: number, duration: string, maxPeople: number,
    rating: number, reviews: number, images: string[],
    createdAt: Timestamp, id?: UUID
  )

  constructor(
    ...args:
      | [ActivityDTO]
      | [string, string, string[], string, string, string, string, string, number, number, string, number, number, number, string[], Timestamp, UUID?]
  ) {
    if (typeof args[0] === "object" && "title" in args[0]) {
      const dto = args[0] as ActivityDTO
      this.id = dto.id ? new UUID(dto.id) : undefined
      this.title = dto.title
      this.category = dto.category
      this.tags = dto.tags
      this.host = dto.host
      this.hostAvatar = dto.hostAvatar
      this.hostDescription = dto.hostDescription
      this.date = dto.date
      this.location = dto.location
      this.price = dto.price
      this.participantCount = dto.participantCount ?? (dto.maxPeople - (dto.spotsLeft ?? dto.maxPeople))
      this.duration = dto.duration
      this.maxPeople = dto.maxPeople
      this.rating = dto.rating
      this.reviews = dto.reviews
      this.images = dto.images
      this.createdAt = dto.createdAt
      return
    }

    const arr = args as [string, string, string[], string, string, string, string, string, number, number, string, number, number, number, string[], Timestamp, UUID?]
    this.title = arr[0]
    this.category = arr[1]
    this.tags = arr[2]
    this.host = arr[3]
    this.hostAvatar = arr[4]
    this.hostDescription = arr[5]
    this.date = arr[6]
    this.location = arr[7]
    this.price = arr[8]
    this.participantCount = arr[9]
    this.duration = arr[10]
    this.maxPeople = arr[11]
    this.rating = arr[12]
    this.reviews = arr[13]
    this.images = arr[14]
    this.createdAt = arr[15]
    this.id = arr[16]
  }

  public isNew(): boolean {
    return !this.id
  }

  public getId(): UUID | undefined {
    return this.id
  }

  public toDTO(): ActivityDTO {
    return {
      id: this.id?.toString(),
      title: this.title,
      category: this.category,
      tags: this.tags,
      host: this.host,
      hostAvatar: this.hostAvatar,
      hostDescription: this.hostDescription,
      date: this.date,
      location: this.location,
      price: this.price,
      participantCount: this.participantCount,
      spotsLeft: Math.max(0, this.maxPeople - this.participantCount),
      duration: this.duration,
      maxPeople: this.maxPeople,
      rating: this.rating,
      reviews: this.reviews,
      images: this.images,
      createdAt: this.createdAt,
    }
  }
}
