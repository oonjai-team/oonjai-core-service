import {randomUUID} from "node:crypto"
import {UUID} from "@type/uuid"
import type {ITestDatabase} from "../../src/lib/TestDatabase"

/**
 * Pure in-memory ITestDatabase for unit tests.
 * Mirrors TestFSDatabase semantics but never touches the filesystem,
 * so tests cannot pollute database.json.
 */
export class MemoryTestDatabase implements ITestDatabase {
  private dataMemory: Record<string, Record<string, any>> = {}

  public dump(): void {
    // no-op for tests; kept to satisfy the interface
  }

  private load(name: string): Record<string, any> {
    if (!(name in this.dataMemory)) this.dataMemory[name] = {}
    return this.dataMemory[name] as Record<string, any>
  }

  public get(collection: string, id: UUID): any {
    const col = this.load(collection)
    if (id.toString() in col) {
      const data = col[id.toString()]
      data.id = id.toString()
      return data
    }
    throw new Error(`Data with id ${id} not found`)
  }

  public set(collection: string, id: UUID, data: any): boolean {
    const col = this.load(collection)
    delete data.id
    col[id.toString()] = data
    return true
  }

  public update(collection: string, id: UUID, data: Record<string, any>): boolean {
    const col = this.load(collection)
    if (id.toString() in col) {
      delete data.id
      const t = col[id.toString()] ?? {}
      for (const [k, v] of Object.entries(data)) {
        if (v === undefined) continue
        t[k] = v
      }
      col[id.toString()] = t
      return true
    }
    return false
  }

  public getAll(collection: string): any[] {
    return Object.entries(this.load(collection)).map(([k, v]) => {
      v.id = k
      return v
    })
  }

  public insert(collection: string, data: any): UUID {
    const col = this.load(collection)
    const uuid = randomUUID()
    delete data.id
    col[uuid] = data
    return new UUID(uuid)
  }

  public delete(collection: string, id: UUID): boolean {
    const col = this.load(collection)
    if (id.toString() in col) {
      delete col[id.toString()]
      return true
    }
    return false
  }
}
