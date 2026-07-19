# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository structure

This is a monorepo (no root package.json/workspaces — each app is managed independently) with two apps:

- `app-api/` — NestJS 11 + TypeORM + PostgreSQL REST API
- `app-web/` — Next.js 16 (App Router) + React 19 + MUI + Tailwind v4 frontend

Run all commands from inside the respective app directory (`cd app-api` or `cd app-web`).

## app-api (NestJS backend)

### Commands
```bash
npm run start:dev          # watch mode, http://localhost:3001
npm run build               # nest build
npm run lint                 # eslint --fix
npm run format                # prettier --write src/**/*.ts test/**/*.ts
npm run test                  # jest unit tests
npm run test -- users.service # run a single test file/pattern
npm run test:watch
npm run test:cov
npm run test:e2e              # jest -c ./test/jest-e2e.json

# TypeORM migrations (uses src/database/data-source.ts)
npm run migration:generate -- src/database/migrations/<Name>
npm run migration:run
npm run migration:revert
```
Swagger docs are served at `/docs` when the app is running.

### Architecture
- Standard Nest module layout under `src/modules/<name>/`: `*.controller.ts`, `*.service.ts`, `*.module.ts`, `dto/`, `entities/`, plus `guards/`, `strategies/`, `interfaces/`, `decorators/` where relevant (see `modules/auth`).
- `src/config/configuration.ts` defines the typed `AppConfig` shape consumed via `ConfigService<AppConfig, true>` (`configService.get('database.host', { infer: true })`); `src/config/env.validation.ts` validates raw env vars with `class-validator` at boot (`ConfigModule.forRoot({ validate })`). When adding an env var, update both files.
- All entities extend `common/entities/base.entity.ts` (`BaseEntity`), which provides `id` (uuid), `createdAt`, `updatedAt`. `autoLoadEntities: true` is set in `app.module.ts`, so new entities are picked up automatically — no need to register them manually.
- DTOs use `class-validator`/`class-transformer` decorators and are also the source of Swagger schemas (`@ApiProperty`). Response DTOs follow a `static fromEntity(entity): ResponseDto` convention (see `users/dto/user-response.dto.ts`) to control what's exposed (e.g. `password` is `select: false` on the `User` entity and never returned).
- Auth: JWT-based (`@nestjs/jwt` + `passport-jwt`, `modules/auth/strategies/jwt.strategy.ts`), plus Google ID Token login (`google-auth-library`) verified server-side against `GOOGLE_CLIENT_ID`. Protect routes with `@UseGuards(JwtAuthGuard)` and read the authenticated user via the `@CurrentUser()` decorator.
- Pagination is a shared convention: query DTOs take `page`/`perPage` (defaults in `common/variables/pagination.ts`), services return `{ data, total, page, perPage }` via TypeORM `createQueryBuilder(...).skip().take().getManyAndCount()`, and controllers wrap that into a `Paginated<X>ResponseDto` with a computed `totalPages`.
- `main.ts` applies global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`, `helmet()`, CORS restricted to `cors.origin` from config, and a global `ThrottlerGuard` (100 req/60s, set in `app.module.ts`).
- User-facing error messages (validation errors, exceptions) are written in Portuguese (pt-BR) — keep new ones consistent with this.
- DB: PostgreSQL via TypeORM, UUID primary keys with the `pgcrypto` extension. `synchronize` must stay `false` outside local/dev scratch use — schema changes go through migrations (`src/database/migrations/`).

## app-web (Next.js frontend)

### Commands
```bash
npm run dev              # dotenv -e .env.develop -- next dev --turbopack, http://localhost:3000
npm run build             # next build (uses .env / production env)
npm run build:local        # format + lint + build against .env.develop + start:develop
npm run lint
npm run format
```
Note: there is no test runner configured in `app-web`.

### Architecture
- App Router with two route groups: `(public)/` (login page, unauthenticated) and `(authorized)/` (everything behind auth — home, `usuarios`, wrapped by `AuthorizedShell` with `Sidebar`/`Header`). Route paths are centralized in `shared/routes.ts` (`APP_ROUTES.public` / `APP_ROUTES.private`) — use these constants instead of hardcoding paths.
- `src/proxy.ts` is the Next.js middleware: it decodes the JWT cookie (`NEXT_PUBLIC_AUTH_TOKEN_KEY`), checks expiry, and redirects to the login route for any non-public path without a valid token. Public paths are derived from `APP_ROUTES.public`.
- Auth token is stored client-side as an encrypted cookie: `services/cryptoJs` encrypts/decrypts with `NEXT_PUBLIC_ENCRYPT_KEY`, `services/jsCookie` sets/removes the cookie, `services/jwt` decodes it. Session mutations live in `hooks/Auth` (`useLoginMutation`, `useGoogleLoginMutation`, `useMeQuery`, `useLogout`).
- Data fetching is TanStack Query wrapped in small generic hooks under `hooks/Queries` — `useGetEntityList`, `usePostEntity`, `usePutEntity`, `useDeleteEntity` — each taking a `url`, optional `filters`/payload types, and `invalidateQueryKeys` to invalidate related list queries on mutation success. New CRUD features should reuse these generics rather than writing bespoke `useQuery`/`useMutation` calls; see the `usuarios` feature (`app/(authorized)/usuarios/`) as the reference implementation (list + create/edit modal + delete confirmation).
- `services/api` exposes two axios factories: `ApiFactory(token)` (authenticated requests, reads token via `getAuthToken()`) and `ApiAuthFactory()` (unauthenticated, for login/register endpoints). Both point at `NEXT_PUBLIC_API_URL`.
- Per-feature Zustand stores live under `store/PageStore/<Feature>Store` (e.g. `useSelectedUserStore` for the currently-edited/deleted row) with a global theme store at `store/ThemeStore` and an accessibility (font size) store at `store/FontAccessibilityStore`.
- Forms use `react-hook-form` + `zod` schemas from `shared/formSchemas/`, wired through `@hookform/resolvers/zod`; schemas commonly export a base + a `*EditFormSchema` variant (e.g. optional/blank password on edit) plus default values and a resolver.
- Reusable UI primitives live under `shared/components/` (Buttons, Inputs — split into `DefaultInputs` for plain state and `FormInputs` for `react-hook-form`-registered fields, Modals, Containers, Texts) built on MUI (`@mui/material`) with `sx` styling plus shared style constants in `shared/constants/Styles/`. Prefer these over introducing new one-off styled components.
- Path alias `@/*` maps to `src/*` (see `tsconfig.json`).
- Env vars are typed/re-exported as constants in `shared/constants/EnvironmentVariables` (`NEXT_PUBLIC_*`) — import from there instead of touching `process.env` directly. `.env.develop` is used for local dev/build, `.env` for production builds.
- UI text and user-facing messages (toasts, labels, validation errors) are in Portuguese (pt-BR).
