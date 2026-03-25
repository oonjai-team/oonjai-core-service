import type {UUID} from "@type/uuid"
import type {Timestamp} from "@type/timestamp"
import {RoleEnum} from "@type/user"
import type {UserDTO} from "@entity/UserDTO"
import {Caretaker} from "@entity/Caretaker"

export class User {
  protected id: UUID | undefined
  protected email: string
  protected firstname: string
  protected lastname: string
  protected createdAt: Timestamp
  protected caretaker?: Caretaker
  private role: RoleEnum

  constructor(userDTOLike: UserDTO)
  constructor(email: string, firtname: string, lastname: string, createdAt: Timestamp, role: RoleEnum, id?: UUID,
              caretaker?: Caretaker)

  constructor(...args: [UserDTO] | [string, string, string, Timestamp, RoleEnum, UUID?, Caretaker?]) {
    if (typeof args[0] === "object" && "email" in args[0]) {
      // its dto
      const dto = args[0] as UserDTO
      this.email = dto.email
      this.firstname = dto.firstname
      this.lastname = dto.lastname
      this.createdAt = dto.createdAt
      this.id = dto.id
      this.role = dto.role

      if (dto.role === RoleEnum.CARETAKER) {
        if (!dto.caretaker) return
        this.caretaker = new Caretaker(dto.caretaker)
      }
      return
    }

    const arr = args as [string, string, string, Timestamp,RoleEnum, UUID?, Caretaker?]
    this.email = arr[0]
    this.firstname = arr[1]
    this.lastname = arr[2]
    this.createdAt = arr[3]
    this.id = arr[5]
    this.role = arr[4]
    if (arr[4] === RoleEnum.CARETAKER) {
      if (!arr[4]) return
      this.caretaker = arr[6]
    }
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

  public isCaretaker() {
    return this.role === RoleEnum.CARETAKER
  }
  public isAdultChild() {
    return this.role === RoleEnum.ADULTCHILD
  }

  public setCaretaker(ct: Caretaker) {
    this.caretaker = ct
  }

  public isAdmin() {
    return this.role === RoleEnum.ADMIN
  }

  public getCaretaker(): Caretaker | undefined {
    return this.caretaker
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