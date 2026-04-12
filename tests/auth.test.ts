/**
 * Feature 1 — User Registration and Login (TC1–TC12)
 *
 * Exercises the auth endpoints (register / login / logout) directly with mocked
 * HttpContexts and an in-memory database, so no real HTTP server is needed.
 */
import {describe, expect, test} from "bun:test"
import {register} from "@endpoint/auth/register"
import {login} from "@endpoint/auth/login"
import {logout} from "@endpoint/auth/logout"
import {RoleEnum} from "@type/user"
import {emptyCtx, makeEnv, makeSessionFor} from "./helpers/factories"

describe("Feature 1 — User Registration and Login", () => {
  // ── TC1: Successful registration with valid data ───────────────────────────
  test("TC1 — successful registration with valid data", async () => {
    const env = makeEnv()
    const result = await register.handler(
      emptyCtx({body: {email: "alice@example.com", firstname: "Alice", lastname: "Wong", role: RoleEnum.ADULTCHILD}}),
      [env.authService],
      null
    )

    expect(result.status).toBe(201)
    const body = result.body as Record<string, unknown>
    expect(body.email).toBe("alice@example.com")
    expect(body.id).toBeDefined()
    expect(env.userService.findUserByEmail("alice@example.com")).toBeDefined()
  })

  // ── TC2: Registration with already-used email is rejected ─────────────────
  test("TC2 — registration with already-used email is rejected", async () => {
    const env = makeEnv()
    const payload = {email: "dupe@example.com", firstname: "Dup", lastname: "User", role: RoleEnum.ADULTCHILD}

    const first = await register.handler(emptyCtx({body: payload}), [env.authService], null)
    expect(first.status).toBe(201)

    const second = await register.handler(emptyCtx({body: payload}), [env.authService], null)
    expect(second.status).not.toBe(201)
  })

  // ── TC3: Registration with malformed email is rejected ────────────────────
  test("TC3 — registration with malformed email is rejected", async () => {
    const env = makeEnv()
    const result = await register.handler(
      emptyCtx({body: {email: "alice@", firstname: "Alice", lastname: "Wong", role: RoleEnum.ADULTCHILD}}),
      [env.authService],
      null
    )
    expect(result.status).toBe(400)
  })

  // ── TC4: Registration with invalid role is rejected ───────────────────────
  test("TC4 — registration with invalid role is rejected", async () => {
    const env = makeEnv()
    const result = await register.handler(
      emptyCtx({body: {email: "bob@example.com", firstname: "Bob", lastname: "Smith", role: "wizard"}}),
      [env.authService],
      null
    )
    expect(result.status).toBe(400)
    expect((result.body as {message: string}).message).toMatch(/role/)
  })

  // ── TC5: Registration missing required field ──────────────────────────────
  test("TC5 — registration missing firstname is rejected", async () => {
    const env = makeEnv()
    const result = await register.handler(
      emptyCtx({body: {email: "no-first@example.com", lastname: "Smith", role: RoleEnum.ADULTCHILD}}),
      [env.authService],
      null
    )
    expect(result.status).toBe(400)
    expect((result.body as {message: string}).message).toMatch(/firstname/)
  })

  // ── TC6: Caretaker registration missing caretaker attributes ──────────────
  test("TC6 — caretaker registration missing required caretaker fields is rejected", async () => {
    const env = makeEnv()
    const result = await register.handler(
      emptyCtx({body: {email: "ct@example.com", firstname: "Care", lastname: "Taker", role: RoleEnum.CARETAKER}}),
      [env.authService],
      null
    )
    expect(result.status).toBe(400)
    expect((result.body as {message: string}).message).toMatch(/caretaker registration requires/)
  })

  // ── TC7: Successful login with valid credentials ──────────────────────────
  test("TC7 — successful login with valid credentials returns session cookies", async () => {
    const env = makeEnv()
    env.userService.createUser("alice@example.com", "Alice", "Wong", RoleEnum.ADULTCHILD)

    const result = await login.handler(
      emptyCtx({body: {email: "alice@example.com"}}),
      [env.authService],
      null
    )

    expect(result.status).toBe(200)
    expect(result.cookies?.find((c) => c.name === "access_token")?.value).toBeTruthy()
    expect(result.cookies?.find((c) => c.name === "refresh_token")?.value).toBeTruthy()
  })

  // ── TC8: Login with email but no credential should not return a session ───
  test("TC8 — login with email but no credential does not return a session", async () => {
    const env = makeEnv()
    env.userService.createUser("victim@example.com", "Victim", "User", RoleEnum.ADULTCHILD)

    const result = await login.handler(
      emptyCtx({body: {email: "victim@example.com"}}),
      [env.authService],
      null
    )
    expect(result.status).toBe(401)
  })

  // ── TC9: Login with non-existent email ────────────────────────────────────
  test("TC9 — login with non-existent email returns 401", async () => {
    const env = makeEnv()
    const result = await login.handler(
      emptyCtx({body: {email: "ghost@example.com"}}),
      [env.authService],
      null
    )
    expect(result.status).toBe(401)
    expect((result.body as {message: string}).message).toMatch(/authentication failed/)
  })

  // ── TC10: Login with missing email field ──────────────────────────────────
  test("TC10 — login without email is rejected as bad request", async () => {
    const env = makeEnv()
    const result = await login.handler(emptyCtx({body: {}}), [env.authService], null)
    expect(result.status).toBe(400)
    expect((result.body as {message: string}).message).toMatch(/email is required/)
  })

  // ── TC11: Logout clears session token ─────────────────────────────────────
  test("TC11 — logout revokes the session token and clears cookies", async () => {
    const env = makeEnv()
    const id = env.userService.createUser("alice@example.com", "Alice", "Wong", RoleEnum.ADULTCHILD)
    const user = env.userService.getUserById(id)!
    const accessToken = await env.sessionService.createSession(id)
    const session = makeSessionFor(user, accessToken)

    expect(await env.sessionService.resolveSession(accessToken)).not.toBeNull()

    const result = await logout.handler(emptyCtx(), [env.authService], session)
    expect(result.status).toBe(204)
    expect(result.cookies?.length).toBeGreaterThanOrEqual(2)
    expect(result.cookies?.every((c) => c.maxAge === 0)).toBe(true)

    expect(await env.sessionService.resolveSession(accessToken)).toBeNull()
  })

  // ── TC12: Logout without a session returns 401 ────────────────────────────
  test("TC12 — logout without a session returns 401", async () => {
    const env = makeEnv()
    const result = await logout.handler(emptyCtx(), [env.authService], null)
    expect(result.status).toBe(401)
  })
})
