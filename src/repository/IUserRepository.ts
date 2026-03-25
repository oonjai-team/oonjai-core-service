import type {User} from "../entity/User"
import type {UUID} from "../type/uuid"
import type {CaretakerFilter} from "@type/caretaker"
import type {CareTakerUserAttributes, PartialUserDTO, UserDTO} from "@entity/UserDTO"

export interface IUserRepository {
  save(user: User): [boolean, UUID?]
  delete(user: User): void
  findById(id: UUID): User | undefined
  findByEmail(email: string): User | undefined
  findAvailableCaretaker(filter: CaretakerFilter): User[] | undefined

  // update
  updateUser(id: UUID, data: Partial<Omit<UserDTO, "caretaker">>): boolean
  updateAttrProfile(id: UUID, data: Partial<CareTakerUserAttributes>): boolean
}