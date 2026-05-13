# Frontend Dockerfile for Next.js
FROM node:22-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Build stage
FROM base AS builder
WORKDIR /app

# husky prepare 스크립트는 .git을 요구하는데 Docker 빌드 컨텍스트에는 .git이 없음.
# HUSKY=0 으로 husky 자체를 no-op 처리 (husky 9 공식 지원).
ENV HUSKY=0

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy source files
COPY . .

# 빌드 타임에 NEXT_PUBLIC_* 환경변수 주입 (클라이언트 컴포넌트에 인라인됨)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID
ARG NEXT_PUBLIC_NAVER_CLIENT_ID
ARG NEXT_PUBLIC_NAVER_REDIRECT_URI

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID
ENV NEXT_PUBLIC_NAVER_CLIENT_ID=$NEXT_PUBLIC_NAVER_CLIENT_ID
ENV NEXT_PUBLIC_NAVER_REDIRECT_URI=$NEXT_PUBLIC_NAVER_REDIRECT_URI

# Build Next.js app
RUN pnpm build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built files from builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
