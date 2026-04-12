import type {Timestamp} from "@type/timestamp"
import type {PaymentMethod, PaymentStatus} from "@type/payment"

export interface PaymentDTO {
  id: string | undefined
  bookingId: string
  checkoutSessionId?: string
  amount: number
  currency: string
  method: PaymentMethod
  status: PaymentStatus
  transactionRef: string | null
  qrCodeUrl: string | null
  redirectUrl: string | null
  paidAt: string | null
  createdAt: Timestamp
}
