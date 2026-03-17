import type {Endpoint} from "@http/HttpContext"
import type {Router} from "@http/Router"
import type {IService} from "@serv/IService"

export class EndpointRegistry {
  constructor(private router: Router) {}

  public register<S extends IService[]>(endpoint: Endpoint<S>, service: S): this {
    const serviceIds = service.map(s => s.getServiceId()).join(", ")
    console.log(`Registered ${endpoint.method} ${endpoint.path} ${serviceIds}`)
    this.router.route(endpoint as Endpoint, service)
    return this
  }
}
