# GitHub Actions — `mgm-calendar-frontend`

Three workflows ship in this repo:

| Workflow | Triggers | What it does |
|---|---|---|
| `ci.yml` | PRs · pushes to any branch except `main` / `staging` | `npm run typecheck` + `npm run build` + a `docker buildx build` smoke (no push). |
| `staging.yml` | Push to `staging` · manual *Run workflow* | Test gate → multi-arch (`linux/amd64`, `linux/arm64`) build → push to DockerHub with tag `staging`. |
| `production.yml` | Push to `main` · `v*` tags · manual | Test gate → multi-arch build → push to DockerHub with `latest`, `production`, semver, and sha tags. |

`main` and `staging` don't run `ci.yml` because their own workflows include the same test gate as a prerequisite job — no duplicate runs.

## One-time setup

In **Settings → Secrets and variables → Actions**:

| Kind | Name | Value |
|---|---|---|
| Repository secret | `DOCKERHUB_USERNAME` | DockerHub account name. Image will be pushed as `DOCKERHUB_USERNAME/mgm-calendar-frontend`. |
| Repository secret | `DOCKERHUB_TOKEN` | DockerHub access token (Account Settings → Security → New Access Token, Read & Write). |
| Repository variable | `STAGING_API_URL` | The backend URL the **staging** bundle should call, e.g. `https://api-staging.mgm-lab.id`. Baked into the JS bundle at build time. |
| Repository variable | `PRODUCTION_API_URL` | The backend URL the **production** bundle should call, e.g. `https://api.mgm-lab.id`. Baked into the JS bundle at build time. |

If you'd rather scope the API URL per environment, define `STAGING_API_URL` inside the `staging` GitHub Environment and `PRODUCTION_API_URL` inside `production` — the workflows read from the environment first if it's defined.

For ad-hoc builds you can override the URL via *Run workflow → Override NEXT_PUBLIC_API_URL*.

## Image tags

| Trigger | Tags pushed |
|---|---|
| Push to `staging` | `staging`, `staging-<sha>` |
| Push to `main` | `latest`, `production`, `sha-<short>` |
| Tag `v1.4.0` on `main` | `1.4.0`, `1.4`, `sha-<short>` |

## Why `NEXT_PUBLIC_API_URL` is a build argument

Next.js inlines `NEXT_PUBLIC_*` variables into the client bundle at build time. Changing the API endpoint requires rebuilding the image — pointing one image at two endpoints isn't possible. That's why `staging.yml` and `production.yml` each pass their own value through `--build-arg`, and why two separate images are published.

## Local equivalents

```bash
npm install
npm run typecheck
npm run build
docker buildx build --build-arg NEXT_PUBLIC_API_URL=http://localhost:8080 .
```

## Releasing

```bash
# Promote staging → main via your normal PR flow first.
git checkout main && git pull
git tag v0.1.0
git push --tags
```

The `production.yml` workflow watches `v*` tags and publishes the semver tags alongside `latest`.
