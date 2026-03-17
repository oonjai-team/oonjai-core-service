import type {IUserRepository} from "@repo/IUserRepository"
import {TimestampHelper} from "../type/timestamp"
import {User} from "@entity/User"
import type {RoleEnum} from "../type/user"
import type {UUID} from "../type/uuid"
import type {IService} from "@serv/IService"

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
    return this.userRepo.insert(createdUser)
  }

  public getUserById(id: UUID): User | undefined {
    return this.userRepo.findById(id)
  }

  public updateUser(id: UUID, data: {firstname?: string, lastname?: string, email?: string}) {
    const user = this.userRepo.findById(id)
    if (!user) {
      return
    }

    if (data.firstname) {
      user.setFirstname(data.firstname)
    }
    if (data.lastname) {
      user.setLastname(data.lastname)
    }
    if (data.email) {
      user.setEmail(data.email)
    }

    this.userRepo.save(user)
  }
}