# K3s deployment

## Architecture

`GitHub Actions -> GHCR -> K3s -> Traefik`

CI tests the Angular application, builds `ghcr.io/tilt-us/mira-website`, and
publishes images with `GITHUB_TOKEN`. It deliberately does not use SSH, rsync,
a cluster-admin kubeconfig, `kubectl apply`, or direct access to the Kubernetes
API. K3s uses containerd to pull the OCI image; no Docker Engine is required on
the K3s node. Traefik terminates TLS and cert-manager obtains certificates.

After the first push, make the GHCR package public in its GitHub Package
settings when K3s should pull it anonymously. A private package instead needs
an image pull secret managed in the cluster or GitOps repository, not here.

## Branch mapping and rollout status

| Source | Environment | Namespace | Hostname |
| --- | --- | --- | --- |
| `development` | S-TEST | `tilt-dev` | `dev.tilt-us.com` |
| `master` | R-TEST | `tilt-staging` | `staging.tilt-us.com` |
| `vX.Y.Z` tag | PROD | `tilt-prod` | `tilt-us.com`, `www.tilt-us.com` |

Only S-TEST is currently eligible for website rollout. `master` and release
tags still create or promote image artifacts, but they must not be deployed to
R-TEST or PROD from this repository yet.

Pushes to `development` and `master` first run unit, Playwright, and container
smoke tests, then publish a mutable branch tag and the immutable, full-SHA tag
`sha-<commit SHA>`. Release tags never rebuild: they promote the existing SHA
image to `vX.Y.Z`, `X.Y.Z`, `X.Y`, and `X` with the same digest. No `latest`
tag is created. Buildx also attaches SBOM and provenance attestations.

## Manifests

The Kustomize overlays are under `deploy/k8s/overlays`. They use a ClusterIP
service on port 80 to the Caddy container on port 8080, Traefik ingress, and
cert-manager's `letsencrypt-prod` ClusterIssuer.

```bash
kubectl kustomize deploy/k8s/overlays/dev
kubectl kustomize deploy/k8s/overlays/staging
kubectl kustomize deploy/k8s/overlays/prod
```

The dev overlay's `development` tag is only a bootstrap convenience. Staging
and production intentionally contain a conspicuous SHA-tag placeholder so they
cannot silently use a moving branch tag. Before synchronization, GitOps must
replace the container image in every environment with the published immutable
digest:

```text
ghcr.io/tilt-us/mira-website@sha256:<published digest>
```

No digest is invented in this repository. An image automation controller or a
commit in a GitOps repository should make that image patch. Production renders
two replicas; two pods on a single K3s node are not high availability.

## Temporary backend configuration

The frontend has no Angular environment files. For every non-local hostname it
currently uses these shared browser-visible endpoints:

- API: `https://api.tilt-us.com`
- Keycloak: `https://api.tilt-us.com/keycloak`

This is a temporary S-TEST configuration, not an environment-neutral runtime
configuration. Until separate backend environments and public runtime
configuration exist, R-TEST and PROD must not be rolled out through this
website CI. No API, Keycloak, authentication, or client-mode behavior is
changed by this container migration.

If an environment later requires a different browser API or OAuth address, use
a mounted public JSON file such as `/config/runtime.json`, load it in an Angular
initializer before bootstrapping, and mount it from an environment ConfigMap.
Such data is readable by every browser user and must never contain secrets,
tokens, private keys, or client credentials.

## First verification and rollout

1. Confirm the branch image exists, for example `ghcr.io/tilt-us/mira-website:sha-<full commit SHA>`.
2. Render the dev overlay with the command above and inspect its namespace,
   ingress host, TLS secret, health probes, and image reference.
3. Replace the dev bootstrap tag with the published digest in the GitOps
   configuration, then let Argo CD synchronize S-TEST.
4. Do not synchronize the staging or prod overlays until separate backend
   environments and runtime configuration are available.
5. Configure Argo CD applications to watch the relevant overlay paths (or
   equivalent generated manifests) with each environment's normal GitOps
   repository credentials. This repository does not create an Argo CD token or
   assume an infrastructure repository.

## Retiring legacy secrets

After this migration is deployed and confirmed, remove these obsolete GitHub
repository secrets:

- `DEPLOY_SSH_KEY`
- `DEPLOY_HOST`
- `DEPLOY_PORT`
- `DEPLOY_USER`
- `DEPLOY_PATH`
- `DEPLOY_RSYNC_WITH_SUDO`
- `DEPLOY_POST_DEPLOY_COMMAND`
- `DEPLOY_CADDY_CONTAINER`
- `CADDY_CONTAINER_CONFIG_PATH`
- `CADDY_HOST_CONFIG_PATH`
- `CADDY_SITE_ROOT`
- `CADDY_CONTAINER_USE_SUDO`
- `CADDY_CONFIG_PATH`

`CODECOV_TOKEN` remains in use and must not be removed as part of this change.
