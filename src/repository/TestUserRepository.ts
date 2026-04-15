import type {IUserRepository} from "./IUserRepository"
import type {ITestDatabase} from "../lib/TestDatabase"
import {User} from "@entity/User"
import {Caretaker} from "@entity/Caretaker"
import {AdultChild} from "@entity/AdultChild"
import {UUID} from "@type/uuid"
import {Timestamp} from "@type/timestamp"
import {RoleEnum} from "@type/user"
import {type CaretakerFilter, enumerateHourSlots} from "@type/caretaker"
import type {AdultChildAttributes, CareTakerUserAttributes, PartialUserDTO, UserDTO} from "@entity/UserDTO"


export class TestUserRepository implements IUserRepository {

  constructor(private db: ITestDatabase) {}

  async save(user: User): Promise<[boolean, UUID?]> {
    if (user.isNew()) {
      const id = this.db.insert("user", user.toDTO())
      if (user.isCaretaker()) {
        this.db.set("caretaker", id, user.getCaretaker()?.toDTO() ?? {})
      }
      if (user.isAdultChild() && user.getAdultChild()) {
        this.db.set("adultChild", id, user.getAdultChild()!.toDTO())
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
    if (user.isAdultChild() && user.getAdultChild()) {
      this.db.update("adultChild", uid, user.getAdultChild()!.toDTO())
    }
    return [true, undefined]
  }

  async delete(user: User): Promise<void> {
     if (user.isNew()) {
      throw new Error("cannot delete")
     }

     this.db.delete("user", user.getId() as UUID)
  }

  async findById(id: UUID): Promise<User | undefined> {
    try {
      const record = this.db.get("user", id)
      return this.reconstruct(record, id)
    }catch (e) {
      return undefined
    }
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const all = this.db.getAll("user")
    const record = all.find((u) => u.email === email)
    if (!record) return undefined
    return this.reconstruct(record, new UUID(record.id))
  }

  async findAvailableCaretaker(filters: CaretakerFilter): Promise<User[]> {
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

    // Stage 1: Weekly availability schedule check
    // Caretaker sets this — represents their recurring weekly hours
    if (filters.startDate && filters.endDate) {
      const requiredSlots = enumerateHourSlots(filters.startDate, filters.endDate)
      if (requiredSlots.length > 0) {
        results = results.filter(c => {
          if (!c.availability) return true // no schedule set → use isAvailable flag only
          return requiredSlots.every(slot =>
            c.availability![String(slot.day)]?.includes(slot.hour)
          )
        })
      }

      // Stage 2: Booked slots check
      // bookedSlots is populated when bookings are created, released when cancelled
      // Each slot is { date: "2026-04-15", hour: 9, bookingId: "BK-xxx" }
      results = results.filter(c => {
        if (!c.bookedSlots || c.bookedSlots.length === 0) return true
        // Build set of required date+hour combos
        const cursor = new Date(filters.startDate!.getTime())
        while (cursor.getTime() < filters.endDate!.getTime()) {
          const dateStr = cursor.toISOString().split("T")[0]
          const hour = cursor.getHours()
          const isBooked = c.bookedSlots!.some(s => s.date === dateStr && s.hour === hour)
          if (isBooked) return false
          cursor.setTime(cursor.getTime() + 60 * 60 * 1000)
        }
        return true
      })
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
      const user = this.db.get("users", new UUID(id))
      if (!user) {
        return null
      }

      return new User(user.email, user.firstname, user.lastname, new Timestamp(user.createdAt), user.role, new UUID(id), new Caretaker(v))
    }).filter((v) => v !== null)

    return mapped
  }

  async updateUser(id: UUID, data: Partial<Omit<UserDTO, "caretaker" | "adultChild">>): Promise<boolean> {
    try {
      this.db.update("user", id, data)
      return true
    } catch (_) {
      return false
    }
  }

  async updateAttrProfile(id: UUID, data: Partial<CareTakerUserAttributes>): Promise<boolean> {
    try {
      this.db.update("caretaker", id, data)
      return true
    } catch (_) {
      return false
    }
  }

  async updateAdultChildProfile(id: UUID, data: Partial<AdultChildAttributes>): Promise<boolean> {
    try {
      // Use set() to upsert — the record may not exist yet (first onboarding)
      const existing = (() => { try { return this.db.get("adultChild", id) } catch { return {} } })()
      const merged = { ...existing, ...data }
      delete merged["id"]
      this.db.set("adultChild", id, merged)
      return true
    } catch (_) {
      return false
    }
  }

  private reconstruct(record: any, id: UUID): User {
    if (record.role === RoleEnum.CARETAKER) {
      const dto = this.db.get("caretaker", id)
      const ct = new Caretaker(dto)
      return new User(record.email, record.firstname, record.lastname, new Timestamp(record.createdAt), RoleEnum.CARETAKER, id, ct)
    }

    if (record.role === RoleEnum.ADULTCHILD) {
      try {
        const dto = this.db.get("adultChild", id)
        if (dto) {
          const ac = new AdultChild(dto)
          return new User(record.email, record.firstname, record.lastname, new Timestamp(record.createdAt), RoleEnum.ADULTCHILD, id, undefined, ac)
        }
      } catch (_) {
        // no adultChild record yet (not onboarded)
      }
    }

    return new User(record.email, record.firstname, record.lastname, new Timestamp(record.createdAt), record.role, id)
  }
}
