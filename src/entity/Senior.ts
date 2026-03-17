import type {UUID} from "@type/uuid"
import type {Timestamp} from "@type/timestamp"
import type {SeniorDTO} from "@entity/SeniorDTO"

export class Senior {
  private id: UUID | undefined
  private adultChildId: UUID
  private fullname: string
  private dateOfBirth: string
  private mobilityLevel: string
  private healthNote: string
  private createdAt: Timestamp

  constructor(seniorDTOLike: SeniorDTO)
  constructor(adultChildId: UUID, fullname: string, dateOfBirth: string, mobilityLevel: string, healthNote: string, createdAt: Timestamp, id?: UUID)

  constructor(...args: [SeniorDTO] | [UUID, string, string, string, string, Timestamp, UUID?]) {
    if (typeof args[0] === "object" && "adultChildId" in args[0]) {
      const dto = args[0] as SeniorDTO
      this.adultChildId = dto.adultChildId
      this.fullname = dto.fullname
      this.dateOfBirth = dto.dateOfBirth
      this.mobilityLevel = dto.mobilityLevel
      this.healthNote = dto.healthNote
      this.createdAt = dto.createdAt
      this.id = dto.id
      return
    }

    const arr = args as [UUID, string, string, string, string, Timestamp, UUID?]
    this.adultChildId = arr[0]
    this.fullname = arr[1]
    this.dateOfBirth = arr[2]
    this.mobilityLevel = arr[3]
    this.healthNote = arr[4]
    this.createdAt = arr[5]
    this.id = arr[6]
  }

  public isNew(): boolean {
    return !this.id
  }

  public getId(): UUID | undefined {
    return this.id
  }

  public toDTO(): SeniorDTO {
    return {
      adultChildId: this.adultChildId,
      fullname: this.fullname,
      dateOfBirth: this.dateOfBirth,
      mobilityLevel: this.mobilityLevel,
      healthNote: this.healthNote,
      createdAt: this.createdAt,
      id: this.id
    }
  }

  public setAdultChildId(id: UUID) {
    this.adultChildId = id
  }
}