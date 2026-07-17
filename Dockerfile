FROM node:24-bookworm-slim AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/muse/package.json apps/muse/package.json
RUN pnpm install --frozen-lockfile
COPY apps/muse apps/muse
COPY seed seed
RUN pnpm build

FROM node:24-bookworm-slim
ENV NODE_ENV=production PORT=3000 HOST=0.0.0.0 MUSE_DATA_DIR=/app/data MUSE_SEED_DIR=/app/seed
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/muse/node_modules ./apps/muse/node_modules
COPY --from=build /app/apps/muse/build ./apps/muse/build
COPY --from=build /app/apps/muse/package.json ./apps/muse/package.json
COPY seed ./seed
RUN mkdir -p /app/data && chown -R node:node /app/data
USER node
EXPOSE 3000
CMD ["node","apps/muse/build"]
HEALTHCHECK --interval=30s --timeout=4s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
