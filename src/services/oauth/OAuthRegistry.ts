import type {IService} from "@serv/IService"
import type {IOAuthStateRepository} from "@repo/IOAuthStateRepository"
import type {OAuthService} from "@serv/oauth/OAuthService"


export type StateValidationResult =
  | { valid: true; provider:string, redirectUrl?: string }
  | { valid: false }

export class OAuthRegistry implements IService {
  private serviceMap: Record<string, OAuthService>

  getServiceId(): string {
    return "OAuthRegistry"
  }

  constructor(
    private readonly stateRepo: IOAuthStateRepository,
    registeredServices: OAuthService[]
  ) {
    this.serviceMap = {}
    registeredServices.forEach((r) => {
      const name = r.getProviderName()
      this.serviceMap[name] = r
    })

    console.log("OAuthRegistry initialized with services:", Object.keys(this.serviceMap))
  }

  public async validateState(state: string): Promise<StateValidationResult> {
    const entry = await this.stateRepo.get(state)
    if (!entry) return {valid: false}
    if (Date.now() > entry.expiry) return {valid: false}
    await this.stateRepo.remove(state)
    return {valid: true, provider: entry.provider, redirectUrl: entry.redirectUrl}
  }

  public async getServiceFromState(stateId: string): Promise<[Exclude<StateValidationResult, {valid: false}>, OAuthService] | undefined> {
    const validation = await this.validateState(stateId)
    if (!validation.valid) return undefined
    const serv = this.serviceMap[validation.provider]
    if (!serv) return undefined
    return [validation, serv]
  }

  public async getServiceFromProvider(provider: string): Promise<OAuthService | undefined> {
    return this.serviceMap[provider]
  }

  public isProviderSupported(provider: string) {
    return provider in this.serviceMap
  }

  public getSupportedProviders(): string[] {
    return Object.keys(this.serviceMap)
  }
}