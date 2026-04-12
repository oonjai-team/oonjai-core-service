import type {Activity} from "@entity/Activity"

export interface IActivityRepository {
  findAll(): Activity[]
  findById(id: string): Activity | undefined
  insert(activity: Activity): string
  save(activity: Activity): boolean
  delete(activity: Activity): void
}
