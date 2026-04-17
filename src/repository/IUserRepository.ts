import type {User} from "../entity/User"
import type {UUID} from "../type/uuid"
import type {CaretakerFilter} from "@type/caretaker"
import type {AdultChildAttributes, CareTakerUserAttributes, UserDTO} from "@entity/UserDTO"

export interface IUserRepository {
  save(user: User): Promise<[boolean, UUID?]>
  delete(user: User): Promise<void>
  findById(id: UUID): Promise<User | undefined>
  findByEmail(email: string): Promise<User | undefined>
  findAvailableCaretaker(filter: CaretakerFilter): Promise<User[]>

  // update
  updateUser(id: UUID, data: Partial<Omit<UserDTO, "caretaker" | "adultChild">>): Promise<boolean>
  updateAttrProfile(id: UUID, data: Partial<CareTakerUserAttributes>): Promise<boolean>
  updateAdultChildProfile(id: UUID, data: Partial<AdultChildAttributes>): Promise<boolean>
}
