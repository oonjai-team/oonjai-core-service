import {UUID} from "../type/uuid"
import {randomUUID} from "node:crypto"
import * as fs from "node:fs"
import type {ITestDatabase} from "./TestDatabase"

export class TestFSDatabase implements ITestDatabase {

  // No static or instance memory cache. We read/write fresh every time.

  private getDbData(): Record<string, Record<string, any>> {
    if (fs.existsSync("database.json")) {
      const r = fs.readFileSync("database.json", "utf-8")
      if (r.trim()) {
        return JSON.parse(r)
      }
    }
    return {}
  }

  private saveDbData(data: Record<string, Record<string, any>>) {
    fs.writeFileSync("database.json", JSON.stringify(data, null, 2))
  }

  public dump() {
    console.log(this.getDbData())
  }

  public get(collection: string, id: UUID) {
    const db = this.getDbData()
    const col = db[collection] || {}
    
    if (id.toString() in col) {
      const data = col[id.toString()]
      data["id"] = id.toString()
      return data
    }

    throw new Error(`Data with id ${id} not found`)
  }

  public insert(collection: string, data: any): UUID {
    const db = this.getDbData()
    const col = db[collection] || {}
    const uuid = randomUUID()
    
    delete data["id"]
    col[uuid] = data
    db[collection] = col
    
    this.saveDbData(db)
    return new UUID(uuid)
  }

  public set(collection: string, id: UUID, data: any): boolean {
    const db = this.getDbData()
    const col = db[collection] || {}
    delete data["id"]
    col[id.toString()] = data
    db[collection] = col
    this.saveDbData(db)
    return true
  }

  public update(collection: string, id: UUID, data: Record<string, any>): boolean {
    const db = this.getDbData()
    const col = db[collection] || {}
    if (id.toString() in col) {
      delete data["id"]
      const t = col[id.toString()] ?? {}
      for (const [k, v] of Object.entries(data)) {
        if (v === undefined) continue
        t[k] = v
      }
      col[id.toString()] = t
      db[collection] = col
      this.saveDbData(db)
      return true
    }
    return false
  }

  public getAll(collection: string): any[] {
    const db = this.getDbData()
    const col = db[collection] || {}

    return Object.entries(col).map(([k, v]) => {
      v["id"] = k
      return v
    })
  }

  public delete(collection: string, id: UUID): boolean {
    const db = this.getDbData()
    const col = db[collection] || {}

    if (!(id.toString() in col)) return false

    delete col[id.toString()]
    db[collection] = col
    this.saveDbData(db)
    return true
  }
}