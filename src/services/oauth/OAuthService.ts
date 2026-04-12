import type {IService} from "@serv/IService"
import type {IOAuthStateRepository} from "@repo/IOAuthStateRepository"

export interface TokenReponse {
  access_token: string
  expires_in: number
  id_token?: string
  refresh_token: string
  scope: string
  token_type: string
}

export interface OauthStandardUser {firstname: string, lastname:string, email: string}

export abstract class OAuthService implements IService {

  constructor(
    protected readonly clientId: string,
    private readonly clientSecret: string,
    private readonly stateRepo: IOAuthStateRepository
  ) {}

  protected abstract getAuthUrl(): string
  protected abstract getTokenUrl(): string
  protected abstract getProfileUrl(): string
  public abstract getProviderName(): string


  public getServiceId(): string {
    return `OAuthService ${this.getProviderName()}`
  }

  // Redirect back to the service
  public getRedirectUri(): string {
    return new URL("/auth/oauth/callback", process.env["PUBLIC_SERVICE_URL"] ?? "http://localhost:3000").href
  }

  /**
   * Generate the LINE authorization URL with a new CSRF state token.
   * @param redirectUrl - Optional frontend URL to return to after the callback.
   */
  public async buildAuthUrl(redirectUrl?: string, options: {scope: string, response_type: string} | {} = {}): Promise<string> {
    const state = crypto.randomUUID()
    await this.stateRepo.set(state, {expiry: Date.now() + 10 * 60 * 1000,provider: this.getProviderName(), redirectUrl}) // 10-min TTL
    await this.stateRepo.clearExpired()

    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.clientId,
      redirect_uri: this.getRedirectUri(),
      state,
      scope: "profile openid email",
      ...options
    })

    return `${this.getAuthUrl()}?${params.toString()}`
  }

  /**
   * Validate and consume a state token (one-time use, prevents CSRF).
   * Returns the stored redirectUrl alongside the validity result.
   */

  /**
   * Exchange the authorization code for LINE access/refresh tokens.
   */
  public async exchangeCodeForToken(code: string): Promise<TokenReponse> {
    const res = await fetch(this.getTokenUrl(), {
      method: "POST",
      headers: {"Content-Type": "application/x-www-form-urlencoded"},
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: this.getRedirectUri(),
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    })

    if (!res.ok) {
      const detail = await res.text()
      throw new Error(`Oauth token exchange failed (${res.status}): ${detail}`)
    }

    return res.json() as Promise<TokenReponse>
  }


  public async getUserProfile(token: TokenReponse): Promise<OauthStandardUser> {
    const res = await fetch(this.getProfileUrl(), {
      headers: {Authorization: `Bearer ${token.access_token}`},
    })

    if (!res.ok) {
      const detail = await res.text()
      throw new Error(`profile fetch failed (${res.status}): ${detail}`)
    }

    return res.json() as Promise<OauthStandardUser>
  }
}
