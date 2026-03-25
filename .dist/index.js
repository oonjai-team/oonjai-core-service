import { TestUserRepository } from "@repo/TestUserRepository";
import { TestSeniorRepository } from "@repo/TestSeniorRepository";
import { UserService } from "@serv/UserService";
import { SeniorManagementService } from "@serv/SeniorManagementService";
import { AuthService } from "@serv/AuthService";
import { JWTSessionService } from "@serv/JWTSessionService";
import { Router } from "@http/Router";
import { EndpointRegistry } from "@http/EndpointRegistry";
import { serveBun } from "@http/BunAdapter";
import { TestFSDatabase } from "./lib/TestFSDatabase";
import { updateUser } from "@endpoint/users/updateUser";
import { addSenior } from "@endpoint/seniors/addSenior";
import { getAllSeniors } from "@endpoint/seniors/getAllSeniors";
import { getSeniorById } from "@endpoint/seniors/getSeniorById";
import { deleteSenior } from "@endpoint/seniors/deleteSenior";
import { login } from "@endpoint/auth/login";
import { register } from "@endpoint/auth/register";
import { logout } from "@endpoint/auth/logout";
import { refreshToken } from "@endpoint/auth/refreshToken";
import { getCurrentSession } from "@endpoint/auth/getCurrentSession";
import { me } from "@endpoint/users/me";
// ── Infrastructure ────────────────────────────────────────────────────────────
const db = new TestFSDatabase();
const userRepo = new TestUserRepository(db);
const seniorRepo = new TestSeniorRepository(db);
// ── Services ──────────────────────────────────────────────────────────────────
const jwtSessionService = new JWTSessionService(userRepo, process.env["JWT_SECRET"] ?? "change-me-in-production");
const userService = new UserService(userRepo);
const seniorManagementService = new SeniorManagementService(userRepo, seniorRepo);
const authService = new AuthService(userService, jwtSessionService);
// ── HTTP ──────────────────────────────────────────────────────────────────────
// jwtSessionService is passed to Router — it resolves the bearer token into a
// Session entity before every handler call, no extra wiring needed per endpoint
const router = new Router(jwtSessionService);
const registry = new EndpointRegistry(router);
registry
    // Auth
    .register(login, [authService])
    .register(register, [authService])
    .register(logout, [authService])
    .register(refreshToken, [jwtSessionService])
    .register(getCurrentSession, []) // no service — session entity comes from Router
    // Users
    .register(updateUser, [userService]).register(me, [userService])
    // Seniors
    .register(addSenior, [seniorManagementService])
    .register(getAllSeniors, [seniorManagementService])
    .register(getSeniorById, [seniorManagementService])
    .register(deleteSenior, [seniorManagementService]);
serveBun(router, { port: 3000 });
