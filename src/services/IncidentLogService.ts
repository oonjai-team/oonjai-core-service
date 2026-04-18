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

  public async createIncidentLog(bookingId: string, incidentType: string, detail: string): Promise<IncidentLog> {
    if (!VALID_INCIDENT_TYPES.includes(incidentType as any)) {
      throw new Error(`INVALID_TYPE: incidentType must be one of: ${VALID_INCIDENT_TYPES.join(", ")}`)
    }

    const booking = await this.bookingRepo.findById(bookingId)
    if (!booking) {
      throw new Error("NOT_FOUND: booking not found")
    }

    const log = new IncidentLog(
      bookingId,
      incidentType as any,
      detail,
      "noted",
      TimestampHelper.now()
    )
    const id = await this.incidentLogRepo.insert(log)
    return new IncidentLog(bookingId, incidentType as any, detail, "noted", log.toDTO().createdAt, id)
  }

  public async getIncidentLogsFromBooking(bookingId: string): Promise<IncidentLog[]> {
    return this.incidentLogRepo.findByBookingId(bookingId)
  }

  public async getIncidentLogsFromSenior(seniorId: UUID): Promise<IncidentLog[]> {
    return this.incidentLogRepo.findBySeniorId(seniorId)
  }

  public async updateIncidentLog(logId: UUID, status: string, detail: string): Promise<IncidentLog> {
    if (!VALID_INCIDENT_STATUSES.includes(status as any)) {
      throw new Error(`INVALID_STATUS: status must be one of: ${VALID_INCIDENT_STATUSES.join(", ")}`)
    }

    const log = await this.incidentLogRepo.findById(logId)
    if (!log) {
      throw new Error("NOT_FOUND: incident log not found")
    }

    log.updateStatus(status as IncidentStatus)
    log.updateDetail(detail)
    await this.incidentLogRepo.save(log)
    return log
  }
}
