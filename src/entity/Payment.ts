import type {Timestamp} from "@type/timestamp"
import {PaymentMethod, PaymentStatus} from "@type/payment"
import type {PaymentDTO} from "@entity/PaymentDTO"

export class Payment {
  private id?: string
  private bookingId: string
  private checkoutSessionId: string | null
  private amount: number
  private currency: string
  private method: PaymentMethod
  private status: PaymentStatus
  private transactionRef: string | null
  private qrCodeUrl: string | null
  private redirectUrl: string | null
  private paidAt: string | null
  private createdAt: Timestamp

  constructor(dto: PaymentDTO)
  constructor(
    bookingId: string,
    amount: number,
    currency: string,
    method: PaymentMethod,
    status: PaymentStatus,
    transactionRef: string | null,
    qrCodeUrl: string | null,
    redirectUrl: string | null,
    paidAt: string | null,
    createdAt: Timestamp,
    id?: string
  )

  constructor(
    ...args:
      | [PaymentDTO]
      | [string, number, string, PaymentMethod, PaymentStatus, string | null, string | null, string | null, string | null, Timestamp, string?]
  ) {
    if (typeof args[0] === "object" && "bookingId" in args[0]) {
      const dto = args[0] as PaymentDTO
      this.id = dto.id
      this.bookingId = dto.bookingId
      this.checkoutSessionId = dto.checkoutSessionId ?? null
      this.amount = dto.amount
      this.currency = dto.currency
      this.method = dto.method
      this.status = dto.status
      this.transactionRef = dto.transactionRef
      this.qrCodeUrl = dto.qrCodeUrl
      this.redirectUrl = dto.redirectUrl
      this.paidAt = dto.paidAt
      this.createdAt = dto.createdAt
      return
    }

    const arr = args as [string, number, string, PaymentMethod, PaymentStatus, string | null, string | null, string | null, string | null, Timestamp, string?]
    this.bookingId = arr[0]
    this.checkoutSessionId = null
    this.amount = arr[1]
    this.currency = arr[2]
    this.method = arr[3]
    this.status = arr[4]
    this.transactionRef = arr[5]
    this.qrCodeUrl = arr[6]
    this.redirectUrl = arr[7]
    this.paidAt = arr[8]
    this.createdAt = arr[9]
    this.id = arr[10]
  }

  public isNew(): boolean {
    return !this.id
  }

  public getId(): string | undefined {
    return this.id
  }

  public getStatus(): PaymentStatus {
    return this.status
  }

  public getTransactionRef(): string | null {
    return this.transactionRef
  }

  public getBookingId(): string {
    return this.bookingId
  }

  public getCheckoutSessionId(): string | null {
    return this.checkoutSessionId
  }

  public markAsPaid(transactionRef: string, paidAt: string): void {
    if (this.status === PaymentStatus.PAID) {
      throw new Error("CONFLICT: payment is already marked as paid")
    }
    this.status = PaymentStatus.PAID
    this.transactionRef = transactionRef
    this.paidAt = paidAt
  }

  public toDTO(): PaymentDTO {
    return {
      id: this.id,
      bookingId: this.bookingId,
      checkoutSessionId: this.checkoutSessionId,
      amount: this.amount,
      currency: this.currency,
      method: this.method,
      status: this.status,
      transactionRef: this.transactionRef,
      qrCodeUrl: this.qrCodeUrl,
      redirectUrl: this.redirectUrl,
      paidAt: this.paidAt,
      createdAt: this.createdAt,
    }
  }
}
