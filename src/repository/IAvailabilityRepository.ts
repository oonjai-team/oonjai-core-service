import type {UUID} from "@type/uuid"
import type {AvailabilitySlot} from "@type/caretaker"

export interface IAvailabilityRepository {
  listByCaretaker(caretakerId: UUID): Promise<AvailabilitySlot[]>
  replaceForCaretaker(caretakerId: UUID, slots: AvailabilitySlot[]): Promise<void>
  setActiveInRange(caretakerId: UUID, startDate: string, endDate: string, active: boolean): Promise<void>
}
