FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG PUBLIC_SITE_URL=https://example.com
ARG PUBLIC_BLOG_URL=https://blog.example.com
ARG PUBLIC_SITE_NAME="暮色导航"
ARG CONTENT_SOURCE=local
ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL PUBLIC_BLOG_URL=$PUBLIC_BLOG_URL PUBLIC_SITE_NAME=$PUBLIC_SITE_NAME CONTENT_SOURCE=$CONTENT_SOURCE
RUN pnpm build

FROM caddy:2.10-alpine
COPY infra/navigation/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:2019/config/ >/dev/null || exit 1
