import type {IIncidentLogRepository} from "@repo/IIncidentLogRepository"
import type {IBookingRepository} from "@repo/IBookingRepository"
import type {UUID} from "@type/uuid"
import type {IService} from "@serv/IService"
import type {IncidentStatus} from "@entity/IncidentLogDTO"
import {IncidentLog} from "@entity/IncidentLog"
import {VALID_INCIDENT_TYPES, VALID_INCIDENT_STATUSES} from "@entity/IncidentLogDTO"
import {TimestampHelper} from "@type/timestamp"

export class IncidentLogService implements IService {
  private incidentLogRepo: IIncidentLogRepository
  private bookingRepo: IBookingRepository

  constructor(incidentLogRepo: IIncidentLogRepository, bookingRepo: IBookingRepository) {
    this.incidentLogRepo = incidentLogRepo
    this.bookingRepo = bookingRepo
  }

  public getServiceId(): string {
    return "IncidentLogService"
  }

  public createIncidentLog(bookingId: string, seniorId: UUID, incidentType: string, detail: string): IncidentLog {
    if (!VALID_INCIDENT_TYPES.includes(incidentType as any)) {
      throw new Error(`INVALID_TYPE: incidentType must be one of: ${VALID_INCIDENT_TYPES.join(", ")}`)
    }

    const booking = this.bookingRepo.findById(bookingId)
    if (!booking) {
      throw new Error("NOT_FOUND: booking not found")
    }

    if (booking.toDTO().seniorId !== seniorId.toString()) {
      throw new Error("FORBIDDEN: seniorId does not match the booking's senior")
    }

    const log = new IncidentLog(
      bookingId,
      seniorId,
      incidentType as any,
      detail,
      "noted",
      TimestampHelper.now()
    )
    const id = this.incidentLogRepo.insert(log)
    return new IncidentLog(bookingId, seniorId, incidentType as any, detail, "noted", log.toDTO().createdAt, id)
  }

  public getIncidentLogsFromBooking(bookingId: string): IncidentLog[] {
    return this.incidentLogRepo.findByBookingId(bookingId)
  }

  public getIncidentLogsFromSenior(seniorId: UUID): IncidentLog[] {
    return this.incidentLogRepo.findBySeniorId(seniorId)
  }

  public updateIncidentLog(logId: UUID, status: string, detail: string): IncidentLog {
    if (!VALID_INCIDENT_STATUSES.includes(status as any)) {
      throw new Error(`INVALID_STATUS: status must be one of: ${VALID_INCIDENT_STATUSES.join(", ")}`)
    }

    const log = this.incidentLogRepo.findById(logId)
    if (!log) {
      throw new Error("NOT_FOUND: incident log not found")
    }

    log.updateStatus(status as IncidentStatus)
    log.updateDetail(detail)
    this.incidentLogRepo.save(log)
    return log
  }
}
