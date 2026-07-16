# Repository Guidelines

## Document boundary

This file is the repository-specific handoff for capabilities and requirements that are easy to infer incorrectly. It is not an architecture inventory.

- `README.md` is product-facing.
- Current code, `package.json`, and configuration files are the implementation source of truth.
- `.github/plans/` records design intent and production constraints, but may describe an earlier phase; current code decides actual behavior.
- The requirements below define mandatory boundaries and existing capabilities that must not be duplicated.

The project is a Next.js 15 / React 19 application written in strict TypeScript. User-facing text is primarily Simplified Chinese. Preserve established game terminology and nearby wording instead of translating labels independently. The `@/` alias resolves to `app/`.

## Required repository understanding

A change is ready for implementation only when all of the following are true:

1. The staged, unstaged, and untracked worktree state is known, and maintainer-owned changes are preserved.
2. `package.json`, relevant configuration, complete target files, neighboring modules, alternate implementations, call sites, stores, API routes, environment reads, and existing utilities have been accounted for.
3. The source of truth, persistence boundary, server transaction, cross-tab path, offline replacement, and UI coordinator applicable to the task are identified.
4. Relevant `.github/plans/` intent is reconciled with current function names, schema versions, and completed code behavior.
5. Available validation commands and known warnings are established. The repository has no test suite or test scripts; invented test commands or coverage claims are invalid.
6. The selected design is the smallest change that reuses existing capabilities instead of creating a parallel mechanism.

Any remaining assumption that materially affects behavior, data, deployment, or user experience must be explicit and must follow exhaustive safe read-only investigation.

## Non-obvious platform capabilities

### Runtime modes

One source tree produces several different applications:

- `pnpm dev` uses Turbopack. Pages not using server/account features need no environment variables.
- `SELF_HOSTED=true` selects the self-hosted runtime boundary. Database-backed account, sync, administration, announcement, and site-state features become available only after their feature-status checks pass, including a valid `APP_SECRET` and a writable SQLite location. `pnpm build` publishes an atomic standalone release under the ignored `.deploy/` directory; `pnpm start` validates `.deploy/current.json` and starts that published release.
- Without `SELF_HOSTED` or `VERCEL`, `next.config.ts` selects static export, but the supported packaged static artifact is `pnpm build:offline`.
- `pnpm build:offline` owns `OFFLINE`, temporarily removes server/admin surfaces, uses offline replacement modules, and creates the Windows zip. Do not set `OFFLINE` manually.
- Account runtime is intentionally disabled on Vercel. Vercel variables are platform-owned.

Files named `*.offline.ts` or `*.offline.tsx` are intentional mode replacements. If an ordinary module and its offline counterpart expose the same API, keep them compatible.

Production service-worker files under `public/` are generated and ignored. Their sources of truth are `scripts/registerServiceWorker-template.js`, `scripts/serviceWorker-template.js`, and `scripts/generateServiceWorker.ts`; generated output is never edited directly. Registration is production-only and versioned by the current commit SHA. Build-related acceptance therefore includes cache and update behavior.

Complete local self-hosted behavior requires an uncommitted `.env.local` containing at least:

```dotenv
BASE_URL=http://localhost:3000
SELF_HOSTED=true
APP_SECRET=<output of openssl rand -base64 32>
```

`APP_SECRET` must contain at least 32 bytes. An explicit `SQLITE_DATABASE_PATH` must be absolute; otherwise the default is `<cwd>/sqlite.db`.

The self-hosted launcher loads environment files from the project root, not the release directory. It validates the published build ID plus the configured SQLite and upload paths before starting. Do not run `.next/standalone/server.js` directly, edit `.deploy/`, or point persistent data inside a release directory.

### SSR hydration and global clients

The root layout already reads account state on the server and passes it through dedicated hydrators in `app/providers.tsx`. Hydration is followed by a deliberate account refresh to detect state that changed after SSR. An unrelated client-only `/me` fetch is not an equivalent replacement, and the post-hydration refresh is not inherently redundant.

