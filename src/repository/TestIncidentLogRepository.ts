import type {IIncidentLogRepository} from "@repo/IIncidentLogRepository"
import type {ITestDatabase} from "../lib/TestDatabase"
import {IncidentLog} from "@entity/IncidentLog"
import type {UUID} from "@type/uuid"

export class TestIncidentLogRepository implements IIncidentLogRepository {
  constructor(private db: ITestDatabase) {}

  public async findByBookingId(bookingId: string): Promise<IncidentLog[]> {
    return this.db.getAll("incidentLog")
      .filter(dto => dto.bookingId === bookingId)
      .map(dto => new IncidentLog(dto))
  }

  public async findBySeniorId(seniorId: UUID): Promise<IncidentLog[]> {
    const bookingIds = new Set(
      this.db.getAll("booking")
        .filter((b: any) => b.seniorId === seniorId.toString())
        .map((b: any) => b.id)
    )
    return this.db.getAll("incidentLog")
      .filter(dto => bookingIds.has(dto.bookingId))
      .map(dto => new IncidentLog(dto))
  }

  public async findById(id: UUID): Promise<IncidentLog | undefined> {
    try {
      return new IncidentLog(this.db.get("incidentLog", id))
    } catch {
      return undefined
    }
  }

  public async insert(log: IncidentLog): Promise<UUID> {
    return this.db.insert("incidentLog", log.toDTO())
  }

  public async save(log: IncidentLog): Promise<boolean> {
    const id = log.getId()
    if (!id) return false
    this.db.update("incidentLog", id, log.toDTO())
    return true
  }
}
