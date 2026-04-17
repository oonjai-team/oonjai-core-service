/**
 * Feature 2 — Caretaker Selection / Search (TC13–TC22)
 *
 * The endpoint validation and authorisation paths are exercised against
 * `getAvailableCaretakers`. The list-shaping behaviour (filter / sort / empty
 * state) is exercised against `UserService.getAvailableCaretakers` directly,
 * since that is the unigit pgitt responsible for filtering and sorting.
 */
import {describe, expect, test} from "bun:test"
import {getAvailableCaretakers} from "@endpoint/caretakers/getAvailableCaretakers"
import {Session} from "@entity/Session"
import {RoleEnum} from "@type/user"
import {TestUserRepository} from "@repo/TestUserRepository"
import {TestAvailabilityRepository} from "@repo/TestAvailabilityRepository"
import {UserService} from "@serv/UserService"
import {JWTSessionService} from "@serv/JWTSessionService"
import {AuthService} from "@serv/AuthService"
import {MemoryTestDatabase} from "./helpers/MemoryTestDatabase"
import {emptyCtx, makeEnv, seedAdultChild, seedCaretaker} from "./helpers/factories"

const validQuery = {
  serviceType: "home_care",
  startDate: "2026-04-15T09:00:00.000Z",
  endDate: "2026-04-15T12:00:00.000Z",
}

describe("Feature 2 — Caretaker Selection / Search", () => {
  // ── TC13: Default list load (authorised + valid query) ────────────────────
  test("TC13 — authorised request with valid query returns 200", async () => {
    const env = makeEnv()
    const {session} = seedAdultChild(env)
    seedCaretaker(env, "ct1@example.com")

    const result = await getAvailableCaretakers.handler(
      emptyCtx({query: {...validQuery}}),
      [env.userService],
      session
    )
    expect(result.status).toBe(200)
    expect(Array.isArray(result.body)).toBe(true)
  })

  // ── TC14: Filter by specialization returns matching caretakers only ───────
  test("TC14 — filtering by specialization returns only matching caretakers", () => {
    const env = makeEnv()
    seedCaretaker(env, "elderly@example.com", {specialization: "elderly"})
    seedCaretaker(env, "pediatric@example.com", {specialization: "pediatric"})

    const elderlyOnly = env.userService.getAvailableCaretakers({
      serviceType: "home_care",
      startDate: new Date(validQuery.startDate),
      endDate: new Date(validQuery.endDate),
      specialization: "elderly",
    })
    expect(elderlyOnly.length).toBe(1)
  })

  // ── TC15: Minimum experience filter excludes junior caretakers ────────────
  test("TC15 — minExperience filter excludes caretakers with less experience", () => {
    const env = makeEnv()
    seedCaretaker(env, "junior@example.com", {experience: 1})
    seedCaretaker(env, "senior@example.com", {experience: 10})

    const seniors = env.userService.getAvailableCaretakers({
      serviceType: "home_care",
      startDate: new Date(validQuery.startDate),
      endDate: new Date(validQuery.endDate),
      minExperience: 5,
    })
    expect(seniors.length).toBe(1)
  })

  // ── TC16: Sorting by rating reorders the list correctly ───────────────────
  test("TC16 — sorting by rating returns caretakers in descending order", () => {
    const env = makeEnv()
    seedCaretaker(env, "low@example.com", {rating: 3.0})
    seedCaretaker(env, "high@example.com", {rating: 4.9})
    seedCaretaker(env, "mid@example.com", {rating: 4.0})

    const sorted = env.userService.getAvailableCaretakers({
      serviceType: "home_care",
      startDate: new Date(validQuery.startDate),
      endDate: new Date(validQuery.endDate),
      sortBy: "rating",
    })
    const ratings = sorted.map((u) => u.getCaretaker()!.toDTO().rating)
    expect(ratings).toEqual([...ratings].sort((a, b) => b - a))
  })

  // ── TC17: Max hourly rate filter (price boundary) ─────────────────────────
  test("TC17 — maxHourlyRate filter excludes caretakers above the cap", () => {
    const env = makeEnv()
    seedCaretaker(env, "cheap@example.com", {hourlyRate: 100})
    seedCaretaker(env, "expensive@example.com", {hourlyRate: 500})

    const affordable = env.userService.getAvailableCaretakers({
      serviceType: "home_care",
      startDate: new Date(validQuery.startDate),
      endDate: new Date(validQuery.endDate),
      maxHourlyRate: 200,
    })
    expect(affordable.length).toBe(1)
  })

  // ── TC18: Caretaker profile lookup returns the full profile ───────────────
  test("TC18 — caretaker profile lookup returns the caretaker's full profile", () => {
    const env = makeEnv()
    const {id} = seedCaretaker(env, "profile@example.com", {bio: "Hello world"})
    const found = env.userService.getUserById(id)
    expect(found).toBeDefined()
    expect(found!.isCaretaker()).toBe(true)
  })

  // ── TC19: Authorisation — request without session is blocked ──────────────
  test("TC19 — request without a session is rejected with 401", async () => {
    const env = makeEnv()
    const result = await getAvailableCaretakers.handler(
      emptyCtx({query: {...validQuery}}),
      [env.userService],
      null
    )
    expect(result.status).toBe(401)
  })

  // ── TC20: Empty result state when no caretaker matches ────────────────────
  test("TC20 — empty result state when filters match no caretaker", () => {
    const env = makeEnv()
    seedCaretaker(env, "elderly@example.com", {specialization: "elderly"})

    const none = env.userService.getAvailableCaretakers({
      serviceType: "home_care",
      startDate: new Date(validQuery.startDate),
      endDate: new Date(validQuery.endDate),
      specialization: "antarctica-night-nursing",
    })
    expect(none).toEqual([])
  })

  // ── TC21: Missing required query params is rejected ───────────────────────
  test("TC21 — missing required query params returns 400", async () => {
    const env = makeEnv()
    const {session} = seedAdultChild(env)

    const result = await getAvailableCaretakers.handler(
      emptyCtx({query: {serviceType: "home_care"}}),
      [env.userService],
      session
    )
    expect(result.status).toBe(400)
    expect((result.body as {message: string}).message).toMatch(/startDate/)
  })

  // ── TC22: End-to-end caretaker lookup returns the matching caretaker ──────
  test("TC22 — authorised request with one matching caretaker returns 200 with that caretaker", async () => {
    const db = new MemoryTestDatabase()
    const userRepo = new TestUserRepository(db)
    const availabilityRepo = new TestAvailabilityRepository(db)
    const userService = new UserService(userRepo, availabilityRepo)
    const sessionService = new JWTSessionService(userRepo, "test-secret")
    const authService = new AuthService(userService, sessionService)
    void authService

    const ownerId = userService.createUser("owner@example.com", "Owner", "User", RoleEnum.ADULTCHILD)
    userService.createCaretaker("ct@example.com", "Care", "Taker", {
      bio: "bio",
      specialization: "elderly",
      hourlyRate: 200,
      currency: "THB",
      experience: 5,
      rating: 4.5,
      reviewCount: 0,
      isVerified: true,
      contactInfo: "0800000000",
      permission: "all",
    })

    const owner = userService.getUserById(ownerId)!
    const now = Math.floor(Date.now() / 1000)
    const session = new Session("tok", ownerId.toString(), owner, now, now + 3600)

    const result = await getAvailableCaretakers.handler(
      emptyCtx({query: {...validQuery}}),
      [userService],
      session
    )
    expect(result.status).toBe(200)
    expect(Array.isArray(result.body)).toBe(true)
    expect((result.body as unknown[]).length).toBe(1)
  })
})
