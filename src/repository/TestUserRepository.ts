import type { IUserRepository } from "./IUserRepository"
import type {ITestDatabase} from "../lib/TestDatabase"
import {User} from "@entity/User"
import type {UUID} from "@type/uuid"
import {Timestamp} from "@type/timestamp"


export class TestUserRepository implements IUserRepository {

  constructor(private db: ITestDatabase) {}
  save(user: User) {
    if (user.isNew()) {
      this.insert(user)
      return true
    }

    this.db.update("user", user.getId() as string, user.toDTO())
    return true
  }
  delete(user: User): void {
     if (user.isNew()) {
      throw new Error("cannot delete")
     }

     this.db.delete("user", user.getId() as string)
  }
  insert(user: User): UUID {
      return this.db.insert("user",user.toDTO())
  }
  findById(id: UUID): User | undefined {
    const user = this.db.get("user",id.toString())
    return new User(user.email, user.firstname, user.lastname, new Timestamp(user.createdAt), user.role, id)
  }

}