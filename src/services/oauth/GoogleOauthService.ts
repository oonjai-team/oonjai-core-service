import {OAuthService, type OauthStandardUser, type TokenReponse} from "@serv/oauth/OAuthService"

export class GoogleOauthService extends OAuthService {
    protected override getAuthUrl(): string {
        return "https://accounts.google.com/o/oauth2/v2/auth"
    }
    protected override getTokenUrl(): string {
        return "https://oauth2.googleapis.com/token"
    }
    protected override getProfileUrl(): string {
        return "https://www.googleapis.com/oauth2/v2/userinfo"
    }

    override async getUserProfile(token: TokenReponse): Promise<OauthStandardUser> {
        const raw: any = await super.getUserProfile(token);
        return {
            email: raw.email,
            firstname: raw.given_name,
            lastname: raw.family_name,
        }
    }

    public override getProviderName(): string {
        return "google"
    }

}