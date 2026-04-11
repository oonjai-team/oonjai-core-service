import type {IPaymentRepository} from "@repo/IPaymentRepository"
import type {IBookingRepository} from "@repo/IBookingRepository"
import type {IService} from "@serv/IService"
import {Payment} from "@entity/Payment"
import {PaymentMethod, PaymentStatus} from "@type/payment"
import {TimestampHelper} from "@type/timestamp"
import {UUID} from "@type/uuid"

export class PaymentService implements IService {
  constructor(
    private paymentRepo: IPaymentRepository,
    private bookingRepo: IBookingRepository,
  ) {}

  public getServiceId(): string {
    return "PaymentService"
  }

  public initiatePayment(
    bookingId: string,
    requesterId: UUID,
    method: PaymentMethod,
    amount: number,
    currency: string,
  ): Payment {
    const booking = this.bookingRepo.findById(bookingId)
    if (!booking) {
      throw new Error("NOT_FOUND: booking not found")
    }

    if (!booking.getAdultChildId().is(requesterId)) {
      throw new Error("FORBIDDEN: booking does not belong to current user")
    }

    const dto = booking.toDTO()
    if (amount !== dto.estimatedCost) {
      throw new Error("BAD_REQUEST: amount does not match booking estimated cost")
    }

    const existing = this.paymentRepo.findByBookingId(bookingId)
    if (existing) {
      const s = existing.getStatus()
      if (s === PaymentStatus.PENDING || s === PaymentStatus.PAID) {
        throw new Error("CONFLICT: a pending or paid payment already exists for this booking")
      }
    }

    const qrCodeUrl = method === PaymentMethod.QR_PROMPTPAY
      ? `https://payment.gateway/qr/${crypto.randomUUID()}.png`
      : null
    const redirectUrl = method === PaymentMethod.CREDIT_CARD
      ? `https://payment.gateway/card/${crypto.randomUUID()}`
      : null

    const transactionRef = crypto.randomUUID()

    const payment = new Payment(
      bookingId,
      amount,
      currency,
      method,
      PaymentStatus.PENDING,
      transactionRef,
      qrCodeUrl,
      redirectUrl,
      null,
      TimestampHelper.now(),
    )

    const id = this.paymentRepo.insert(payment)
    return new Payment({...payment.toDTO(), id})
  }

  public getPaymentStatus(bookingId: string, requesterId: UUID): Payment {
    const booking = this.bookingRepo.findById(bookingId)
    if (!booking) {
      throw new Error("NOT_FOUND: booking not found")
    }

    if (!booking.getAdultChildId().is(requesterId)) {
      throw new Error("FORBIDDEN: booking does not belong to current user")
    }

    const payment = this.paymentRepo.findByBookingId(bookingId)
    if (!payment) {
      throw new Error("NOT_FOUND: no payment found for this booking")
    }

    return payment
  }

  public handleWebhook(transactionRef: string, paidAt: string): Payment {
    const payment = this.paymentRepo.findByTransactionRef(transactionRef)
    if (!payment) {
      throw new Error("NOT_FOUND: no payment found for transaction ref")
    }

    payment.markAsPaid(transactionRef, paidAt)
    this.paymentRepo.save(payment)
    return payment
  }
}
