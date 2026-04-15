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

  public async createUser(email: string, firstname: string, lastname: string, role: RoleEnum): Promise<UUID> {
    const timestamp = TimestampHelper.now()
    const createdUser = new User(email, firstname, lastname, timestamp, role)
    const [ok, uuid] = await this.userRepo.save(createdUser)
    if (ok && uuid) {
      return uuid
    }
    throw new Error("Failed to save caretaker user")
  }

  public async createCaretaker(email: string, firstname: string, lastname: string, attr: CareTakerUserAttributes): Promise<UUID> {
    const caretaker = new Caretaker(
      attr.bio, attr.specialization, attr.hourlyRate, attr.currency,
      attr.experience, attr.rating, attr.reviewCount, attr.isVerified,
      attr.isAvailable, attr.contactInfo, attr.permission
    )

    const [ok, uuid] = await this.userRepo.save(new User(email, firstname, lastname, TimestampHelper.now(), RoleEnum.CARETAKER, undefined, caretaker))
    if (ok && uuid) {
      return uuid
    }
    throw new Error("Failed to save caretaker user")
  }

  public async getUserById(id: UUID): Promise<User | undefined> {
    return this.userRepo.findById(id)
  }

  public async findUserByEmail(email: string): Promise<User | undefined> {
    return this.userRepo.findByEmail(email)
  }

  public async getAvailableCaretakers(filters: CaretakerFilter): Promise<User[]> {
    const available = await this.userRepo.findAvailableCaretaker(filters)
    if (!available) {
      return []
    }
    return available
  }

  public async updateUser(id: UUID, data: PartialUserDTO) {
    const copy = {...data}
    if (copy.caretaker) {
      await this.userRepo.updateAttrProfile(id, copy.caretaker)
      delete copy.caretaker
    }
    if (copy.adultChild) {
      await this.userRepo.updateAdultChildProfile(id, copy.adultChild)
      delete copy.adultChild
    }
    await this.userRepo.updateUser(id, copy)
  }
}
