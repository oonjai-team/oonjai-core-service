import type {ISessionService} from "@serv/ISessionService"
import type {IUserRepository} from "@repo/IUserRepository"
import type {User} from "@entity/User"
import {UUID} from "@type/uuid"
import {Session} from "@entity/Session"
import type {JWTPayload, SessionToken} from "@type/session"

const ACCESS_TTL_SECONDS = 60 * 60            // 1 hour
const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 7  // 7 days


// ── Web Crypto helpers (no external deps, native in Bun) ──────────────────────

function base64url(input: ArrayBuffer | string): string {
  const bytes =
    typeof input === "string"
      ? new TextEncoder().encode(input)
      : new Uint8Array(input)
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")
}

function base64urlDecode(input: string): string {
  return atob(input.replace(/-/g, "+").replace(/_/g, "/"))
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    {name: "HMAC", hash: "SHA-256"},
    false,
    ["sign", "verify"]
  )
}

async function signToken(payload: JWTPayload, secret: string): Promise<string> {
  const header = base64url(JSON.stringify({alg: "HS256", typ: "JWT"}))
  const body = base64url(JSON.stringify(payload))
  const data = new TextEncoder().encode(`${header}.${body}`)
  const key = await importKey(secret)
  const sig = await crypto.subtle.sign("HMAC", key, data)
  return `${header}.${body}.${base64url(sig)}`
}

async function verifyToken(token: string, secret: string): Promise<JWTPayload | null> {
  const parts = token.split(".")
  if (parts.length !== 3) return null
  const [header, body, signature] = parts as [string, string, string]

  const data = new TextEncoder().encode(`${header}.${body}`)
  const key = await importKey(secret)
  const sigBytes = Uint8Array.from(base64urlDecode(signature), (c) => c.charCodeAt(0))

  const valid = await crypto.subtle.verify("HMAC", key, sigBytes, data)
  if (!valid) return null

  const payload = JSON.parse(base64urlDecode(body)) as JWTPayload

  // Reject expired tokens — exp is in seconds
  if (payload.exp < Math.floor(Date.now() / 1000)) return null

  return payload
}

// ─────────────────────────────────────────────────────────────────────────────

export class JWTSessionService implements ISessionService {
  /** In-memory revocation set — tokens added on logout are rejected until server restart.
   *  TODO: Replace with a persistent store (Redis, DB) in production. */
  private revoked = new Set<string>()

  constructor(
    private userRepo: IUserRepository,
    private secret: string
  ) {}

  public getServiceId(): string {
    return "JWTSessionService"
  }

  public async createSession(userId: UUID | string): Promise<string> {
    const now = Math.floor(Date.now() / 1000)
    return signToken(
      {userId: userId.toString(), type: "access", iat: now, exp: now + ACCESS_TTL_SECONDS},
      this.secret
    )
  }

  public async createRefreshToken(userId: UUID | string): Promise<string> {
    const now = Math.floor(Date.now() / 1000)
    return signToken(
      {userId: userId.toString(), type: "refresh", iat: now, exp: now + REFRESH_TTL_SECONDS},
      this.secret
    )
  }

  public async validate(token: string): Promise<JWTPayload | null> {
    if (this.revoked.has(token)) return null
    const payload = await verifyToken(token, this.secret)
    if (payload !== null) {
      return payload
    }
    return null
  }


  public revokeToken(token: string): void {
    this.revoked.add(token)
  }

  public async refreshToken(token: string): Promise<SessionToken> {
    const payload = (await this.validate(token))
    const userId = payload?.userId
    if (payload?.type !== "refresh") throw new Error("invalid token type")
    if (!userId) throw new Error("invalid or expired refresh token")

    // Rotate — revoke the old refresh token before issuing new pair
    this.revokeToken(token)

    const id = new UUID(userId)
    const [accessToken, refreshToken] = await Promise.all([
      this.createSession(id),
      this.createRefreshToken(id),
    ])

    return {accessToken, refreshToken, expiresIn: 3600}
  }

  public async resolveSession(token: string): Promise<Session | null> {
    if (this.revoked.has(token)) return null

    const payload = await verifyToken(token, this.secret)
    if (!payload) return null
    if (payload.type !== "access") return null

    const user = await this.userRepo.findById(new UUID(payload.userId))
    if (!user) return null

    const session = new Session(token, payload.userId, user, payload.iat, payload.exp)
    if (session.isExpired()) return null
    return  session
  }
}
