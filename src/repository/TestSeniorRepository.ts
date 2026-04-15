import type {ISeniorRepository} from "@repo/ISeniorRepository"
import type {ITestDatabase} from "../lib/TestDatabase"
import {Senior} from "@entity/Senior"
import type {UUID} from "@type/uuid"


export class TestSeniorRepository implements ISeniorRepository {

  constructor(private db: ITestDatabase) {
  }

  public async save(senior: Senior): Promise<boolean> {
    const id = senior.getId()
    if (!id) return false
    this.db.update("senior", id, senior.toDTO())
    return true
  }

  public async findById(id: UUID): Promise<Senior | undefined> {
    return this.db.get("senior", id)
  }

  public async findAllByAdultChildId(adultChildId: UUID): Promise<Senior[]> {
    return this.db.getAll("senior")
      .filter(dto => (dto.adultChildId.toString() === adultChildId.toString()))
      .map(dto => new Senior(dto))
  }

  async delete(senior: Senior): Promise<void> {
    if (senior.isNew()) {
      throw new Error("cannot delete")
    }

    this.db.delete("senior", senior.getId() as UUID)
  }

  async insert(senior: Senior): Promise<UUID> {
    return this.db.insert("senior",senior.toDTO())
  }



}
