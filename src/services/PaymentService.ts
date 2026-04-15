import type {IPaymentRepository} from "@repo/IPaymentRepository"
import type {IBookingRepository} from "@repo/IBookingRepository"
import type {IService} from "@serv/IService"
import {Payment} from "@entity/Payment"
import {PaymentMethod, PaymentStatus} from "@type/payment"
import {TimestampHelper} from "@type/timestamp"
import {UUID} from "@type/uuid"

const FRONTEND_URL = process.env["FRONTEND_URL"] ?? "http://localhost:3000"
const API_URL = process.env["API_URL"] ?? "http://localhost:3030"

export class PaymentService implements IService {
  constructor(
    private paymentRepo: IPaymentRepository,
    private bookingRepo: IBookingRepository,
  ) {}

  public getServiceId(): string {
    return "PaymentService"
  }

  public async initiatePayment(
    bookingId: string,
    requesterId: UUID,
    method: PaymentMethod,
    amount: number,
    currency: string,
  ): Promise<Payment> {
    const booking = await this.bookingRepo.findById(bookingId)
    if (!booking) {
      throw new Error("NOT_FOUND: booking not found")
    }

    if (!booking.getAdultChildId().is(requesterId)) {
      throw new Error("FORBIDDEN: booking does not belong to current user")
    }

    const dto = booking.toDTO()
    // Tolerance compare: stored NUMERIC(12,2) and in-memory floats can differ
    // by sub-cent amounts; reject only on real discrepancies.
    if (Math.abs(amount - dto.estimatedCost) > 0.01) {
      throw new Error("BAD_REQUEST: amount does not match booking estimated cost")
    }

    const existing = await this.paymentRepo.findByBookingId(bookingId)
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

    const id = await this.paymentRepo.insert(payment)
    return new Payment({...payment.toDTO(), id})
  }

  /**
   * Creates a checkout session for a single booking.
   * Returns the Payment with a checkoutUrl that simulates a Stripe-like redirect flow.
   */
  public async createCheckoutSession(
    bookingId: string,
    amount: number,
    currency: string,
    method: PaymentMethod,
  ): Promise<{ payment: Payment; checkoutUrl: string }> {
    const booking = await this.bookingRepo.findById(bookingId)
    if (!booking) throw new Error("NOT_FOUND: booking not found")

    const checkoutSessionId = crypto.randomUUID()
    const transactionRef = crypto.randomUUID()

    const payment = new Payment({
      id: undefined,
      bookingId,
      checkoutSessionId,
      amount,
      currency,
      method,
      status: PaymentStatus.PENDING,
      transactionRef,
      qrCodeUrl: null,
      redirectUrl: null,
      paidAt: null,
      createdAt: TimestampHelper.now(),
    })

    const paymentId = await this.paymentRepo.insert(payment)
    const saved = new Payment({...payment.toDTO(), id: paymentId})

    const checkoutUrl = `${FRONTEND_URL}/payment/checkout?session=${checkoutSessionId}&amount=${amount}&currency=${currency}`

    return {payment: saved, checkoutUrl}
  }

  /**
   * Called when the payment gateway redirects back after successful payment.
   * Marks payment as PAID and the associated booking as CONFIRMED.
   * Returns the redirect URL for the frontend confirmation page.
   */
  public async completeCheckout(checkoutSessionId: string): Promise<{ payment: Payment; redirectUrl: string }> {
    const payment = await this.paymentRepo.findByCheckoutSessionId(checkoutSessionId)
    if (!payment) {
      throw new Error("NOT_FOUND: checkout session not found")
    }

    if (payment.getStatus() === PaymentStatus.PAID) {
      throw new Error("CONFLICT: payment is already completed")
    }

    // Mark payment as paid
    const now = new Date().toISOString()
    payment.markAsPaid(payment.getTransactionRef() ?? crypto.randomUUID(), now)
    await this.paymentRepo.save(payment)

    // Confirm the associated booking
    const bookingId = payment.getBookingId()
    const booking = await this.bookingRepo.findById(bookingId)
    let activityId: string | null = null

    if (booking) {
      const dto = booking.toDTO()
      activityId = dto.activityId ?? null
      booking.forceConfirm()
      await this.bookingRepo.save(booking)
    }

    const paymentDto = payment.toDTO()
    const redirectUrl = activityId
      ? `${FRONTEND_URL}/activities/${activityId}/book/confirmation?paymentId=${paymentDto.id}`
      : `${FRONTEND_URL}/booking/confirmation?paymentId=${paymentDto.id}`

    return {payment, redirectUrl}
  }

  public async getPaymentStatus(bookingId: string, requesterId: UUID): Promise<Payment> {
    const booking = await this.bookingRepo.findById(bookingId)
    if (!booking) {
      throw new Error("NOT_FOUND: booking not found")
    }

    if (!booking.getAdultChildId().is(requesterId)) {
      throw new Error("FORBIDDEN: booking does not belong to current user")
    }

    const payment = await this.paymentRepo.findByBookingId(bookingId)
    if (!payment) {
      throw new Error("NOT_FOUND: no payment found for this booking")
    }

    return payment
  }

  public async handleWebhook(transactionRef: string, paidAt: string): Promise<Payment> {
    const payment = await this.paymentRepo.findByTransactionRef(transactionRef)
    if (!payment) {
      throw new Error("NOT_FOUND: no payment found for transaction ref")
    }

    payment.markAsPaid(transactionRef, paidAt)
    await this.paymentRepo.save(payment)
    return payment
  }
}
