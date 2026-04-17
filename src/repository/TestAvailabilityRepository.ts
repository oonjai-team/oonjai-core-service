import type {IAvailabilityRepository} from "./IAvailabilityRepository"
import type {ITestDatabase} from "../lib/TestDatabase"
import type {UUID} from "@type/uuid"
import type {AvailabilitySlot} from "@type/caretaker"

export class TestAvailabilityRepository implements IAvailabilityRepository {

  constructor(private db: ITestDatabase) {}

  async listByCaretaker(caretakerId: UUID): Promise<AvailabilitySlot[]> {
    try {
      const stored = this.db.get("availability", caretakerId) as {slots?: AvailabilitySlot[]} | undefined
      return stored?.slots ?? []
    } catch (_) {
      return []
    }
  }

  async replaceForCaretaker(caretakerId: UUID, slots: AvailabilitySlot[]): Promise<void> {
    this.db.set("availability", caretakerId, {slots})
  }

  async setActiveInRange(caretakerId: UUID, startDate: string, endDate: string, active: boolean): Promise<void> {
    const slots = await this.listByCaretaker(caretakerId)
    const reqStart = new Date(startDate).getTime()
    const reqEnd = new Date(endDate).getTime()
    const updated = slots.map(s => {
      const contained =
        new Date(s.startDateTime).getTime() >= reqStart &&
        new Date(s.endDateTime).getTime() <= reqEnd
      return contained ? {...s, isActive: active} : s
    })
    this.db.set("availability", caretakerId, {slots: updated})
  }
}