`app/providers.tsx` is the central lifecycle owner for account clients, the site-status provider, overlay host, tutorials, and global store projections. Global watchers belong there or in the existing feature-client entry point, never in an individual page that may remount.

### Local recommendation bridge

The V1 recommendation bridge under `app/lib/recommendations/bridge/` is an unshipped local integration. The game Mod is the local WSS server; only the logged-in tab opened with a valid `game-bridge` fragment is the browser client. Recommendations run locally through the existing recommendation utilities and never pass through a site API. The bridge adds no visible UI, durable state, cross-tab handoff, or server recommendation route. Ordinary tabs, static exports, and offline builds do not connect.

The launch descriptor contains a dynamic endpoint and pairing secret. `instrumentation-client.ts` must synchronously import `launchDescriptor.ts` so the fragment is captured and removed before Next.js establishes its canonical URL, hydration, analytics, or account initialization. Do not move this work into a React effect, Store, storage, Service Worker, URL query, or log. Same-origin full-page account transitions use the existing continuation helper; third-party SSO redirects never carry the descriptor.

`startRecommendationBridgeClient()` belongs to the existing global account feature-client lifecycle. Its connection generation, task scheduler, cancellation, reconnect budget, and account gate are one coordinated runtime; a component-scoped client, second scheduler, or bridge-specific broadcast duplicates that ownership. The offline feature-client replacement only clears and discards the descriptor.

V1 parsing, validation, adaptation, and serialization remain isolated under `app/lib/recommendations/bridge/v1/`. A future protocol version is added alongside V1 rather than silently reinterpreting it. Production launch descriptors accept only WSS endpoints with an explicit port; do not add a WS development fallback or environment bypass.

### Existing UI and window coordination

The project already has UI wrappers in `app/design/ui/components` and a global overlay/window coordinator in `app/lib/overlayCoordinator`. It handles task/passive/blocking priorities, queued activation, parent-child stacks, transition delays, shortcuts, backdrop policy, and global inert behavior. `app/components/overlayCoordinatorHost.tsx` provides blocking-state preparation. A second scheduler, independent React root, or hand-coded portal/modal duplicates existing infrastructure.

Application UI uses the project `Modal`, Popover, Button, and other wrappers rather than raw HeroUI components. Global overlays are registered in `OVERLAY_DEFINITION_MAP` and use the coordinator ownership APIs. `#modal-portal-container` remains inside `<main>` in `app/layout.tsx`; its location is intentional.

Motion accessibility is centralized through `useReducedMotion` and `useMotionProps` from `app/design/ui/hooks`; additional media-query listeners or independent motion defaults are duplicate infrastructure.

Forced-password and unresolved-sync-conflict states are blocking overlays. Their underlying account state is coordinated across tabs. Automatic background work must not open or flash a blocker, and must not make another tab inert without presenting the corresponding panel.

The existing deprecated `onClick` usages are intentional and are not replaced merely to remove warnings. Any necessary modification preserves their pointer and keyboard semantics.

### Unified site status and announcements

`SiteStatusProvider` is the sole owner of the self-hosted polling loop for `/api/v1/site/status`. That single response combines optional Matomo visitor count with deployment-maintenance state, handles aborts and `Retry-After`, and exposes contexts consumed by the UI. A second visitor/maintenance endpoint, polling timer, or client notification source is duplicate infrastructure. Maintenance is promoted into the existing announcement presentation rather than replacing server-rendered announcements.

Ordinary announcements are selected on the server with audience, dismissal, schedule, priority, and authentication context, then hydrated into the client carousel. Runtime notices preserve server announcements, dismissal behavior, carousel timing, and priority ordering.

### Existing API infrastructure

Client service calls use `fetchServiceApi` or the account API helpers rather than raw `fetch` when their response envelope applies. They already handle the configured service origin, credentials, no-store defaults, JSON envelope validation, and `Retry-After` parsing. Account API routes explicitly compose the repository's no-store response, feature-status, same-origin/CSRF, cookie-security, authentication, and rate-limit helpers; these protections are not injected automatically. An endpoint that omits an applicable neighboring-route boundary is incomplete.

