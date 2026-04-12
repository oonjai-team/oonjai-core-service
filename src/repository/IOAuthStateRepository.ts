export interface PendingState {
  expiry: number
  provider: string
  redirectUrl?: string
}

export interface IOAuthStateRepository {
  get(id: string): Promise<PendingState | undefined>
  set(id: string, state: PendingState): Promise<void>
  clearExpired(): Promise<void>
  remove(id: string): Promise<void>
}