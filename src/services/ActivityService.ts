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

  public getAllActivities(): Activity[] {
    return this.activityRepo.findAll()
  }

  public getActivityById(id: string): Activity | undefined {
    return this.activityRepo.findById(id)
  }

  public saveActivity(activity: Activity): void {
    this.activityRepo.save(activity)
  }
}
