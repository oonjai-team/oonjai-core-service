import {UUID} from "@type/uuid"
import type {Timestamp} from "@type/timestamp"
import type {StatusLogDTO} from "@entity/StatusLogDTO"
import type {CareSessionStatus} from "@type/careSession"

export class StatusLog {
private id: UUID | undefined
private bookingId: string
private statusType: CareSessionStatus
private notes: string
private photoUrl: string | null
private createdAt: Timestamp

constructor(statusLogDTOLike: StatusLogDTO)
  constructor(bookingId: string, statusType: CareSessionStatus, notes: string, photoUrl: string | null, createdAt: Timestamp, id?: UUID)

  constructor(...args: [StatusLogDTO] | [string, CareSessionStatus, string, string | null, Timestamp, UUID?]) {
    if (typeof args[0] === "object" && "bookingId" in args[0]) {
      const dto = args[0] as StatusLogDTO
      this.id = new UUID(dto.id)
      this.bookingId = dto.bookingId
      this.statusType = dto.statusType
      this.notes = dto.notes
      this.photoUrl = dto.photoUrl
      this.createdAt = dto.createdAt
      return
    }

    const arr = args as [string, CareSessionStatus, string, string | null, Timestamp, UUID?]
    this.bookingId = arr[0]
    this.statusType = arr[1]
    this.notes = arr[2]
    this.photoUrl = arr[3]
    this.createdAt = arr[4]
    this.id = arr[5]
  }

  public isNew(): boolean {
    return !this.id
  }

  public getId(): UUID | undefined {
    return this.id
  }

  public toDTO(): StatusLogDTO {
    return {
      id: this.id?.toString(),
      bookingId: this.bookingId,
      statusType: this.statusType,
      notes: this.notes,
      photoUrl: this.photoUrl,
      createdAt: this.createdAt,
    }
  }
}