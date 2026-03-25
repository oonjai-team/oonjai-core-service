import type {IStatusLogRepository} from "@repo/IStatusLogRepository"
import type {ITestDatabase} from "../lib/TestDatabase"
import {StatusLog} from "@entity/StatusLog"
import type {UUID} from "@type/uuid"

export class TestStatusLogRepository implements IStatusLogRepository {
constructor(private db: ITestDatabase) {}

  public save(log: StatusLog): boolean {
  const id = log.getId()
  if (!id) return false
    this.db.update("statusLog", id, log.toDTO())
    return true
  }

  public findById(id: UUID): StatusLog | undefined {
    return this.db.get("statusLog", id)
  }

  public findByBookingId(bookingId: string): StatusLog[] {
    return this.db.getAll("statusLog")
      .filter(dto => dto.bookingId === bookingId)
      .map(dto => new StatusLog(dto))
  }

  public insert(log: StatusLog): UUID {
    return this.db.insert("statusLog", log.toDTO())
  }
}