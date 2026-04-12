import type {IIncidentLogRepository} from "@repo/IIncidentLogRepository"
import type {ITestDatabase} from "../lib/TestDatabase"
import {IncidentLog} from "@entity/IncidentLog"
import type {UUID} from "@type/uuid"

export class TestIncidentLogRepository implements IIncidentLogRepository {
  constructor(private db: ITestDatabase) {}

  public findByBookingId(bookingId: string): IncidentLog[] {
    return this.db.getAll("incidentLog")
      .filter(dto => dto.bookingId === bookingId)
      .map(dto => new IncidentLog(dto))
  }

  public findBySeniorId(seniorId: UUID): IncidentLog[] {
    return this.db.getAll("incidentLog")
      .filter(dto => dto.seniorId === seniorId.toString())
      .map(dto => new IncidentLog(dto))
  }

  public findById(id: UUID): IncidentLog | undefined {
    try {
      return new IncidentLog(this.db.get("incidentLog", id))
    } catch {
      return undefined
    }
  }

  public insert(log: IncidentLog): UUID {
    return this.db.insert("incidentLog", log.toDTO())
  }

  public save(log: IncidentLog): boolean {
    const id = log.getId()
    if (!id) return false
    this.db.update("incidentLog", id, log.toDTO())
    return true
  }
}
