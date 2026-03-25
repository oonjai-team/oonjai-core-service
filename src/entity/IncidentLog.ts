import {UUID} from "@type/uuid"
import type {Timestamp} from "@type/timestamp"
import type {IncidentLogDTO, IncidentType, IncidentStatus} from "@entity/IncidentLogDTO"

export class IncidentLog {
  private id: UUID | undefined
  private bookingId: string
  private seniorId: UUID
  private incidentType: IncidentType
  private detail: string
  private status: IncidentStatus
  private createdAt: Timestamp

  constructor(dto: IncidentLogDTO)
  constructor(bookingId: string, seniorId: UUID, incidentType: IncidentType, detail: string, status: IncidentStatus, createdAt: Timestamp, id?: UUID)

  constructor(
    ...args: [IncidentLogDTO] | [string, UUID, IncidentType, string, IncidentStatus, Timestamp, UUID?]
  ) {
    if (typeof args[0] === "object" && "bookingId" in args[0]) {
      const dto = args[0] as IncidentLogDTO
      this.id = dto.id ? new UUID(dto.id) : undefined
      this.bookingId = dto.bookingId
      this.seniorId = new UUID(dto.seniorId)
      this.incidentType = dto.incidentType
      this.detail = dto.detail
      this.status = dto.status
      this.createdAt = dto.createdAt
      return
    }

    const arr = args as [string, UUID, IncidentType, string, IncidentStatus, Timestamp, UUID?]
    this.bookingId = arr[0]
    this.seniorId = arr[1]
    this.incidentType = arr[2]
    this.detail = arr[3]
    this.status = arr[4]
    this.createdAt = arr[5]
    this.id = arr[6]
  }

  public isNew(): boolean {
    return !this.id
  }

  public getId(): UUID | undefined {
    return this.id
  }

  public getBookingId(): string {
    return this.bookingId
  }

  public getSeniorId(): UUID {
    return this.seniorId
  }

  public getStatus(): IncidentStatus {
    return this.status
  }

  public updateStatus(newStatus: IncidentStatus): void {
    if (this.status !== "noted") {
      throw new Error("INVALID_TRANSITION: can only transition from 'noted'")
    }
    if (newStatus === "noted") {
      throw new Error("INVALID_TRANSITION: cannot transition to the same status")
    }
    this.status = newStatus
  }

  public updateDetail(detail: string): void {
    this.detail = detail
  }

  public toDTO(): IncidentLogDTO {
    return {
      id: this.id?.toString(),
      bookingId: this.bookingId,
      seniorId: this.seniorId.toString(),
      incidentType: this.incidentType,
      detail: this.detail,
      status: this.status,
      createdAt: this.createdAt,
    }
  }
}
