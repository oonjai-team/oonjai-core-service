import {UUID} from "../type/uuid"
import {randomUUID} from "node:crypto"
import * as fs from "node:fs"
import type {ITestDatabase} from "./TestDatabase"

export class TestFSDatabase implements ITestDatabase {

  private dataMemory: Record<string, Record<string, any>> = {}

  constructor() {
    this.fsFetch()
  }

  public dump() {
    console.log(this.dataMemory)
  }

  private fsWrite() {
    fs.writeFileSync("database.json", JSON.stringify(this.dataMemory, null, 2))
  }

  private fsFetch() {
    const r = fs.readFileSync("database.json")

    if (r.toString()) {
      this.dataMemory = JSON.parse(r.toString() ?? "{}")
    }else {
      this.dataMemory = {}
    }
  }

  private loadCollection(name: string): Record<string, any> {
    if (this.dataMemory[name]) {
      return this.dataMemory[name]
    }

    return {}
  }

  public get(collection: string, id: UUID) {
    const col = this.loadCollection(collection)
    if (id.toString() in col) {
      const data = col[id.toString()]
      // inject id to data
      data["id"] = id.toString()
      return data
    }

    throw new Error(`Data with id ${id} not found`)
  }

  public update(collection: string, id: UUID, data: any): boolean {
    const col = this.loadCollection(collection)
    if (id.toString() in col) {
      delete data["id"]
      col[id.toString()] = data
      this.dataMemory = col
      this.fsWrite()
      return true
    }
    return false
  }

  public getAll(collection: string): any[] {
    return Object.entries(this.loadCollection(collection)).map(([k,v]) => {
      v["id"] = k
      return v
    })
  }

  public insert(collection: string, data: any): UUID {
    const col = this.loadCollection(collection)
    const uuid = randomUUID()
    delete data["id"]
    col[uuid] = data
    this.dataMemory[collection] = col
    this.fsWrite()
    return new UUID(uuid)
  }

  public delete(collection: string, id: UUID): boolean {
    const col = this.loadCollection(collection)
    if (id.toString() in col) {
      delete col[id.toString()]
      this.dataMemory = col
      this.fsWrite()
      return true
    }
    return false
  }
}