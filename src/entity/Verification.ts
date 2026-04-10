import { UUID } from "@type/uuid"
import { Timestamp, TimestampHelper } from "@type/timestamp"
import { UploaderType } from "@type/verification"
import type { VerificationDTO } from "@entity/VerificationDTO"

export class Verification {
  private id: UUID | undefined
  private uploaderId: UUID
  private providerId: UUID
  private uploaderType: UploaderType
  private docType: string
  private docFileRef: string
  private status: string
  private approvedByAdmin: UUID | null
  private approvalDate: string | null
  private createdAt: Timestamp

  constructor(dto: VerificationDTO)
  constructor(
    uploaderId: UUID,
    providerId: UUID,
    uploaderType: UploaderType,
    docType: string,
    docFileRef: string,
    status: string,
    approvedByAdmin: UUID | null,
    approvalDate: string | null,
    createdAt: Timestamp,
    id?: UUID
  )

  constructor(
    ...args:
      | [VerificationDTO]
      | [UUID, UUID, UploaderType, string, string, string, UUID | null, string | null, Timestamp, UUID?]
  ) {
    if (typeof args[0] === "object" && "uploaderId" in args[0]) {
      const dto = args[0] as VerificationDTO
      this.id = dto.id ? new UUID(dto.id) : undefined
      this.uploaderId = new UUID(dto.uploaderId)
      this.providerId = new UUID(dto.providerId)
      this.uploaderType = dto.uploaderType
      this.docType = dto.docType
      this.docFileRef = dto.docFileRef
      this.status = dto.status
      this.approvedByAdmin = dto.approvedByAdmin ? new UUID(dto.approvedByAdmin) : null
      this.approvalDate = dto.approvalDate
      this.createdAt = new Timestamp(dto.createdAt)
      return
    }

    const arr = args as [UUID, UUID, UploaderType, string, string, string, UUID | null, string | null, Timestamp, UUID?]
    this.uploaderId = arr[0]
    this.providerId = arr[1]
    this.uploaderType = arr[2]
    this.docType = arr[3]
    this.docFileRef = arr[4]
    this.status = arr[5]
    this.approvedByAdmin = arr[6]
    this.approvalDate = arr[7]
    this.createdAt = arr[8]
    this.id = arr[9]
  }

  public isNew(): boolean {
    return !this.id
  }

  public getId(): UUID | undefined {
    return this.id
  }

  public getUploaderId(): UUID {
    return this.uploaderId
  }

  public approve(adminId: UUID): void {
    this.status = "verified"
    this.approvedByAdmin = adminId
    this.approvalDate = new Date().toISOString()
  }

  public reject(): void {
    this.status = "rejected"
  }

  public toDTO(): VerificationDTO {
    return {
      id: this.id?.toString(),
      uploaderId: this.uploaderId.toString(),
      providerId: this.providerId.toString(),
      uploaderType: this.uploaderType,
      docType: this.docType,
      docFileRef: this.docFileRef,
      status: this.status,
      approvedByAdmin: this.approvedByAdmin?.toString() ?? null,
      approvalDate: this.approvalDate,
      createdAt: this.createdAt.getTime(),
    }
  }
}
