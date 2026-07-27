# mira-website

![Angular](https://img.shields.io/badge/Angular-22-red?logo=angular)
![pnpm](https://img.shields.io/badge/pnpm-11.5.0-orange?logo=pnpm)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue?logo=typescript)
![Vitest](https://img.shields.io/badge/Vitest-4.1.9-green?logo=vitest)
![Playwright](https://img.shields.io/badge/Playwright-1.61.1-teal?logo=playwright)

## Architecture

The frontend follows a **hexagonal architecture** (Ports & Adapters), applied
*feature-first*: each feature is a vertical slice that separates a pure domain
core from application services and from the adapters that reach the outside
world.

![Hexagonal architecture of the Angular frontend](Docs/architecture-frontend.svg)

| Ring | Role | In this codebase |
|------|------|------------------|
| **Domain** (core) | Framework-free models, value objects and **port** interfaces | `<feature>/domain/` — e.g. `AuthUser`, `Os`/`DownloadTarget`, `LegalDocument`, pure `os-detection` logic |
| **Application** (use cases) | Services that orchestrate the domain and depend **only on ports** | `<feature>/application/` — e.g. `AuthService`, `DownloadService`, `ClientSettingsService` |
| **Adapters** | Inbound (driving) and outbound (driven) | `<feature>/adapters/ui/` components & the router (inbound); `.../gateway`, `.../identity` HTTP/SDK/browser adapters (outbound) |

**Dependency inversion happens at the ports.** An application service never
imports the generated SDK or `HttpClient` directly — it depends on an interface
plus an Angular `InjectionToken`, and an outbound adapter supplies the concrete
implementation. This is the pattern the settings feature already established with
`CLIENT_SETTINGS_API`.

| Feature | Outbound port | Adapter implementation |
|---------|---------------|------------------------|
| `auth` | `IdentityProviderPort` · `TokenStoragePort` · `AuthApiPort` | Keycloak / token-storage / SDK adapters |
| `download` | `VersionGatewayPort` · `DownloadGatewayPort` | HTTP version + browser download adapters |
| `legal` | `LegalDocumentGatewayPort` | HTTP documents adapter (bundled dummy fallback) |
| `settings` | `ClientSettingsApi` | `/api/me/settings` SDK adapter |

The shared HTTP infrastructure (`api-client.ts`, generated `src/api/**`) and the
composition root (`app.config.ts`, `main.ts`) wire the adapters to their ports at
bootstrap. The bundled desktop client (`webui`) and the `mira-service` backend
sit *outside* the hexagon — the frontend only talks to them through its adapters.

> The backend service (`mira-service`) has its own, separate hexagonal diagram.

### Project Structure

Each feature is a vertical slice. Features that carry logic (`auth`, `download`,
`legal`, `settings`) split into `domain/` · `application/` · `adapters/`;
purely presentational features (`home`, `layout`, `placeholder`) are inbound-
adapter components and stay flat.

```
src/app/
  auth/                     # identity & session (fully inverted)
    domain/                 #   models.ts · ports.ts (IdentityProvider, TokenStorage, AuthApi)
    application/            #   auth.service.ts
    adapters/
      ui/                   #   auth-page
      identity/             #   keycloak · storage · config + the 3 port adapters
  download/
    domain/                 #   models.ts · os-detection.ts (pure) · ports.ts
    application/            #   download.service.ts
    adapters/
      ui/                   #   download-button · os-modal
      gateway/              #   http-version · browser-download
  legal/
    domain/ application/    #   models.ts · ports.ts · legal.service.ts (+ dummy fallback)
    adapters/ui|gateway/    #   legal-page · http-legal
  settings/
    domain/ application/    #   ports.ts · client-settings · theme · wallpaper services
    adapters/ui|gateway/    #   user-settings · client-settings-api
  home/ jobs/ layout/ placeholder/   # inbound-adapter pages (jobs has a small domain/)
  shared/                   # shared kernel: reveal, date-picker, event-carousel, community
  api-client.ts             # shared outbound HTTP infrastructure (interceptors, token)
  app.config.ts · main.ts   # composition root — wires adapters to ports
```

## Branch Strategy

| Branch         | Purpose                                                                                    |
|----------------|--------------------------------------------------------------------------------------------|
| `master`       | Production branch — stable checkpoints only (completed features, releases)                 |
| `development`  | Integration branch — finished feature branches get merged here                             |
| `feature/...`  | Feature branches — all development happens here, always branch off `development`           |
| `bugfix/...`   | Bugfix branches — fixes are developed here, always branch off `development`                |
| `refactor/...` | Refactor branches — refactoring happens here, always branch off `development`              |

### Normal Workflow

```bash
# 1. Create a new branch off development (include ticket number if available)
git checkout development
git checkout -b feature/my-feature-123

# 2. Develop & commit
git add .
git commit -m "feat: my feature"

# 3. Merge feature branch into development (when feature is done)
git checkout development
git merge feature/my-feature-123 --no-ff
git push origin development

# 4. Clean up the feature branch
git branch -d feature/my-feature-123

# 5. Only when a major milestone is reached → merge development into master // only Lead Dev
git checkout master
git merge development --no-ff -m "release: Checkpoint vX.X"
git push origin master
```

**Rule:** Never commit directly to `master` or `development`. All work starts on a dedicated branch branched off `development`.

### Accidentally pushed to master?

Run the backmerge script to merge `master` back into `development`:

```bash
bash scripts/backmerge-master-to-development.sh
```

## Setup (required for every developer)

After cloning the repo, run this once to activate the Git hooks:

```bash
git config core.hooksPath .githooks
```

This prevents accidental direct pushes to `master`.

## Development Server

To start a local development server, run:

```bash
pnpm start
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

For local API backends, prefer this:

```bash
pnpm run start:local
```

`start:local` refreshes the generated OpenAPI client against local services on `8080/8081/...` and starts `ng serve`.

For remote/dev API mode, use:

```bash
pnpm run start:dev
```

## Code Scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Generating API Client

To refresh the generated OpenAPI client from the shared API definitions, run:

```bash
pnpm run generate:api
```

To use local OpenAPI endpoints (e.g. during backend development), run:

```bash
pnpm run generate:local:api
```

Generated clients are written to `src/api`.

## Running Unit Tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
pnpm run test
```

The CI pipeline runs `pnpm run test:ci` and enforces a minimum coverage threshold of **90%** (lines, branches, functions, statements) before deployment.

## Running End-to-End Tests

For end-to-end (e2e) testing, run:

```bash
pnpm run test:e2e
```

## Deployment

On `development` branch pushes, the CI workflow deploys the build output to `S-TEST` and publishes it to
`https://tilt-us.com` (served via Caddy on the server at the configured `DEPLOY_HOST`).
If `mira-caddy` runs in Docker (as in the `mira-service` stack), deployment and Caddy reload are done
inside that container so host-level systemd restart is **not** required.

Defaults are tuned for the existing `mira-service` stack:

- `DEPLOY_PATH` -> `/srv/mira/website`
- `DEPLOY_CADDY_CONTAINER` -> `mira-caddy`
- Caddyfile used in container: `/etc/caddy/Caddyfile`
- website root injected into host Caddy config: `<DEPLOY_PATH>/browser`
- Ensure `/srv/mira/website` is mounted/visible inside the `mira-caddy` container.

Required repository secrets for deployment:

- `CODECOV_TOKEN`
- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY`
- `DEPLOY_PATH` (optional, default: `/srv/mira/website`)
- Optional: `DEPLOY_PORT` (defaults to `22`) and `DEPLOY_POST_DEPLOY_COMMAND` (for fully custom post steps)
- Optional (for Dockerized Caddy):
  - `DEPLOY_CADDY_CONTAINER` (default: `mira-caddy`)
  - `CADDY_CONTAINER_CONFIG_PATH` (default: `/etc/caddy/Caddyfile`)
  - `CADDY_CONFIG_PATH` (legacy alias for `CADDY_CONTAINER_CONFIG_PATH`)
  - `CADDY_HOST_CONFIG_PATH` (optional if config mount can be discovered from the container)
  - `CADDY_SITE_ROOT` (optional, default: `<DEPLOY_PATH>/browser`)
  - `CADDY_CONTAINER_USE_SUDO` (`true`/`false`, default `false`)
  - `DEPLOY_RSYNC_WITH_SUDO` (`true`/`false`, default `false`, when true runs rsync via `sudo rsync` on target)

If `DEPLOY_POST_DEPLOY_COMMAND` is not set, the workflow:

1. syncs `dist/mira-website/` to `${DEPLOY_PATH}`
2. auto-detects or uses `CADDY_HOST_CONFIG_PATH`
3. replaces any existing managed marker block and any existing `tilt-us.com` / `www.tilt-us.com` server blocks in that file, then appends a single managed block,
4. reloads Caddy via `docker exec <DEPLOY_CADDY_CONTAINER> caddy reload --config <CADDY_CONTAINER_CONFIG_PATH>`.
