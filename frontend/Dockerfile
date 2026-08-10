# Build stage
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
ARG NEXT_PUBLIC_API_URL=/api/v1
ARG API_URL_INTERNAL=http://backend:8080
ARG NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
ARG NEXT_PUBLIC_USDT_CONTRACT=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV API_URL_INTERNAL=$API_URL_INTERNAL
ENV NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=$NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
ENV NEXT_PUBLIC_USDT_CONTRACT=$NEXT_PUBLIC_USDT_CONTRACT
RUN npm run build

# Production stage — runs Next.js in standalone mode (L20),
# so builds are lean (no full node_modules) and run as an unprivileged user.
FROM node:22-alpine

RUN addgroup -S app && adduser -S -G app app

WORKDIR /app
ENV NODE_ENV=production
ENV API_URL_INTERNAL=http://backend:8080
ENV PORT=3000
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
RUN chown -R app:app /app

USER app

EXPOSE 3000

CMD ["node", "server.js"]