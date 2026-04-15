import type {Payment} from "@entity/Payment"

export interface IPaymentRepository {
  findById(id: string): Promise<Payment | undefined>
  findByBookingId(bookingId: string): Promise<Payment | undefined>
  findByTransactionRef(ref: string): Promise<Payment | undefined>
  insert(payment: Payment): Promise<string>
  save(payment: Payment): Promise<boolean>
  findByCheckoutSessionId(sessionId: string): Promise<Payment | undefined>
}
