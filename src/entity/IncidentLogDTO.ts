import type {Timestamp} from "@type/timestamp"

export type IncidentType = "fall" | "medication_missed" | "medical_emergency" | "behavioral" | "other"
export type IncidentStatus = "noted" | "resolved" | "escalated"

export const VALID_INCIDENT_TYPES: IncidentType[] = ["fall", "medication_missed", "medical_emergency", "behavioral", "other"]
export const VALID_INCIDENT_STATUSES: IncidentStatus[] = ["noted", "resolved", "escalated"]

export interface IncidentLogDTO {
  id: string | undefined
  bookingId: string
  seniorId: string
  incidentType: IncidentType
  detail: string
  status: IncidentStatus
  createdAt: Timestamp
}
