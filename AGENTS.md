# Repository Guidelines

## How to apply this file

This file records repository-specific constraints and non-obvious capabilities that change implementation decisions. It is not an architecture inventory.

### Instruction precedence

System, developer, and direct user instructions remain higher priority. This file takes priority over reusable skills, plugin workflows, generic agent conventions, and generated plans.

When a lower-priority workflow conflicts with this file, follow this file and tell the user which step was skipped and why. A skill does not grant additional permission or override repository architecture.

### Factual authority

1. Current code, `package.json`, and configuration files define current behavior.
2. Relevant `.github/plans/` records intended behavior and production constraints but may describe an earlier phase.
3. `README.md` is product-facing, not an implementation specification.

This factual order does not replace instruction precedence. When code differs from a higher-priority requirement, treat the difference as an implementation gap. Update an affected plan or document when the completed change would otherwise leave one of its claims incorrect.

### Rule scope

- Workflow, authorization, worktree safety, and secret handling apply to every task.
- Before changing code or behavior, complete the investigation gate. For documentation-only work, read each target document in full and verify changed claims against their source.
- Read and apply a subsystem section when the task inspects, changes, or verifies that subsystem, or changes a shared dependency or lifecycle owner that can affect it. Ignore other subsystem sections.
- Apply code conventions only to edited code. Apply verification only to affected files, behavior, and runtime modes.

The project is a Next.js 15 / React 19 application written in strict TypeScript. User-facing text is primarily Simplified Chinese. Preserve established game terminology and nearby wording instead of translating labels independently. The `@/` alias resolves to `app/`.

## Workflow and authorization

- Repository design notes, specifications, and implementation plans use the relevant feature directory in `.github/plans/`, not a skill-owned documentation tree. Match the neighboring document type, language, filename pattern, and metadata. Plans use a YAML metadata block and `.plan.md` where the neighboring plans do; reference or report documents may use the directory's established `.md` format.
- Update an existing plan when it already owns the topic. Create a new durable artifact only when the user requests one or no existing document can record the durable requirements or decisions without conflating topics; a workflow requirement alone is insufficient.
- Do not stage, commit, amend, push, create or switch branches or worktrees, open pull requests, or otherwise mutate Git history or remote state unless the user explicitly requests that operation. Approval to investigate, design, implement, verify, or finish a change is not commit authorization.
- Preserve all maintainer-owned staged, unstaged, and untracked changes. Repository-wide formatting, cleanup, generated files, and unrelated rewrites require separate authorization.
- Subagents do not require separate user approval. Use them at the agent's discretion when independent tasks have a real parallelism or independent-review benefit that outweighs coordination cost. Give each subagent bounded scope, avoid concurrent edits to the same files, and independently verify its output before relying on it.
- When a task needs a real browser and no reusable browser session is available, use the Playwright skill to launch and control one. A missing pre-existing session is not a blocker; report a limitation only if browser automation cannot start or the task specifically requires unavailable user session state.
- When a task or verification session ends, close agent-started browser or Playwright sessions and development servers, and remove agent-created temporary scripts, fixtures, screenshots, traces, and generated verification directories. Keep them when the user asks for them, the task is still active, or they are intentional deliverables.

## Pre-change investigation gate

Before changing code or behavior, all of the following must be true:

1. The staged, unstaged, and untracked worktree state is known, and maintainer-owned changes are preserved.
2. Read `package.json`, complete target files, and relevant neighboring code, configuration, plans, alternate runtime implementations, environment reads, stores, routes, and existing utilities.
3. Trace every direct and indirect caller of a changed shared contract. Identify each applicable source of truth, persistence or transaction boundary, cross-tab path, offline replacement, and UI lifecycle owner.
4. Establish applicable validation commands, relevant baseline warnings, and how the affected behavior can be exercised.
5. Select the smallest design that satisfies the requirement and reuses existing capabilities.

Do not substitute assumptions for facts that can be established through safe read-only investigation. Any remaining uncertainty that could materially affect behavior, data, deployment, or user experience must be stated to the user and resolved before implementation.

## Subsystem constraints

### Runtime modes

One source tree produces several applications:

