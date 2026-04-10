import type { Verification } from "@entity/Verification"
import type { UUID } from "@type/uuid"

export interface IVerificationRepository {
  findById(id: UUID): Verification | undefined
  findPending(): Verification[]
  insert(verification: Verification): UUID
  save(verification: Verification): boolean
}