### State, persistence, and cross-tab primitives

Client state uses `@davstack/store`: `.get()`/`.set()` apply outside React and `.use()` applies inside React. `persistence` and `shared` are repository naming conventions, not automatic `@davstack/store` behavior. A field is durable only when its store installs the repository persistence middleware and includes it in `partialize`; it is broadcast only when the sync middleware includes its path in `watch`. Store construction, not branch naming, defines behavior. Parallel React state for store-owned data is invalid.

The repository already provides compressed store persistence, safe storage fallbacks, watched store broadcasting, and the general `withCrossTabLock` utility with native Web Locks and a storage fallback. The account client additionally provides account broadcasts and invalidation, uploader leases, operation leases, reset generations, base snapshots, dirty queues, collision evidence, and conflict-resolution journals. Reuse these mechanisms instead of adding a new localStorage key, BroadcastChannel, mutex, visibility-only workaround, or ad hoc retry loop.

Cross-tab correctness must work when several tabs remain visible side by side. A `visibilitychange` listener alone is never a complete coordination design.

### Sync merge and migration policy

Every account sync namespace has a client serializer under `app/lib/account/sync/serializers`. It owns defaults, local snapshot access, client snapshot validation, migration, serialization, and merge policy. Server request and backup payload validation is separately centralized in `app/lib/account/sync/validation.ts`; schema changes must keep both sides aligned. A merge result may contain a usable merged value while `requiresConfirmation` still requires the user to choose. Do not infer “safe to apply automatically” from `merged !== null`.

Automatic conflict resolution may remain internal only when the shared merge predicate explicitly permits it. A failed or stale automatic resolution retains the original local, cloud, merged, collision, and journal evidence and surfaces a manual conflict.

A namespace or schema-version change preserves old browser queues, base snapshots, conflict entries, imported backups, server records, and future-schema isolation. Its schema version range, serializer migration/validation, serializer registration, server/client payload validation, capacity accounting, and user-facing labels change together. Unrecognized data is never deleted merely because new code does not understand it.

### Domain data and queries

Canonical raw game records and domain types are exported from `app/data/index.ts`; processed singleton domain classes and reusable selection, recommendation, and lookup logic are exported from `app/utils/`. Application queries and protocol validation use instances such as `Recipe.getInstance()`, `Beverage.getInstance()`, and `Ingredient.getInstance()` through `.data`, `getNames()`, `getValuesByProp()`, or `getPropsByName()` instead of scanning raw lists. Instance data contains derived fields and tags, including price-based recipe tags, which raw records do not. `suggestMeals` and the established evaluation helpers remain the production recommendation and rating implementations; adapters do not recreate their rules.

### Database and deployment behavior

Server operations that validate state and update related rows use a Kysely transaction. Browser sequencing is not a server transaction. Migrations support existing production data, fresh databases, and overlapping old/new processes during PM2-style reloads. A column remains intact until the migration can positively identify and safely transform the old shape.

`pnpm build` in self-hosted mode writes site-maintenance state through the configured SQLite database, so the build process needs access to the same database directory. After a successful build it stages and atomically publishes a validated standalone release under `.deploy/`, preserving the previous release until the current pointer has been replaced. `pnpm start` is valid only after that publication and launches through `scripts/startSelfHosted.mjs`; build output inside `.next/standalone` is not the supported runtime entry point.

Self-hosted persistent data is SQLite in WAL mode plus `<UPLOAD_DIR>/backups/`; `UPLOAD_DIR` defaults to `<cwd>/upload` and, when explicitly configured, must be absolute. SQLite, uploads, and environment files stay at stable project-level paths shared by old and new processes during reloads, never inside `.deploy/releases/`. This remains a single-host design and does not support multi-host local SQLite or a network filesystem without reliable SQLite locking semantics.

### Browser compatibility

