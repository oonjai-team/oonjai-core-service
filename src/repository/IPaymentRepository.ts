import type {Payment} from "@entity/Payment"

export interface IPaymentRepository {
  findById(id: string): Payment | undefined
  findByBookingId(bookingId: string): Payment | undefined
  findByTransactionRef(ref: string): Payment | undefined
  insert(payment: Payment): string
  save(payment: Payment): boolean
  findByCheckoutSessionId(sessionId: string): Payment | undefined
}
