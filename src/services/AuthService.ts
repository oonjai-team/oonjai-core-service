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

  public async login(email: string, oauthToken?: string): Promise<SessionToken> {
    void oauthToken

    const user = await this.userService.findUserByEmail(email)
    if (!user) throw new Error("user not found")

    const id = user.getId()!
    const [accessToken, refreshToken] = await Promise.all([
      this.sessionService.createSession(id),
      this.sessionService.createRefreshToken(id),
    ])

    return {accessToken, refreshToken, expiresIn: 3600}
  }

  public async register(
    email: string,
    oauthToken: string | undefined,
    firstname: string,
    lastname: string,
    role: RoleEnum,
    caretakerAttr?: CareTakerUserAttributes
  ): Promise<User> {
    void oauthToken

    if (role === RoleEnum.CARETAKER) {
      if (!caretakerAttr) throw new Error("caretakerAttr required for caretaker registration")
      const id = await this.userService.createCaretaker(email, firstname, lastname, caretakerAttr)
      return (await this.userService.getUserById(id))!
    }

    const id = await this.userService.createUser(email, firstname, lastname, role)
    return (await this.userService.getUserById(id))!
  }

  public logout(token: string): void {
    this.sessionService.revokeToken(token)
  }
}
