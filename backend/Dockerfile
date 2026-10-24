# ---------- base: Node + OpenSSL (Prisma lo necesita) ----------
FROM node:20-slim AS base
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---------- development: recarga en caliente (docker-compose.yml) ----------
FROM base AS development
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:dev"]

# ---------- build: compila TypeScript a dist/ ----------
FROM development AS build
RUN npm run build && npm prune --omit=dev

# ---------- production: solo lo necesario para correr (docker-compose.prod.yml) ----------
FROM base AS production
ENV NODE_ENV=production
COPY --from=build --chown=node:node /app/package*.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/dist ./dist
USER node
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
