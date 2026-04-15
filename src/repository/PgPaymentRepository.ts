import type {IPaymentRepository} from "@repo/IPaymentRepository"
import {Payment} from "@entity/Payment"
import {Timestamp} from "@type/timestamp"
import type {PaymentStatus, PaymentMethod} from "@type/payment"
import sql from "../lib/postgres"

export class PgPaymentRepository implements IPaymentRepository {

  async findById(id: string): Promise<Payment | undefined> {
    const rows = await sql`
      SELECT * FROM "PAYMENT" WHERE "PaymentID" = ${id}
    `
    const row = rows[0]
    if (!row) return undefined
    return this.toEntity(row)
  }

  async findByBookingId(bookingId: string): Promise<Payment | undefined> {
    const rows = await sql`
      SELECT * FROM "PAYMENT" WHERE "BookingID" = ${bookingId}
    `
    const row = rows[0]
    if (!row) return undefined
    return this.toEntity(row)
  }

  async findByTransactionRef(ref: string): Promise<Payment | undefined> {
    const rows = await sql`
      SELECT * FROM "PAYMENT" WHERE "TransRef" = ${ref}
    `
    const row = rows[0]
    if (!row) return undefined
    return this.toEntity(row)
  }

  async findByCheckoutSessionId(sessionId: string): Promise<Payment | undefined> {
    const rows = await sql`
      SELECT * FROM "PAYMENT" WHERE "CheckoutSessionId" = ${sessionId}
    `
    const row = rows[0]
    if (!row) return undefined
    return this.toEntity(row)
  }

  async insert(payment: Payment): Promise<string> {
    const dto = payment.toDTO()
    const rows = await sql`
      INSERT INTO "PAYMENT" (
        "BookingID", "CheckoutSessionId", "Amount", "Currency", "Method",
        "PaymentStatus", "TransRef", "QrCodeUrl", "RedirectUrl", "PaidAt", "CreatedDate"
      )
      VALUES (
        ${dto.bookingId}, ${dto.checkoutSessionId ?? null}, ${dto.amount}, ${dto.currency},
        ${dto.method}, ${dto.status}, ${dto.transactionRef}, ${dto.qrCodeUrl},
        ${dto.redirectUrl}, ${dto.paidAt}, ${new Date(dto.createdAt.getTime())}
      )
      RETURNING "PaymentID"
    `
    return rows[0]!.PaymentID
  }

  async save(payment: Payment): Promise<boolean> {
    const dto = payment.toDTO()
    if (!dto.id) return false
    const result = await sql`
      UPDATE "PAYMENT"
      SET "BookingID"          = ${dto.bookingId},
          "CheckoutSessionId"  = ${dto.checkoutSessionId ?? null},
          "Amount"             = ${dto.amount},
          "Currency"           = ${dto.currency},
          "Method"             = ${dto.method},
          "PaymentStatus"      = ${dto.status},
          "TransRef"           = ${dto.transactionRef},
          "QrCodeUrl"          = ${dto.qrCodeUrl},
          "RedirectUrl"        = ${dto.redirectUrl},
          "PaidAt"             = ${dto.paidAt}
      WHERE "PaymentID" = ${dto.id}
    `
    return result.count > 0
  }

  private toEntity(row: Record<string, any>): Payment {
    return new Payment({
      id: row.PaymentID,
      bookingId: row.BookingID,
      checkoutSessionId: row.CheckoutSessionId ?? undefined,
      amount: Number(row.Amount),
      currency: row.Currency,
      method: row.Method as PaymentMethod,
      status: row.PaymentStatus as PaymentStatus,
      transactionRef: row.TransRef,
      qrCodeUrl: row.QrCodeUrl,
      redirectUrl: row.RedirectUrl,
      paidAt: row.PaidAt ? new Date(row.PaidAt).toISOString() : null,
      createdAt: new Timestamp(new Date(row.CreatedDate).getTime()),
    })
  }
}
