import type { IVerificationRepository } from "@repo/IVerificationRepository"
import type { IUserRepository } from "@repo/IUserRepository"
import type { IService } from "@serv/IService"
import { Verification } from "@entity/Verification"
import { UploaderType } from "@type/verification"
import { UUID } from "@type/uuid"
import { TimestampHelper } from "@type/timestamp"

const VALID_DOC_TYPES = ["national_id", "nursing_license", "background_check", "work_permit"]

export class VerificationService implements IService {
  constructor(
    private verificationRepo: IVerificationRepository,
    private userRepo: IUserRepository
  ) {}

  public getServiceId(): string {
    return "VerificationService"
  }

  public async createVerification(
    uploaderId: UUID,
    providerId: UUID,
    uploaderType: UploaderType,
    docType: string,
    docFileRef: string
  ): Promise<Verification> {
    if (!VALID_DOC_TYPES.includes(docType)) {
      throw new Error(`INVALID_DOC_TYPE: docType must be one of: ${VALID_DOC_TYPES.join(", ")}`)
    }

    const verification = new Verification(
      uploaderId,
      providerId,
      uploaderType,
      docType,
      docFileRef,
      "pending",
      null,
      null,
      TimestampHelper.now()
    )

    const id = await this.verificationRepo.insert(verification)
    return new Verification({ ...verification.toDTO(), id: id.toString() })
  }

  public async getPendingVerifications(): Promise<Verification[]> {
    return this.verificationRepo.findPending()
  }

  public async approveVerification(verificationId: UUID, adminId: UUID): Promise<Verification> {
    const verification = await this.verificationRepo.findById(verificationId)
    if (!verification) throw new Error("NOT_FOUND: verification not found")

    verification.approve(adminId)
    await this.verificationRepo.save(verification)

    // Side effect: set isVerified = true on the caretaker's profile
    const uploaderId = verification.getUploaderId()
    await this.userRepo.updateAttrProfile(uploaderId, { isVerified: true })

    return verification
  }

  public async rejectVerification(verificationId: UUID, adminId: UUID, reason: string): Promise<Verification> {
    const verification = await this.verificationRepo.findById(verificationId)
    if (!verification) throw new Error("NOT_FOUND: verification not found")

    verification.reject()
    await this.verificationRepo.save(verification)

    return verification
  }
}