- `pnpm dev` uses Turbopack.
- Without `SELF_HOSTED` or `VERCEL`, `next.config.ts` selects static export; the supported packaged static artifact is produced by `pnpm build:offline`.
- `SELF_HOSTED=true` enables database-backed account, sync, administration, announcement, and site-state features after their feature-status checks pass. `pnpm build` atomically publishes a standalone release under ignored `.deploy/`; `pnpm start` launches that validated release.
- `pnpm build:offline` owns `OFFLINE`, substitutes offline modules, removes server-only surfaces, and creates the Windows zip. Account runtime is disabled in offline and Vercel modes.

Files named `*.offline.ts` or `*.offline.tsx` are intentional mode replacements. If an ordinary module and its offline counterpart expose the same API, keep them compatible.

Production service-worker files under `public/` are generated and ignored. Edit their templates or generator under `scripts/`; build changes that affect them include cache and update behavior in verification.

For representative local self-hosted browser verification, configure a local `BASE_URL`, `SELF_HOSTED=true`, and a valid `APP_SECRET` through an uncommitted root environment file or equivalent process environment. The launcher reads root environment files and validates the published release and persistent paths; use `pnpm start`, not the generated standalone server directly.

### SSR hydration and global clients

The root layout reads account state on the server and passes it through dedicated hydrators in `app/providers.tsx`. Preserve the post-hydration account refresh, which detects changes after SSR.

`app/providers.tsx` owns global client lifecycles. Add global watchers to that lifecycle or the existing feature-client entry point rather than a remounting page.

### Local recommendation bridge

The V1 recommendation bridge under `app/lib/recommendations/bridge/` connects an authenticated launch tab to the game Mod's local WSS server. Recommendations stay local and use the production recommendation utilities. It has no site API, visible UI, durable state, or cross-tab handoff; ordinary, static-export, and offline tabs do not connect.

`instrumentation-client.ts` synchronously imports `launchDescriptor.ts` so its endpoint and pairing secret are captured and removed before URL canonicalization, hydration, analytics, and account initialization. Keep the descriptor out of durable/shared storage and logs. Same-origin full-page account transitions use the existing continuation helper; third-party SSO redirects do not carry it.

`startRecommendationBridgeClient()` remains in the global account feature-client lifecycle, which jointly owns connection generation, scheduling, cancellation, reconnects, and the account gate. The offline feature client's bridge-specific behavior is to discard the descriptor without starting the bridge.

Keep V1 parsing, validation, adaptation, and serialization under `bridge/v1/`; add future protocol versions alongside it. Launch descriptors accept only WSS endpoints with an explicit port; do not add an environment-based WS fallback.

### Existing UI and window coordination

Use the wrappers in `app/design/ui/components` and the global overlay coordinator in `app/lib/overlayCoordinator`. The coordinator owns global overlay scheduling, stacking, shortcuts, backdrop, and inert behavior; `app/components/overlayCoordinatorHost.tsx` prepares blocking state.

Prefer a project wrapper when one exists; otherwise follow neighboring HeroUI usage. Register global overlays in `OVERLAY_DEFINITION_MAP` and use coordinator ownership APIs. Keep `#modal-portal-container` inside `<main>` in `app/layout.tsx`.

Use `useReducedMotion` and `useMotionProps` from `app/design/ui/hooks` for motion accessibility.

Forced-password and unresolved-sync-conflict states are blocking overlays. Their underlying account state is coordinated across tabs. Automatic background work must not open or flash a blocker, and must not make another tab inert without presenting the corresponding panel.

Deprecated `onClick` warnings are currently retained. Do not change those handlers solely to remove warnings; preserve pointer and keyboard semantics when touching one.

### Unified site status and announcements

`SiteStatusProvider` owns the self-hosted polling loop for `/api/v1/site/status`, including optional visitor count, maintenance state, aborts, and `Retry-After`. Extend that response and provider rather than adding another polling source.

Server announcements retain their audience, dismissal, scheduling, priority, and authentication semantics when runtime notices are added to the carousel.

### Existing API infrastructure

Use `fetchServiceApi` or account API helpers when their response envelope applies. Account API routes explicitly compose applicable no-store, feature-status, same-origin/CSRF, cookie, authentication, and rate-limit helpers; inspect neighboring routes because these protections are not automatic.

