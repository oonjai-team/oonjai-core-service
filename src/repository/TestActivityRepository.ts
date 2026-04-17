import type {ActivityFilter, IActivityRepository} from "@repo/IActivityRepository"
import type {ITestDatabase} from "../lib/TestDatabase"
import {Activity} from "@entity/Activity"
import {UUID} from "@type/uuid"

export class TestActivityRepository implements IActivityRepository {

  constructor(private db: ITestDatabase) {}

  public async findAll(): Promise<Activity[]> {
    return this.db.getAll("activity").map(r => new Activity(r))
  }

  public async find(filter: ActivityFilter): Promise<Activity[]> {
    const search = filter.search?.trim().toLowerCase()
    const category = filter.category?.trim().toLowerCase()
    const location = filter.location?.trim().toLowerCase()
    const priceMin = filter.priceMin
    const priceMax = filter.priceMax

    const all = this.db.getAll("activity").map(r => new Activity(r))

    const filtered = all.filter(a => {
      const dto = a.toDTO()
      if (category && (dto.category ?? "").toLowerCase() !== category) return false
      if (location && !(dto.location ?? "").toLowerCase().includes(location)) return false
      if (priceMin !== undefined && dto.price < priceMin) return false
      if (priceMax !== undefined && dto.price > priceMax) return false
      if (search) {
        const haystack = [
          dto.title,
          dto.category,
          dto.host,
          dto.location,
          ...(dto.tags ?? []),
        ].join(" ").toLowerCase()
        if (!haystack.includes(search)) return false
      }
      return true
    })

    const offset = filter.offset ?? 0
    const end = filter.limit !== undefined ? offset + filter.limit : undefined
    return filtered.slice(offset, end)
  }

  public async count(filter: ActivityFilter): Promise<number> {
    const unpaged: ActivityFilter = { ...filter }
    delete unpaged.limit
    delete unpaged.offset
    const all = await this.find(unpaged)
    return all.length
  }

  public async findById(id: string): Promise<Activity | undefined> {
    try {
      const record = this.db.get("activity", new UUID(id))
      return new Activity(record)
    } catch (_) {
      return undefined
    }
  }

  /** Strip computed fields before persisting */
  private toPersistable(activity: Activity) {
    const {displayDate, ...data} = activity.toDTO() as unknown as Record<string, unknown>
    return data
  }

  public async insert(activity: Activity): Promise<string> {
    const id = this.db.insert("activity", this.toPersistable(activity))
    return id.toString()
  }

  public async save(activity: Activity): Promise<boolean> {
    if (activity.isNew()) {
      throw new Error("cannot save new activity without id")
    }
    const id = activity.getId() as UUID
    this.db.set("activity", id, this.toPersistable(activity))
    return true
  }

  public async delete(activity: Activity): Promise<void> {
    if (activity.isNew()) {
      throw new Error("cannot delete activity without id")
    }
    this.db.delete("activity", activity.getId() as UUID)
  }
}