The browser targets in `package.json#browserslist` are deliberate and older than Next.js defaults. `eslint.config.mjs` is the code-level compatibility authority: `compat/compat`, its `settings.polyfills`, Next.js support, and the enabled preference rules are evaluated together. If code passes those rules, do not invent a fallback or suppress a preference rule based only on the browsers list. In particular, use `Object.hasOwn()` and `.at()` where the active ESLint rules prefer them.

`scripts/babelTransformFile.ts` transforms emitted syntax after builds; it does not add method or Web API polyfills. Client AbortController/fetch cancellation support is installed in `instrumentation-client.ts`, while `app/polyfills.tsx` contains early inline compatibility and storage checks. A compatibility workaround requires a concrete failure outside the capabilities already declared by Next.js and ESLint, and belongs in these existing layers. A Webpack-only alias does not cover the Turbopack development server.

## Mandatory code conventions

### TypeScript and naming

- Object contracts normally use interfaces with an `I` prefix: `IAccountUser`, `ISyncConflictItem`, `IProps`.
- Type aliases, unions, and derived types normally use a `T` prefix: `TSyncNamespace`, `TAccountResult`. Preserve established boundary exceptions such as generated/database shapes; do not rename unrelated public types merely to normalize them.
- React components and classes use PascalCase. Functions, variables, and store instances use camelCase; store instances use `<domain>Store`. For files and directories, follow the neighboring module because both camelCase and established hyphen/underscore domain names exist.
- Exported domain constants and constants with operational units normally use `UPPER_SNAKE_CASE`. Include units where relevant, such as `_MS`, `_BYTES`, `_PX`, or `_TTL`; do not mechanically rename local immutable bindings.
- Boolean values normally start with `is`, `has`, `can`, or `should`. Boolean predicates use `check*`; factories use `create*`; storage readers use `read*`; persistence mutations use explicit verbs such as `write*`, `replace*`, `remove*`, `clear*`, or `delete*`.
- Names expose value shape and lifecycle: collections use plural nouns or a `Map`/`Set` suffix, React refs end in `Ref`, promises end in `Promise`, identifiers end in `Id`, and measured values include units such as `Ms` or `Bytes`.
- React hooks start with `use`. Component callback props start with `on`; local adapters that implement event behavior normally start with `handle`.
- Acronyms follow ordinary camelCase boundaries, such as `userId`, `operationId`, `apiUrl`, and `webauthn`, rather than all-capital segments inside identifiers.
- Prefer literal unions and `as const satisfies Record<...>` over enums or widened objects.
- Preserve exact optional-property semantics. Missing, `undefined`, `null`, empty collections, and a domain default are not interchangeable.
- Parse external data as `unknown`, validate it, then narrow. Avoid `any`, broad assertions, and non-null assertions.

### Import grouping

Blank lines define semantic import groups. The stable application-code order, where a category exists, is:

1. React first, followed by general third-party behavior/runtime libraries, including motion libraries.
2. Next.js/runtime APIs and project hooks.
3. Raw third-party component and icon packages.
4. Project design-system components and design hooks from `@/design`.
5. Feature-local modules, page modules, and reusable application components.
6. Configuration, data, stores, services, shared types, utilities, and domain helpers.
7. Side-effect stylesheet imports last.

Special files may keep a nearby setup-dependent group, as `app/layout.tsx` does for Font Awesome configuration. The semantic groups are authoritative; global alphabetical sorting of import declarations is not required because ESLint sets `ignoreDeclarationSort: true` and `allowSeparatedGroups: true`.

Functional patches preserve intentional semantic groups and contain no unrelated formatting changes.

### Configuration and secrets

Existing configuration is the default. A new environment variable or dependency requires a concrete need and maintainer agreement.

Application environment variables are declared in `app/types/environment.d.ts`. An environment change includes its declaration, validation/default behavior, and corresponding documentation. `next.config.ts#env` contains only intentionally public values because every value there is compiled into client bundles.

Important exceptions and semantics:

