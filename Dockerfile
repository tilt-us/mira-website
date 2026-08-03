FROM node:24.17.0-alpine@sha256:156b55f92e98ccd5ef49578a8cea0df4679826564bad1c9d4ef04462b9f0ded6 AS build

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.5.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build:prod

FROM caddy:2.10.0-alpine@sha256:ae4458638da8e1a91aafffb231c5f8778e964bca650c8a8cb23a7e8ac557aa3c

LABEL org.opencontainers.image.source="https://github.com/tilt-us/mira-website" \
      org.opencontainers.image.description="Mira website frontend" \
      org.opencontainers.image.licenses="NOASSERTION"

# The upstream image grants this binary NET_BIND_SERVICE for ports below 1024.
# Caddy only binds 8080 here; retaining the file capability makes exec fail when
# Kubernetes correctly drops every ambient capability.
RUN setcap -r /usr/bin/caddy

COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build --chown=1000:1000 /app/dist/mira-website/browser /usr/share/caddy

USER 1000:1000

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
