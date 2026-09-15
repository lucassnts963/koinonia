# syntax=docker/dockerfile:1

# =====================================================================
# Koinonia — imagem de produção (Next.js 16 / App Router / standalone)
# =====================================================================

FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ---------------------------------------------------------------------
# deps — instala node_modules a partir do lockfile
# ---------------------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---------------------------------------------------------------------
# builder — gera o build standalone
#
# ATENÇÃO: variáveis NEXT_PUBLIC_* são inlinadas no bundle do cliente em
# tempo de BUILD. Elas precisam vir como build args; trocar o .env depois
# não muda o que já foi compilado — é preciso rebuildar a imagem.
# ---------------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Segredos de servidor NÃO entram na imagem. Alguns módulos instanciam o
# cliente OpenAI / o admin do Supabase no escopo do módulo, e esses SDKs
# lançam erro se a chave for undefined durante a coleta de rotas do build.
# Placeholders satisfazem o construtor; os valores reais chegam em runtime.
ENV SUPABASE_SERVICE_ROLE_KEY=build-placeholder
ENV OPENAI_API_KEY=build-placeholder
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---------------------------------------------------------------------
# runner — só o necessário para servir
# ---------------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# public/ inclui o service worker gerado pelo next-pwa durante o build.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
