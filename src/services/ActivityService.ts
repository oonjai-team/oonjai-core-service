import type {IActivityRepository} from "@repo/IActivityRepository"
import type {IService} from "@serv/IService"
import type {Activity} from "@entity/Activity"

export class ActivityService implements IService {
  private activityRepo: IActivityRepository

  constructor(activityRepo: IActivityRepository) {
    this.activityRepo = activityRepo
  }

  public getServiceId(): string {
    return "ActivityService"
  }

  public async getAllActivities(): Promise<Activity[]> {
    return this.activityRepo.findAll()
  }

  public async getActivityById(id: string): Promise<Activity | undefined> {
    return this.activityRepo.findById(id)
  }

  public async saveActivity(activity: Activity): Promise<void> {
    await this.activityRepo.save(activity)
  }
}
