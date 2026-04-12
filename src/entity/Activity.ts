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
  private startDate: string
  private endDate: string
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
    ...args: [ActivityDTO]
  ) {
    const dto = args[0] as ActivityDTO
    this.id = dto.id ? new UUID(dto.id) : undefined
    this.title = dto.title
    this.category = dto.category
    this.tags = dto.tags
    this.host = dto.host
    this.hostAvatar = dto.hostAvatar
    this.hostDescription = dto.hostDescription
    this.startDate = dto.startDate
    this.endDate = dto.endDate
    this.location = dto.location
    this.price = dto.price
    this.participantCount = dto.participantCount ?? 0
    this.duration = dto.duration
    this.maxPeople = dto.maxPeople
    this.rating = dto.rating
    this.reviews = dto.reviews
    this.images = dto.images
    this.createdAt = dto.createdAt
  }

  public isNew(): boolean {
    return !this.id
  }

  public getId(): UUID | undefined {
    return this.id
  }

  public getStartDate(): string {
    return this.startDate
  }

  public getEndDate(): string {
    return this.endDate
  }

  public addParticipants(count: number): void {
    if (count <= 0) throw new Error("INVALID: participant count must be positive")
    if (this.participantCount + count > this.maxPeople) {
      throw new Error("FULL: not enough spots left for this activity")
    }
    this.participantCount += count
  }

  /** Format start/end timestamps into a human-readable display string.
   *  Uses UTC methods since timestamps are stored as UTC representing local activity time. */
  private formatDisplayDate(): string {
    const start = new Date(this.startDate)
    const end = new Date(this.endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return this.startDate // fallback to raw string if unparseable
    }

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    const dayName = dayNames[start.getUTCDay()]
    const month = monthNames[start.getUTCMonth()]
    const day = start.getUTCDate()

    const formatTime = (d: Date) => {
      const h = d.getUTCHours()
      const m = d.getUTCMinutes()
      const ampm = h >= 12 ? "PM" : "AM"
      const h12 = h % 12 || 12
      return `${h12.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`
    }

    return `${dayName}, ${month} ${day} • ${formatTime(start)} - ${formatTime(end)}`
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
      startDate: this.startDate,
      endDate: this.endDate,
      displayDate: this.formatDisplayDate(),
      location: this.location,
      price: this.price,
      participantCount: this.participantCount,
      duration: this.duration,
      maxPeople: this.maxPeople,
      rating: this.rating,
      reviews: this.reviews,
      images: this.images,
      createdAt: this.createdAt,
    }
  }
}
