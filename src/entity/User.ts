import type {UUID} from "@type/uuid"
import type {Timestamp} from "@type/timestamp"
import type {RoleEnum} from "@type/user"
import type {UserDTO} from "@entity/UserDTO"

export class User {
  private id: UUID | undefined
  private email: string
  private firstname: string
  private lastname: string
  private createdAt: Timestamp
  private role: RoleEnum


  constructor(userDTOLike: UserDTO)
  constructor(email: string, firtname: string, lastname: string, createdAt: Timestamp, role: RoleEnum, id?: UUID)

  constructor(...args: [UserDTO] | [string, string, string, Timestamp, RoleEnum, UUID?]) {
    if (typeof args[0] === "object" && "email" in args[0]) {
      // its dto
      const dto = args[0] as UserDTO
      this.role = dto.role
      this.email = dto.email
      this.firstname = dto.firstname
      this.lastname = dto.lastname
      this.createdAt = dto.createdAt
      this.id = dto.id
      return
    }

    const arr = args as [string, string, string, Timestamp, RoleEnum, UUID?]
    this.email = arr[0]
    this.firstname = arr[1]
    this.lastname = arr[2]
    this.createdAt = arr[3]
    this.role = arr[4]
    this.id = arr[5]
  }

  public isNew(): boolean {
    return !this.id
  }

  public setFirstname(firstname: string) {
    this.firstname = firstname
  }

  public setLastname(lastname: string) {
    this.lastname = lastname
  }

  public setEmail(email: string) {
    //TODO Email validation domain logics
    this.email = email
  }

  public getId(): UUID | undefined {
    return this.id
  }

  public toDTO(): UserDTO {
    return {
      email: this.email,
      firstname: this.firstname,
      lastname: this.lastname,
      role: this.role,
      createdAt: this.createdAt,
      id: this.id
    }
  }
}