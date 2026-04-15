import type { IVerificationRepository } from "@repo/IVerificationRepository"
import type { ITestDatabase } from "../lib/TestDatabase"
import { Verification } from "@entity/Verification"
import { UUID } from "@type/uuid"
import { UploaderType } from "@type/verification"

export class TestVerificationRepository implements IVerificationRepository {
  constructor(private db: ITestDatabase) {}

  async findById(id: UUID): Promise<Verification | undefined> {
    try {
      const record = this.db.get("verification", id)
      return this.reconstruct(record)
    } catch {
      return undefined
    }
  }

  async findPending(): Promise<Verification[]> {
    return this.db
      .getAll("verification")
      .filter((r) => r.status === "pending")
      .map((r) => this.reconstruct(r))
  }

  async insert(verification: Verification): Promise<UUID> {
    return this.db.insert("verification", verification.toDTO())
  }

  async save(verification: Verification): Promise<boolean> {
    const id = verification.getId()
    if (!id) throw new Error("Cannot save a verification without an id")
    return this.db.update("verification", id, verification.toDTO())
  }

  private reconstruct(record: any): Verification {
    return new Verification({
      id: record.id,
      uploaderId: record.uploaderId,
      providerId: record.providerId,
      uploaderType: record.uploaderType as UploaderType,
      docType: record.docType,
      docFileRef: record.docFileRef,
      status: record.status,
      approvedByAdmin: record.approvedByAdmin ?? null,
      approvalDate: record.approvalDate ?? null,
      createdAt: record.createdAt,
    })
  }
}
