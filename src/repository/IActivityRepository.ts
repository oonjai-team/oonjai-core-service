import type {Activity} from "@entity/Activity"

export interface IActivityRepository {
  findAll(): Promise<Activity[]>
  findById(id: string): Promise<Activity | undefined>
  insert(activity: Activity): Promise<string>
  save(activity: Activity): Promise<boolean>
  delete(activity: Activity): Promise<void>
}
