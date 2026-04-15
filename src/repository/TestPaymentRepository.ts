import type {IPaymentRepository} from "@repo/IPaymentRepository"
import type {ITestDatabase} from "../lib/TestDatabase"
import {Payment} from "@entity/Payment"
import {UUID} from "@type/uuid"

export class TestPaymentRepository implements IPaymentRepository {

  constructor(private db: ITestDatabase) {}

  public async findById(id: string): Promise<Payment | undefined> {
    try {
      const record = this.db.get("payment", new UUID(id))
      return new Payment({...record, id})
    } catch (_) {
      return undefined
    }
  }

  public async findByBookingId(bookingId: string): Promise<Payment | undefined> {
    const all = this.db.getAll("payment")
    const record = all.find(r => r.bookingId === bookingId)
    if (!record) return undefined
    return new Payment({...record})
  }

  public async findByTransactionRef(ref: string): Promise<Payment | undefined> {
    const all = this.db.getAll("payment")
    const record = all.find(r => r.transactionRef === ref)
    if (!record) return undefined
    return new Payment({...record})
  }

  public async findByCheckoutSessionId(sessionId: string): Promise<Payment | undefined> {
    const all = this.db.getAll("payment")
    const record = all.find(r => r.checkoutSessionId === sessionId)
    if (!record) return undefined
    return new Payment({...record})
  }

  public async insert(payment: Payment): Promise<string> {
    const id = crypto.randomUUID()
    const dto = payment.toDTO()
    this.db.set("payment", new UUID(id), {...dto, id})
    return id
  }

  public async save(payment: Payment): Promise<boolean> {
    if (payment.isNew()) {
      throw new Error("cannot save new payment without id")
    }
    const id = payment.getId() as string
    this.db.set("payment", new UUID(id), payment.toDTO())
    return true
  }
}
