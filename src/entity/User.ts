import {UUID} from "@type/uuid"
import type {Timestamp} from "@type/timestamp"
import {RoleEnum} from "@type/user"
import type {UserDTO} from "@entity/UserDTO"
import {Caretaker} from "@entity/Caretaker"
import {AdultChild} from "@entity/AdultChild"

export class User {
  protected id: UUID | undefined
  protected email: string
  protected firstname: string
  protected lastname: string
  protected createdAt: Timestamp
  protected caretaker?: Caretaker
  protected adultChild?: AdultChild
  private role: RoleEnum

  constructor(userDTOLike: UserDTO)
  constructor(email: string, firtname: string, lastname: string, createdAt: Timestamp, role: RoleEnum, id?: UUID,
              caretaker?: Caretaker, adultChild?: AdultChild)

  constructor(...args: [UserDTO] | [string, string, string, Timestamp, RoleEnum, UUID?, Caretaker?, AdultChild?]) {
    if (typeof args[0] === "object" && "email" in args[0]) {
      // its dto
      const dto = args[0] as UserDTO
      this.email = dto.email
      this.firstname = dto.firstname
      this.lastname = dto.lastname
      this.createdAt = dto.createdAt
      this.id = new UUID(dto.id)
      this.role = dto.role

      if (dto.role === RoleEnum.CARETAKER && dto.caretaker) {
        this.caretaker = new Caretaker(dto.caretaker)
      }

      if (dto.role === RoleEnum.ADULTCHILD && dto.adultChild) {
        this.adultChild = new AdultChild(dto.adultChild)
      }
      return
    }

    const arr = args as [string, string, string, Timestamp, RoleEnum, UUID?, Caretaker?, AdultChild?]
    this.email = arr[0]
    this.firstname = arr[1]
    this.lastname = arr[2]
    this.createdAt = arr[3]
    this.role = arr[4]
    this.id = arr[5]
    if (arr[4] === RoleEnum.CARETAKER && arr[6]) {
      this.caretaker = arr[6]
    }
    if (arr[4] === RoleEnum.ADULTCHILD && arr[7]) {
      this.adultChild = arr[7]
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

  public setAdultChild(ac: AdultChild) {
    this.adultChild = ac
  }

  public isAdmin() {
    return this.role === RoleEnum.ADMIN
  }

  public getCaretaker(): Caretaker | undefined {
    return this.caretaker
  }

  public getAdultChild(): AdultChild | undefined {
    return this.adultChild
  }

  public getId(): UUID | undefined {
    return this.id
  }

  public toDTO(): UserDTO {
    const dto: UserDTO = {
      email: this.email,
      firstname: this.firstname,
      lastname: this.lastname,
      role: this.role,
      createdAt: this.createdAt,
      id: this.id?.toString(),
    }

    if (this.caretaker) {
      dto.caretaker = this.caretaker.toDTO()
    }
    if (this.adultChild) {
      dto.adultChild = this.adultChild.toDTO()
    }

    return dto
  }
}
