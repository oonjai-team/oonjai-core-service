import type {IStatusLogRepository} from "@repo/IStatusLogRepository"
import type {ITestDatabase} from "../lib/TestDatabase"
import {StatusLog} from "@entity/StatusLog"
import type {UUID} from "@type/uuid"

export class TestStatusLogRepository implements IStatusLogRepository {
constructor(private db: ITestDatabase) {}

  public async save(log: StatusLog): Promise<boolean> {
  const id = log.getId()
  if (!id) return false
    this.db.update("statusLog", id, log.toDTO())
    return true
  }

  public async findById(id: UUID): Promise<StatusLog | undefined> {
    return this.db.get("statusLog", id)
  }

  public async findByBookingId(bookingId: string): Promise<StatusLog[]> {
    return this.db.getAll("statusLog")
      .filter(dto => dto.bookingId === bookingId)
      .map(dto => new StatusLog(dto))
  }

  public async insert(log: StatusLog): Promise<UUID> {
    return this.db.insert("statusLog", log.toDTO())
  }
}
