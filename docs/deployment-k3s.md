# K3s deployment

## Delivery model

`GitHub Actions -> GHCR -> Argo CD -> K3s`

GitHub Actions runs tests and publishes `ghcr.io/tilt-us/mira-website`. It has
no kubeconfig, SSH, rsync, or Argo CD admin access. Argo CD and Argo CD Image
Updater deploy the branch image as an immutable digest in the cluster. K3s uses
containerd; Docker Engine is not required on the server.

The website container listens on port 8080 as UID/GID 1000. It remains
non-root, drops all capabilities, uses a read-only root filesystem, and has no
host networking, Docker socket, HostPath, NodePort, or LoadBalancer access.

## Environments

| Branch | Environment | Website | API | Mira Keycloak | Namespace | Image tag |
| --- | --- | --- | --- | --- | --- | --- |
| `development` | Dev / S-TEST | `https://dev.tilt-us.com` | `https://dev-api.tilt-us.com` | `https://dev-api.tilt-us.com/keycloak` | `tilt-dev` | `development` |
| `master` | Staging / R-TEST | `https://staging.tilt-us.com` | `https://staging-api.tilt-us.com` | `https://staging-api.tilt-us.com/keycloak` | `tilt-staging` | `master` |
| release tag `vX.Y.Z` | future production | `https://tilt-us.com` | `https://api.tilt-us.com` | `https://api.tilt-us.com/keycloak` | `tilt-prod` | release tag |

Production has no Argo CD Application in this repository and is not activated
by this change. The infrastructure Keycloak at `sso.tilt-us.com` is only for
infrastructure applications and must never be used by Mira.

## Runtime configuration

One unchanged image runs in every environment. It contains a local development
file at `public/config/runtime.json`; each Kubernetes overlay generates and
mounts its own public ConfigMap file at `/usr/share/caddy/config/runtime.json`.
The generated ConfigMap name includes a content hash, so a runtime-config
change updates the Deployment volume reference and rolls out a new Pod.

The browser loads `/config/runtime.json` with `cache: "no-store"` before Angular
starts. Caddy serves this file as JSON with `Cache-Control: no-store, no-cache,
must-revalidate` and does not route it through the SPA fallback. The file is
public and may contain only endpoint URLs, realm, and public browser client
IDs. Never put passwords, client secrets, tokens, keys, or database credentials
in it.

## Promotion

```text
feature branch -> pull request to development -> Dev
development -> pull request to master -> Staging
```

There is no automatic `development` to `master` merge, force-push, direct
cluster deployment from GitHub Actions, or `latest` tag. A push to
`development` publishes `development` and `sha-<commit>`; a push to `master`
publishes `master` and `sha-<commit>`. Image Updater observes the mutable branch
tag and writes its digest into the Argo CD application state.

## Manifests and bootstrap

Render the manifests locally before applying the Argo CD resources:

```bash
kubectl kustomize deploy/k8s/overlays/dev
kubectl kustomize deploy/k8s/overlays/staging
kubectl kustomize deploy/k8s/overlays/prod
```

The applications use `CreateNamespace=true`; `tilt-staging` does not need to be
created beforehand. Dev is bootstrapped with `mira-website-dev.yaml` and its
ImageUpdater resource. After the first successful `development -> master` merge
and green `master` workflow, an administrator runs once from a trusted
cluster-admin workstation:

```bash
kubectl apply -f deploy/argocd/mira-website-staging.yaml
kubectl apply -f deploy/argocd/mira-website-staging-image-updater.yaml
```

Further staging updates are then automatic.

## Dev namespace ownership

`mira-services-dev` is the sole Argo CD owner of the `tilt-dev` Namespace. The
website Application deploys its namespaced resources into `tilt-dev`, but does
not render a Namespace resource. This prevents two Argo CD Applications from
competing to manage the same cluster-scoped object.

## DNS and ZeroTier prerequisites

Do not automate these entries from this repository. The public IONOS A records
needed for Let's Encrypt HTTP-01 are:

```text
staging.tilt-us.com       -> public server IP
dev-api.tilt-us.com       -> public server IP
staging-api.tilt-us.com   -> public server IP
```

Team machines resolve internal HTTPS hosts over ZeroTier:

```text
10.253.212.1 staging.tilt-us.com
10.253.212.1 dev-api.tilt-us.com
10.253.212.1 staging-api.tilt-us.com
```

Public TCP port 443 remains closed; public port 80 remains open only for
HTTP-01. The backend repositories must still provide the Dev/Staging API and
Mira-Keycloak ingresses. Until then the website loads but API and login calls to
the new URLs cannot succeed.
