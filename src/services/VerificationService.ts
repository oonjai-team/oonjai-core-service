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

  public createVerification(
    uploaderId: UUID,
    providerId: UUID,
    uploaderType: UploaderType,
    docType: string,
    docFileRef: string
  ): Verification {
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

    const id = this.verificationRepo.insert(verification)
    return new Verification({ ...verification.toDTO(), id: id.toString() })
  }

  public getPendingVerifications(): Verification[] {
    return this.verificationRepo.findPending()
  }

  public approveVerification(verificationId: UUID, adminId: UUID): Verification {
    const verification = this.verificationRepo.findById(verificationId)
    if (!verification) throw new Error("NOT_FOUND: verification not found")

    verification.approve(adminId)
    this.verificationRepo.save(verification)

    // Side effect: set isVerified = true on the caretaker's profile
    const uploaderId = verification.getUploaderId()
    this.userRepo.updateAttrProfile(uploaderId, { isVerified: true })

    return verification
  }

  public rejectVerification(verificationId: UUID, adminId: UUID, reason: string): Verification {
    const verification = this.verificationRepo.findById(verificationId)
    if (!verification) throw new Error("NOT_FOUND: verification not found")

    verification.reject()
    this.verificationRepo.save(verification)

    return verification
  }
}
