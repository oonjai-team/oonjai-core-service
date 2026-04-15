import type {IStatusLogRepository} from "@repo/IStatusLogRepository"
import type {UUID} from "@type/uuid"
import type {IService} from "@serv/IService"
import {StatusLog} from "@entity/StatusLog"
import {CareSessionStatus} from "@type/careSession"
import {TimestampHelper} from "@type/timestamp"

const VALID_SEQUENCES: Record<string, CareSessionStatus[]> = {
medical_escort: [
CareSessionStatus.DRIVING_TO_PICKUP,
CareSessionStatus.AT_PICKUP,
CareSessionStatus.DRIVING_TO_HOSPITAL,
CareSessionStatus.AT_HOSPITAL,
CareSessionStatus.DRIVING_HOME,
CareSessionStatus.COMPLETED,
],
outings_with_pickup: [
CareSessionStatus.DRIVING_TO_PICKUP,
CareSessionStatus.AT_PICKUP,
CareSessionStatus.DRIVING_TO_OUTING,
CareSessionStatus.AT_OUTING,
CareSessionStatus.DRIVING_HOME,
CareSessionStatus.COMPLETED,
],
outings_no_pickup: [
CareSessionStatus.DRIVING_TO_OUTING,
CareSessionStatus.IN_SESSION,
CareSessionStatus.COMPLETED,
],
home_care: [
CareSessionStatus.DRIVING_TO_LOCATION,
CareSessionStatus.AT_LOCATION,
CareSessionStatus.IN_SESSION,
CareSessionStatus.COMPLETED,
],
}

export class StatusLogService implements IService {
private statusLogRepo: IStatusLogRepository

constructor(statusLogRepo: IStatusLogRepository) {
    this.statusLogRepo = statusLogRepo
  }

  public getServiceId(): string {
    return "StatusLogService"
  }

  public async createStatusLog(bookingId: string, caretakerId: UUID, statusType: CareSessionStatus, notes: string, photoUrl?: string): Promise<StatusLog> {
    const log = new StatusLog(bookingId, statusType, notes, photoUrl ?? null, TimestampHelper.now())
    const id = await this.statusLogRepo.insert(log)
    return new StatusLog(bookingId, statusType, notes, photoUrl ?? null, log.toDTO().createdAt, id)
  }

  public async getStatusLogsForBooking(bookingId: string): Promise<StatusLog[]> {
    return this.statusLogRepo.findByBookingId(bookingId)
  }
}
