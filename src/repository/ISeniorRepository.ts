import type {User} from "../entity/User"
import type {UUID} from "../type/uuid"
import type {Senior} from "../entity/Senior"

export interface ISeniorRepository {
  save(senior: Senior): boolean
  findById(id: UUID): Senior | undefined
  findAllByAdultChildId(adultChildId: UUID): Senior[]
  insert(senior: Senior): UUID
  delete(senior: Senior): void
}