# mira-website

![Angular](https://img.shields.io/badge/Angular-22-red?logo=angular)
![pnpm](https://img.shields.io/badge/pnpm-11.9.0-orange?logo=pnpm)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue?logo=typescript)
![Vitest](https://img.shields.io/badge/Vitest-4.1.9-green?logo=vitest)
![Playwright](https://img.shields.io/badge/Playwright-1.61.1-teal?logo=playwright)

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

Once the server is running, open your browser and navigate to `http://localhost:5000/`. The application will automatically reload whenever you modify any of the source files.

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
Use `infra/caddy-s-test.Caddyfile` as a starting point for the server side.

Required repository secrets for deployment:

- `CODECOV_TOKEN`
- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY`
- `DEPLOY_PATH` (optional, default: `/var/wwww/tilt-us`)
- Optional: `DEPLOY_PORT` (defaults to `22`) and `DEPLOY_POST_DEPLOY_COMMAND` (for Caddy/service reload)
