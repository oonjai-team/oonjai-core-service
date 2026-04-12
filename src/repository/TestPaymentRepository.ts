import type {IPaymentRepository} from "@repo/IPaymentRepository"
import type {ITestDatabase} from "../lib/TestDatabase"
import {Payment} from "@entity/Payment"
import {UUID} from "@type/uuid"

export class TestPaymentRepository implements IPaymentRepository {

  constructor(private db: ITestDatabase) {}

  public findById(id: string): Payment | undefined {
    try {
      const record = this.db.get("payment", new UUID(id))
      return new Payment({...record, id})
    } catch (_) {
      return undefined
    }
  }

  public findByBookingId(bookingId: string): Payment | undefined {
    const all = this.db.getAll("payment")
    const record = all.find(r => r.bookingId === bookingId)
    if (!record) return undefined
    return new Payment({...record})
  }

  public findByTransactionRef(ref: string): Payment | undefined {
    const all = this.db.getAll("payment")
    const record = all.find(r => r.transactionRef === ref)
    if (!record) return undefined
    return new Payment({...record})
  }

  public findByCheckoutSessionId(sessionId: string): Payment | undefined {
    const all = this.db.getAll("payment")
    const record = all.find(r => r.checkoutSessionId === sessionId)
    if (!record) return undefined
    return new Payment({...record})
  }

  public insert(payment: Payment): string {
    const id = crypto.randomUUID()
    const dto = payment.toDTO()
    this.db.set("payment", new UUID(id), {...dto, id})
    return id
  }

  public save(payment: Payment): boolean {
    if (payment.isNew()) {
      throw new Error("cannot save new payment without id")
    }
    const id = payment.getId() as string
    this.db.set("payment", new UUID(id), payment.toDTO())
    return true
  }
}
