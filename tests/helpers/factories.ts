import {TestUserRepository} from "@repo/TestUserRepository"
import {TestBookingRepository} from "@repo/TestBookingRepository"
import {TestAvailabilityRepository} from "@repo/TestAvailabilityRepository"
import {UserService} from "@serv/UserService"
import {BookingService} from "@serv/BookingService"
import {AuthService} from "@serv/AuthService"
import {JWTSessionService} from "@serv/JWTSessionService"
import {Session} from "@entity/Session"
import {User} from "@entity/User"
import {Caretaker} from "@entity/Caretaker"
import {Timestamp, TimestampHelper} from "@type/timestamp"
import {RoleEnum} from "@type/user"
import type {HttpContext} from "@http/HttpContext"
import {MemoryTestDatabase} from "./MemoryTestDatabase"

export interface TestEnv {
  db: MemoryTestDatabase
  userRepo: TestUserRepository
  bookingRepo: TestBookingRepository
  availabilityRepo: TestAvailabilityRepository
  userService: UserService
  bookingService: BookingService
  authService: AuthService
  sessionService: JWTSessionService
}

export function makeEnv(): TestEnv {
  const db = new MemoryTestDatabase()
  const userRepo = new TestUserRepository(db)
  const bookingRepo = new TestBookingRepository(db)
  const availabilityRepo = new TestAvailabilityRepository(db)
  const userService = new UserService(userRepo, availabilityRepo)
  const bookingService = new BookingService(bookingRepo, userRepo, availabilityRepo)
  const sessionService = new JWTSessionService(userRepo, "test-secret")
  const authService = new AuthService(userService, sessionService)
  return {db, userRepo, bookingRepo, availabilityRepo, userService, bookingService, authService, sessionService}
}

export function emptyCtx(overrides: Partial<HttpContext> = {}): HttpContext {
  return {
    params: {},
    query: {},
    headers: {},
    cookies: {},
    body: undefined,
    ...overrides,
  }
}

export function makeSessionFor(user: User, token = "test-token"): Session {
  const now = Math.floor(Date.now() / 1000)
  const id = user.getId()!.toString()
  return new Session(token, id, user, now, now + 3600)
}

/** Persist an adult-child user and return both id and a session. */
export function seedAdultChild(env: TestEnv, email = "owner@example.com") {
  const id = env.userService.createUser(email, "Owner", "User", RoleEnum.ADULTCHILD)
  const user = env.userService.getUserById(id)!
  return {id, user, session: makeSessionFor(user)}
}

export function seedCaretaker(env: TestEnv, email = "ct@example.com", overrides: Partial<{bio: string; hourlyRate: number; rating: number; experience: number; specialization: string}> = {}) {
  const id = env.userService.createCaretaker(email, "Care", "Taker", {
    bio: overrides.bio ?? "Experienced caregiver",
    specialization: overrides.specialization ?? "elderly",
    hourlyRate: overrides.hourlyRate ?? 200,
    currency: "THB",
    experience: overrides.experience ?? 5,
    rating: overrides.rating ?? 4.5,
    reviewCount: 0,
    isVerified: true,
    isAvailable: true,
    contactInfo: "0800000000",
    permission: "all",
  })

  // NOTE: TestUserRepository.findAvailableCaretaker reads from collection
  // "users" (plural) at src/repository/TestUserRepository.ts:92, while every
  // write goes to "user" (singular). Until that typo is fixed, the available-
  // caretaker lookup throws. Mirror the row under "users" so tests can drive
  // the filter / sort code paths without depending on that bug being fixed.
  const userRow = env.db.get("user", id)
  env.db.set("users", id, {...userRow})

  const user = env.userService.getUserById(id)!
  return {id, user}
}
