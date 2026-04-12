import type {IUserRepository} from "@repo/IUserRepository"
import {TimestampHelper} from "@type/timestamp"
import {User} from "@entity/User"
import {Caretaker} from "@entity/Caretaker"
import {RoleEnum} from "@type/user"
import type {UUID} from "@type/uuid"
import type {IService} from "@serv/IService"
import type {CareTakerUserAttributes, PartialUserDTO, UserDTO} from "@entity/UserDTO"
import type {CaretakerFilter} from "@type/caretaker"

export class UserService implements IService {

  private userRepo: IUserRepository

  constructor(userRepo: IUserRepository) {
    this.userRepo = userRepo
  }

  public getServiceId(): string {
    return "UserService"
  }

  public createUser(email: string, firstname: string, lastname: string, role: RoleEnum): UUID {
    const timestamp = TimestampHelper.now()
    const createdUser = new User(email, firstname, lastname, timestamp, role)
    const [ok, uuid] = this.userRepo.save(createdUser)
    if (ok && uuid) {
      return uuid
    }
    throw new Error("Failed to save caretaker user")
  }

  public createCaretaker(email: string, firstname: string, lastname: string, attr: CareTakerUserAttributes): UUID {
    const caretaker = new Caretaker(
      attr.bio, attr.specialization, attr.hourlyRate, attr.currency,
      attr.experience, attr.rating, attr.reviewCount, attr.isVerified,
      attr.isAvailable, attr.contactInfo, attr.permission
    )

    const [ok, uuid] = this.userRepo.save(new User(email, firstname, lastname, TimestampHelper.now(), RoleEnum.CARETAKER, undefined, caretaker))
    if (ok && uuid) {
      return uuid
    }
    throw new Error("Failed to save caretaker user")
  }

  public getUserById(id: UUID): User | undefined {
    return this.userRepo.findById(id)
  }

  public findUserByEmail(email: string): User | undefined {
    return this.userRepo.findByEmail(email)
  }

  public getAvailableCaretakers(filters: CaretakerFilter): User[] {
    const available = this.userRepo.findAvailableCaretaker(filters)
    if (!available) {
      return []
    }
    return available
  }

  public updateUser(id: UUID, data: PartialUserDTO) {
    const copy = {...data}
    if (copy.caretaker) {
      this.userRepo.updateAttrProfile(id, copy.caretaker)
      // @ts-ignore
      delete copy["caretaker"]
    }
    this.userRepo.updateUser(id, copy)
  }
}