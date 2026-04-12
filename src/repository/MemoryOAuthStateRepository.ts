import type {PendingState, IOAuthStateRepository} from "@repo/IOAuthStateRepository"

export class MemoryOAuthStateRepository implements IOAuthStateRepository {
  private states: Map<string, PendingState> = new Map()

  async get(id: string): Promise<PendingState | undefined> {
    return this.states.get(id)
  }

  async set(id: string, state: PendingState): Promise<void> {
    this.states.set(id, state)
  }

  async clearExpired(): Promise<void> {
    const now = Date.now()
    for (const [state, entry] of this.states) {
      if (now > entry.expiry) this.states.delete(state)
    }
  }

  async remove(id: string): Promise<void> {
    this.states.delete(id)
  }
}