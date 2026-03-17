import {TestUserRepository} from "@repo/TestUserRepository"
import {TestSeniorRepository} from "@repo/TestSeniorRepository"
import {UserService} from "@serv/UserService"
import {SeniorManagementService} from "@serv/SeniorManagementService"
import {Router} from "@http/Router"
import {EndpointRegistry} from "@http/EndpointRegistry"
import {serveBun} from "@http/BunAdapter"
import {TestFSDatabase} from "./lib/TestFSDatabase"
import {updateUser} from "@endpoint/users/updateUser"
import {addSenior} from "@endpoint/seniors/addSenior"
import {getAllSeniors} from "@endpoint/seniors/getAllSeniors"

const db = new TestFSDatabase()
const userRepo = new TestUserRepository(db)
const seniorRepo = new TestSeniorRepository(db)

const userService = new UserService(userRepo)
const seniorManagementService = new SeniorManagementService(userRepo, seniorRepo)

const router = new Router()
const registry = new EndpointRegistry(router)

registry.register(updateUser, [userService])
  .register(addSenior, [seniorManagementService])
  .register(getAllSeniors, [seniorManagementService])

serveBun(router, {port: 3000})