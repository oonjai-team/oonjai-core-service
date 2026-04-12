import type {IActivityRepository} from "@repo/IActivityRepository"
import type {ITestDatabase} from "../lib/TestDatabase"
import {Activity} from "@entity/Activity"
import {UUID} from "@type/uuid"

export class TestActivityRepository implements IActivityRepository {

  constructor(private db: ITestDatabase) {}

  public findAll(): Activity[] {
    return this.db.getAll("activity").map(r => new Activity(r))
  }

  public findById(id: string): Activity | undefined {
    try {
      const record = this.db.get("activity", new UUID(id))
      return new Activity(record)
    } catch (_) {
      return undefined
    }
  }

  /** Strip computed fields before persisting */
  private toPersistable(activity: Activity) {
    const {displayDate, ...data} = activity.toDTO() as Record<string, unknown>
    return data
  }

  public insert(activity: Activity): string {
    const id = this.db.insert("activity", this.toPersistable(activity))
    return id.toString()
  }

  public save(activity: Activity): boolean {
    if (activity.isNew()) {
      throw new Error("cannot save new activity without id")
    }
    const id = activity.getId() as UUID
    this.db.set("activity", id, this.toPersistable(activity))
    return true
  }

  public delete(activity: Activity): void {
    if (activity.isNew()) {
      throw new Error("cannot delete activity without id")
    }
    this.db.delete("activity", activity.getId() as UUID)
  }
}