- `BASE_URL`, `SELF_HOSTED`, `SERVICE_API_ORIGIN`, `SHORT_LINK_URL`, `CDN_URL`, `ICP_FILING`, and browser Matomo settings are currently client-visible.
- `APP_SECRET`, `ANALYTICS_TOKEN`, `CLEANUP_SECRET`, `DISPATCH_SECRET`, and admin credentials are server secrets.
- Matomo and visitor counts are maintainer-specific optional integration. With incomplete configuration, visitor count is `null`; the site otherwise works.
- In production, `SKIP_LINT` skips build-time ESLint and TypeScript checks only when its trimmed, case-insensitive value is exactly `true` or `1`; `false` does not skip them. Offline builds skip those checks through their owned mode. Do not set `SKIP_LINT` in normal development, CI, or releases.
- `TRUST_PROXY` is safe only behind a trusted proxy that overwrites forwarded host/protocol/client headers. Production account cookies require HTTPS unless the explicitly unsafe development override is enabled.
- `SQLITE_DATABASE_PATH` and `UPLOAD_DIR` are server-side persistence locations. Explicit values must be absolute; the defaults are `<cwd>/sqlite.db` and `<cwd>/upload`.

Never expose or commit `.env*.local`, SQLite files, `upload/`, cookies, credentials, tokens, backup contents, or user payloads. Log stable redacted error codes via `getLogSafeErrorCode` rather than raw payload-bearing errors.

## Change and verification requirements

A valid patch is scoped to the requested behavior, accounts for every call site of modified shared utilities, UI wrappers, stores, serializers, repositories, or build scripts, and contains no adjacent cleanup unless the requested change makes that code obsolete.

There is no automated test suite, repository test script, or unified `test` command. Behavioral verification is still mandatory. Deterministic code-level checks use a clearly named temporary directory inside the repository; all temporary scripts and fixtures are deleted after execution and never committed. Interaction and runtime claims require a real browser. Linting or type checking alone never supports a “tests passed” claim.

The relevant static checks are:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm stylelint                         # SCSS changes
pnpm exec prettier --check <files>    # focused formatting/docs
```

`pnpm format` writes changes across the repository and is not a read-only check. `pnpm lint` currently reports intentionally retained deprecated `onClick` warnings. Verification reports distinguish known warnings from warnings introduced by the change.

Behavioral acceptance criteria by affected area:

- UI: real browser, console and network inspection, keyboard behavior, responsive layouts, reduced motion, and light/dark themes when applicable.
- Account lifecycle: login/logout plus another tab; include forced-password, expired-session, disabled, or deleted-account paths when touched.
- Sync: local edit, upload, remote refresh, manual/automatic conflict paths, failure/retry, page refresh, and simultaneously visible tabs.
- Migration/database: an existing old database and a fresh database, transaction rollback, interruption, and old/new process overlap.
- Build/offline: `pnpm build` covers self-hosted build behavior; `pnpm build:offline` covers aliases, routes, generated public files, compatibility, and offline replacements. Self-hosted build verification uses a development database because the build writes maintenance state.
- Recommendation bridge: deterministic checks cover strict fragment and JSON parsing, V1 fixtures, availability semantics, cancellation, task fairness, generation isolation, and equivalence with the production recommendation utilities. Browser acceptance uses the retained reference Mod and covers account lifecycle, single-tab ownership, protocol replacement, reconnects, and privacy. WS-only local testing never satisfies the release gate; trusted WSS/TLS, Origin, IPv4/IPv6 loopback, LNA prompt/grant/deny behavior, and CSP are reported separately.
- Self-hosted deployment: acceptance covers first publication, atomic current-pointer replacement, failed-build rollback, concurrent build locking, stale artifact cleanup, launcher validation, shared persistent paths, and old/new process overlap. `.deploy/` is generated and ignored.
- Documentation/config: names and commands match their source; Prettier and `git diff --check` pass.

Commit messages follow Conventional Commits, for example `fix(sync): preserve remote state`. A handoff must state what changed, user/data compatibility, commands actually run, browser scenarios exercised, known warnings, and anything not verified.
