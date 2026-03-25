import type {IUserRepository} from "./IUserRepository"
import type {ITestDatabase} from "../lib/TestDatabase"
import {User} from "@entity/User"
import {Caretaker} from "@entity/Caretaker"
import {UUID} from "@type/uuid"
import {Timestamp} from "@type/timestamp"
import {RoleEnum} from "@type/user"
import type {CaretakerFilter} from "@type/caretaker"
import type {CareTakerUserAttributes, PartialUserDTO, UserDTO} from "@entity/UserDTO"


export class TestUserRepository implements IUserRepository {

  constructor(private db: ITestDatabase) {}

  save(user: User): [boolean, UUID?] {
    if (user.isNew()) {
      const id = this.db.insert("user", user.toDTO())
      if (user.isCaretaker()) {
        this.db.set("caretaker", id.toString(), user.getCaretaker()?.toDTO() ?? {})
      }
      return [true, id]
    }

    const uid = user.getId()
    if (!uid) {
      throw new Error("user id is undefined")
    }

    this.db.update("user", uid, user.toDTO())
    if (user.isCaretaker()) {
      this.db.update("caretaker", uid, user.getCaretaker()?.toDTO() ?? {})
    }
    return [true, undefined]
  }

  delete(user: User): void {
     if (user.isNew()) {
      throw new Error("cannot delete")
     }

     this.db.delete("user", user.getId() as string)
  }

  findById(id: UUID): User | undefined {
    try {
      const record = this.db.get("user", id.toString())
      return this.reconstruct(record, id)
    }catch (e) {
      return undefined
    }
  }

  findByEmail(email: string): User | undefined {
    const all = this.db.getAll("user")
    const record = all.find((u) => u.email === email)
    if (!record) return undefined
    return this.reconstruct(record, new UUID(record.id))
  }

  findAvailableCaretaker(filters: CaretakerFilter): User[] {
    let results: (CareTakerUserAttributes & {id: string})[] = this.db.getAll("caretaker")
      .filter(c => c.isAvailable)

    if (filters.specialization) {
      results = results.filter(c =>
        c.specialization.toLowerCase().includes(filters.specialization!.toLowerCase())
      )
    }
    if (filters.minRating !== undefined) {
      results = results.filter(c => c.rating >= filters.minRating!)
    }
    if (filters.minExperience !== undefined) {
      results = results.filter(c => c.experience >= filters.minExperience!)
    }
    if (filters.maxHourlyRate !== undefined) {
      results = results.filter(c => c.hourlyRate <= filters.maxHourlyRate!)
    }

    if (filters.sortBy === "rating") {
      results.sort((a, b) => b.rating - a.rating)
    } else if (filters.sortBy === "experience") {
      results.sort((a, b) => b.experience - a.experience)
    } else if (filters.sortBy === "price_asc") {
      results.sort((a, b) => a.hourlyRate - b.hourlyRate)
    } else if (filters.sortBy === "price_desc") {
      results.sort((a, b) => b.hourlyRate - a.hourlyRate)
    }

    const mapped = results.map((v) => {
      const id = v.id
      const user = this.db.get("users", id)
      if (!user) {
        return null
      }

      return new User(user.email, user.firstname, user.lastname, new Timestamp(user.createdAt), user.role, id, new Caretaker(v))
    }).filter((v) => v !== null)

    return mapped
  }

  updateUser(id: UUID, data: Partial<Omit<UserDTO, "caretaker">>): boolean {
    try {
      this.db.update("user", id, data)
      return true
    } catch (_) {
      return false
    }
  }

  updateAttrProfile(id: UUID, data: Partial<CareTakerUserAttributes>): boolean {
    try {
      this.db.update("caretaker", id, data)
      return true
    } catch (_) {
      return false
    }
  }

  private reconstruct(record: any, id: UUID): User {
    if (record.role === RoleEnum.CARETAKER) {
      // get caretaker
      const dto = this.db.get("caretaker", id.toString())
      const ct = new Caretaker(dto)

      return new User(record.email, record.firstname, record.lastname, new Timestamp(record.createdAt), RoleEnum.CARETAKER, id, ct)
    }
    return new User(record.email, record.firstname, record.lastname, new Timestamp(record.createdAt), record.role, id)
  }
}