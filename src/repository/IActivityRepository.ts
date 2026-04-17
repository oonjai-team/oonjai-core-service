import type {Activity} from "@entity/Activity"

export interface ActivityFilter {
  search?: string
  category?: string
  location?: string
  priceMin?: number
  priceMax?: number
  limit?: number
  offset?: number
}

export interface IActivityRepository {
  findAll(): Promise<Activity[]>
  find(filter: ActivityFilter): Promise<Activity[]>
  count(filter: ActivityFilter): Promise<number>
  findById(id: string): Promise<Activity | undefined>
  insert(activity: Activity): Promise<string>
  save(activity: Activity): Promise<boolean>
  delete(activity: Activity): Promise<void>
}
