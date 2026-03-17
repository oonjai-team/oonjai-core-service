import type {User} from "../entity/User"
import type {UUID} from "../type/uuid"

export interface IUserRepository {
  save(user: User): boolean
  delete(user: User): void
  insert(user: User): UUID
  findById(id: UUID): User | undefined
}