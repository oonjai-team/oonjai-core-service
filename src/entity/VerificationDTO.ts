import type { UploaderType } from "@type/verification"

export interface VerificationDTO {
  id: string | undefined
  uploaderId: string
  providerId: string
  uploaderType: UploaderType
  docType: string
  docFileRef: string
  status: string
  approvedByAdmin: string | null
  approvalDate: string | null
  createdAt: number
}
