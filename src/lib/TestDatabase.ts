import {UUID} from "../type/uuid"


export interface ITestDatabase {
  dump(): void

  get(collection: string, id: UUID): any

  getAll(collection: string): any[]

  update(collection: string, id: UUID, data: any): boolean

  set(collection: string, id: UUID, data: any): boolean

  insert(collection: string, data: any): UUID

  delete(collection: string, id: UUID): boolean
}