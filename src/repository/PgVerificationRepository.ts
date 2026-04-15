import type {IVerificationRepository} from "@repo/IVerificationRepository"
import {Verification} from "@entity/Verification"
import {UUID} from "@type/uuid"
import {Timestamp} from "@type/timestamp"
import {UploaderType} from "@type/verification"
import sql from "../lib/postgres"

export class PgVerificationRepository implements IVerificationRepository {

  async findById(id: UUID): Promise<Verification | undefined> {
    const rows = await sql`
      SELECT * FROM "VERIFICATION" WHERE "VerificationID" = ${id.toString()}
    `
    const row = rows[0]
    if (!row) return undefined
    return this.toEntity(row)
  }

  async findPending(): Promise<Verification[]> {
    const rows = await sql`
      SELECT * FROM "VERIFICATION" WHERE "Status" = 'pending'
    `
    return rows.map(row => this.toEntity(row))
  }

  async insert(verification: Verification): Promise<UUID> {
    const dto = verification.toDTO()
    const rows = await sql`
      INSERT INTO "VERIFICATION" (
        "UploaderID", "ProviderID", "UploaderType", "DocType",
        "DocFileRef", "Status", "ApprovedBy", "ApprovalDate", "CreatedDate"
      )
      VALUES (
        ${dto.uploaderId}, ${dto.providerId}, ${dto.uploaderType},
        ${dto.docType}, ${dto.docFileRef}, ${dto.status},
        ${dto.approvedByAdmin}, ${dto.approvalDate}, ${new Date(dto.createdAt)}
      )
      RETURNING "VerificationID"
    `
    return new UUID(rows[0]!.VerificationID)
  }

  async save(verification: Verification): Promise<boolean> {
    const dto = verification.toDTO()
    if (!dto.id) return false
    const result = await sql`
      UPDATE "VERIFICATION"
      SET "UploaderID"   = ${dto.uploaderId},
          "ProviderID"   = ${dto.providerId},
          "UploaderType" = ${dto.uploaderType},
          "DocType"      = ${dto.docType},
          "DocFileRef"   = ${dto.docFileRef},
          "Status"       = ${dto.status},
          "ApprovedBy"   = ${dto.approvedByAdmin},
          "ApprovalDate" = ${dto.approvalDate}
      WHERE "VerificationID" = ${dto.id}
    `
    return result.count > 0
  }

  private toEntity(row: Record<string, any>): Verification {
    return new Verification({
      id: row.VerificationID,
      uploaderId: row.UploaderID,
      providerId: row.ProviderID,
      uploaderType: row.UploaderType as UploaderType,
      docType: row.DocType,
      docFileRef: row.DocFileRef,
      status: row.Status,
      approvedByAdmin: row.ApprovedBy ?? null,
      approvalDate: row.ApprovalDate ? new Date(row.ApprovalDate).toISOString() : null,
      createdAt: new Date(row.CreatedDate).getTime(),
    })
  }
}
