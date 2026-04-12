import type {ISessionService} from "@serv/ISessionService"
import type {UserService} from "@serv/UserService"
import type {IService} from "@serv/IService"
import type {SessionToken} from "@type/session"
import type {User} from "@entity/User"
import {RoleEnum} from "@type/user"
import {UUID} from "@type/uuid"
import type {CareTakerUserAttributes} from "@entity/UserDTO"

export class AuthService implements IService {
  constructor(
    private userService: UserService,
    private sessionService: ISessionService
  ) {}

  public getServiceId(): string {
    return "AuthService"
  }

  /**
   * OAuth login flow:
   * The OAuth provider authenticates the user and gives the client an access token.
   * The client sends that token here alongside the verified email.
   *
   * TODO: validate `oauthToken` against your OAuth provider
   *       (e.g. GET https://openidconnect.googleapis.com/v1/userinfo)
   *       and extract the verified email before trusting it.
   */
  public async login(email: string, oauthToken?: string): Promise<SessionToken> {
    // TODO: when OAuth provider is connected, make oauthToken required and verify it here
    //       e.g. GET https://openidconnect.googleapis.com/v1/userinfo
    void oauthToken

    const user = this.userService.findUserByEmail(email)
    if (!user) throw new Error("user not found")

    const id = user.getId()!
    const [accessToken, refreshToken] = await Promise.all([
      this.sessionService.createSession(id),
      this.sessionService.createRefreshToken(id),
    ])

    return {accessToken, refreshToken, expiresIn: 3600}
  }

  /**
   * Create a new user — called when an OAuth user signs in for the first time.
   */
  public async register(
    email: string,
    oauthToken: string | undefined,
    firstname: string,
    lastname: string,
    role: RoleEnum,
    caretakerAttr?: CareTakerUserAttributes
  ): Promise<User> {
    // TODO: when OAuth provider is connected, make oauthToken required and verify it here
    void oauthToken

    if (role === RoleEnum.CARETAKER) {
      if (!caretakerAttr) throw new Error("caretakerAttr required for caretaker registration")
      const id = this.userService.createCaretaker(email, firstname, lastname, caretakerAttr)
      return this.userService.getUserById(id)!
    }

    const id = this.userService.createUser(email, firstname, lastname, role)
    return this.userService.getUserById(id)!
  }

  public logout(token: string): void {
    this.sessionService.revokeToken(token)
  }
}
