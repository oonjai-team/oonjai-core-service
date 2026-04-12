import {OAuthService, type OauthStandardUser, type TokenReponse} from "@serv/oauth/OAuthService"

interface LineUserProfile {
  name: string,
  picture: string,
  sub: string,
}

export class LineOauthService extends OAuthService {
    protected override getAuthUrl(): string {
        return "https://access.line.me/oauth2/v2.1/authorize"
    }
    protected override getTokenUrl(): string {
        return "https://api.line.me/oauth2/v2.1/token"
    }
    protected override getProfileUrl(): string {
        return "https://api.line.me/oauth2/v2.1/verify"
    }

  override async getUserProfile(token: TokenReponse) {
    const res = await fetch(this.getProfileUrl(), {
      headers: {"Content-Type": "application/x-www-form-urlencoded"},
      method: "POST",
      body: new URLSearchParams({id_token: token.id_token ?? "", client_id: this.clientId})
    })

    if (!res.ok) {
      const detail = await res.text()
      throw new Error(`profile fetch failed (${res.status}): ${detail}`)
    }

    const user:any = await res.json()



    return {
      firstname: user.name,
      lastname: "",
      email: `${user.sub}@line.com`
    } as OauthStandardUser
  }

  public override getProviderName(): string {
        return "line"
    }

}