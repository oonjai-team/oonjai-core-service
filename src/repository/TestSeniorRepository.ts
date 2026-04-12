import type {ISeniorRepository} from "@repo/ISeniorRepository"
import type {ITestDatabase} from "../lib/TestDatabase"
import {Senior} from "@entity/Senior"
import type {UUID} from "@type/uuid"


export class TestSeniorRepository implements ISeniorRepository {

  constructor(private db: ITestDatabase) {
  }

  public save(senior: Senior): boolean {
    const id = senior.getId()
    if (!id) return false
    this.db.update("senior", id, senior.toDTO())
    return true
  }

  public findById(id: UUID): Senior | undefined {
    return this.db.get("senior", id)
  }

  public findAllByAdultChildId(adultChildId: UUID): Senior[] {
    return this.db.getAll("senior")
      .filter(dto => (dto.adultChildId.toString() === adultChildId.toString()))
      .map(dto => new Senior(dto))
  }

  delete(senior: Senior): void {
    if (senior.isNew()) {
      throw new Error("cannot delete")
    }

    this.db.delete("senior", senior.getId() as UUID)
  }

  insert(senior: Senior): UUID {
    return this.db.insert("senior",senior.toDTO())
  }



}