### State, persistence, and cross-tab primitives

Client state uses `@davstack/store`: use `.get()`/`.set()` outside React and `.use()` inside React. A field is durable only when included by the installed persistence middleware, and broadcast only when watched by sync middleware; `persistence` and `shared` names alone confer neither behavior. Do not create parallel authoritative React state for store-owned data.

Before adding persistence, broadcast, locking, retry, or account-sync coordination, inspect and reuse the existing store middleware, `withCrossTabLock`, and account client primitives when they satisfy the required semantics.

Cross-tab behavior must work while several tabs remain visible; visibility changes alone are not a coordination mechanism.

### Sync merge and migration policy

Each account sync namespace has a serializer under `app/lib/account/sync/serializers` that owns client defaults, snapshots, validation, migration, serialization, and merge policy. Server request and backup validation remain aligned in `app/lib/account/sync/validation.ts`. `merged !== null` does not override `requiresConfirmation`.

Automatic conflict resolution is allowed only when the shared merge predicate permits it. A failed or stale attempt retains the evidence needed for manual resolution.

A namespace or schema-version change must preserve existing local, queued, conflicted, imported, and server data, plus isolation of unsupported future schemas. Update the serializer, registration, server/client validation, capacity accounting, and user-facing labels together. Do not delete unrecognized data.

### Domain data and queries

Raw game records and types come from `app/data/index.ts`; processed domain singletons and reusable query logic come from `app/utils/`. Use singleton APIs for application queries because they include derived data absent from raw records. Recommendation adapters call `suggestMeals` and existing evaluation helpers instead of reimplementing their rules.

### Database and deployment behavior

Server operations that validate state and update related rows use a Kysely transaction. Migrations support existing and fresh databases plus overlapping old/new processes during reloads; preserve a column until its old shape can be identified and safely transformed.

Self-hosted `pnpm build` attempts to publish maintenance state through the configured SQLite database and atomically publishes a validated release under `.deploy/`. When verifying maintenance behavior, the build and verification runtime use the same writable development-only SQLite path. `pnpm start` launches the published release through `scripts/startSelfHosted.mjs`.

SQLite, uploads, backups, and environment files must use stable paths outside `.deploy/releases/`, shared by old and new processes. Defaults are project-root `sqlite.db` and `upload/`, with backups under `<UPLOAD_DIR>/backups/`; explicit persistence paths may be absolute locations elsewhere. This single-host SQLite design requires reliable local locking semantics.

### Browser compatibility

`package.json#browserslist` is deliberate. Treat `eslint.config.mjs`, its declared polyfills, Next.js support, and enabled preference rules together as the code-level compatibility authority; add a workaround only for a demonstrated gap.

Use `scripts/babelTransformFile.ts` for emitted-syntax transformations and the existing client instrumentation or polyfill layers for runtime APIs. Source-level compatibility must cover Turbopack as well as production builds; a Webpack-only mechanism is insufficient.

## Code conventions

Apply these conventions to edited code while preserving established public contracts and neighboring style.

### TypeScript and naming

- Object contracts normally use `I`-prefixed interfaces, such as `IAccountUserProfile` and `IProps`. Unions and derived aliases normally use `T`-prefixed types, such as `TSyncNamespace`. Preserve established generated, database, and public-boundary exceptions.
- Components and classes use PascalCase. Functions, variables, and store instances use camelCase; stores use `<domain>Store`. Follow neighboring file and directory naming.
- Exported domain constants and constants with operational units normally use `UPPER_SNAKE_CASE`. Include units in operational constants and measured values, such as `RETRY_DELAYS_MS` and `candidateBytes`.
- Boolean values and predicates normally begin with `is`, `has`, `can`, or `should`; established validation helpers may use `check*`. Hooks use `use*`, factories `create*`, storage readers `read*`, and persistence mutations an explicit verb such as `write*`, `replace*`, `remove*`, or `clear*`.
- Collections use plural nouns or a `Map`/`Set` suffix. Refs end in `Ref`, promises in `Promise`, and identifiers in `Id`. Component callback props begin with `on`; local event adapters normally begin with `handle`.
- Acronyms follow ordinary camelCase boundaries, such as `userId`, `cdnUrl`, and `webauthnModule`.
- Prefer literal unions and `as const satisfies Record<...>` over enums or widened objects.
- Preserve exact optional-property semantics: missing, `undefined`, `null`, empty values, and domain defaults are not interchangeable. Parse external data as `unknown`, validate it, and avoid `any`, broad assertions, and non-null assertions unless a proven invariant cannot be expressed more safely.

