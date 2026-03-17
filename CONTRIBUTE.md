# Contribution Guide

To maintain a smooth and efficient development process, please follow these guidelines.

### Read This First

Before writing any code, read **[system_overview.md](./system_overview.md)** in full.
It explains the DDD architecture, how layers are structured, and exactly what you need to touch to add a feature. This is not optional — the overview is short and will save you from breaking things.

### UI API Endpoint Debugger

Open `./api-debug.html` locally to debug API endpoints and test your changes.

### What You Should Work On

When contributing a feature, your work will almost always fall into these three areas:

1. **Entity** — add or extend a domain model and its DTO under `src/entity/`
2. **Service** — add business logic to an existing service, or create a new one under `src/services/`
3. **Endpoint** — add a new endpoint file under `src/endpoint/` and register it in `src/index.ts`

That's it. These are the only files you should need to create or modify for a typical feature.

### Try not to change the Core Controller Layer

- `src/http/HttpContext.ts`
- `src/http/Router.ts`
- `src/http/EndpointRegistry.ts`
- `src/http/BunAdapter.ts`

These form the foundation every endpoint depends on. Changes here affect the entire system. If you think something in the core needs to change, raise it in your PR description and flag it for review instead of changing it directly.

### Adding an Endpoint (Quick Reference)

1. Create `src/endpoint/<domain>/<actionName>.ts` — export a single `Endpoint<[YourService]>` constant
2. Import it in `src/index.ts` and chain `.register(yourEndpoint, [yourService])`

See **Section 6** of `system_overview.md` for a full step-by-step example with code.

### Workflow

1. **No Direct Commits** — never commit directly to `main` or `develop`
2. **Open a Pull Request** — create a new branch for your feature and open a PR for review
3. **One Feature Per PR** — keep PRs focused and small so they're easy to review
4. **Don't Drift** — try not to edit files outside the scope of your feature

### Commit Standards

We use **Husky** and **Commitlint** to enforce commit quality. Follow the Conventional Commits format:

- `feat:` for new features
- `fix:` for bug fixes
- `chore:` for maintenance tasks

Happy coding! 🌿
