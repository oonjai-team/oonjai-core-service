import type {UUID} from "@type/uuid"
import type {Timestamp} from "@type/timestamp"
import type {CareSessionStatus} from "@type/careSession"

export interface StatusLogDTO {
id: string | undefined
bookingId: string
statusType: CareSessionStatus
notes: string
photoUrl: string | null
createdAt: Timestamp
}