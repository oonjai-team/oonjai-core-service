import type { Verification } from "@entity/Verification"
import type { UUID } from "@type/uuid"

export interface IVerificationRepository {
  findById(id: UUID): Promise<Verification | undefined>
  findPending(): Promise<Verification[]>
  insert(verification: Verification): Promise<UUID>
  save(verification: Verification): Promise<boolean>
}