### Import grouping

Blank lines define semantic import groups. Follow the neighboring order: React and general runtime libraries, Next.js and project hooks, raw UI/icon packages, project design components, feature modules, shared data/services/utilities, then side-effect styles. Preserve setup-dependent groups. ESLint does not require global declaration sorting.

Preserve intentional semantic groups and do not reorder untouched imports.

## Configuration and secrets

Use existing configuration and dependencies by default. If a new environment variable or dependency is materially required but not already implied by the user's request, obtain maintainer approval.

Declare application environment variables in `app/types/environment.d.ts`; keep declarations, validation/defaults, and documentation aligned. Every value in `next.config.ts#env` is client-visible, so server secrets never belong there.

`APP_SECRET` requires at least 32 UTF-8 bytes. Explicit `SQLITE_DATABASE_PATH` and `UPLOAD_DIR` values must be absolute. `TRUST_PROXY` is valid only behind a proxy that overwrites forwarded headers, and production account cookies require HTTPS unless the explicitly unsafe `ALLOW_INSECURE_COOKIES` override is enabled. `SKIP_LINT` is a production-only build escape hatch; offline builds manage their own skip mode.

Do not expose or commit local environment files, persistent databases/uploads, authentication material, backups, or user payloads. Log stable redacted codes through `getLogSafeErrorCode` rather than payload-bearing errors.

## Change and verification requirements

A valid patch accounts for all affected callers of changed shared contracts and verifies the behavior it changes.

There is no automated test suite or repository test script. Do not invent test or coverage claims. Verify behavior with deterministic checks or direct exercise of affected paths; static checks alone do not establish runtime behavior.

The relevant static checks are:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm stylelint                         # SCSS changes
pnpm exec prettier --check <files>    # focused formatting/docs
git diff --check
```

`pnpm format` writes repository-wide changes and is not a check. Distinguish baseline warnings from newly introduced ones.

For runtime-affecting code or configuration, exercise every affected area below. If an applicable scenario is unavailable, report it as unverified.

- UI behavior: inspect affected interactions, console, and network in a real browser. Cover keyboard input, relevant breakpoints, reduced motion, and themes when the change can affect them.
- Account behavior: when changed code participates in the account lifecycle, verify login, logout, another simultaneously visible tab, and each applicable forced-password, expired-session, disabled-account, or deleted-account path.
- Sync behavior: when changed code affects a synced store, serializer, validation, persistence, broadcast, locking, queue, or conflict semantics, verify local edit, upload, remote refresh, manual and automatic conflicts, failure/retry, page refresh, and simultaneously visible tabs.
- Database transaction changes: exercise the affected success, validation-failure, and rollback paths.
- Schema/migration changes: use an existing old database and a fresh database, and cover interruption plus old/new process overlap.
- Build or offline behavior: run the affected build mode with development-only persistent paths. The SQLite path must be available during self-hosted build to exercise maintenance-state publication; the launcher separately validates SQLite and upload paths.
- Recommendation bridge: exercise each affected protocol, scheduler, cancellation, generation-isolation, and recommendation-equivalence aspect. The reference Mod covers WS flows; retained fixtures cover parsing and request/response boundaries. Release acceptance separately covers trusted WSS/TLS, Origin, loopback/LNA, CSP, and affected account, ownership, reconnect, and privacy paths.
- Self-hosted deployment: exercise affected publication, rollback, locking, launcher, persistent-path, and old/new-process behavior.
- Environment changes: keep declarations, validation, defaults, exposure, and documentation aligned; exercise each affected runtime/build mode.
- Documentation-only changes: verify names, paths, commands, and behavioral claims against their sources; run focused Prettier and `git diff --check`.

When the user requests a commit, use Conventional Commits. A handoff states what changed, checks actually run, and any material compatibility impact, warning, or unverified area.
