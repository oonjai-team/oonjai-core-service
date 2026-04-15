import type {UUID} from "../type/uuid"
import type {Senior} from "../entity/Senior"

export interface ISeniorRepository {
  save(senior: Senior): Promise<boolean>
  findById(id: UUID): Promise<Senior | undefined>
  findAllByAdultChildId(adultChildId: UUID): Promise<Senior[]>
  insert(senior: Senior): Promise<UUID>
  delete(senior: Senior): Promise<void>
}
