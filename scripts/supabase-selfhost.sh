#!/usr/bin/env bash
# Baixa a stack oficial de self-host do Supabase para infra/supabase/.
#
# Deliberadamente NÃO mantemos uma cópia da compose do Supabase neste repo:
# ela tem ~12 serviços e um diretório volumes/ de configs que muda a cada
# release. Uma cópia desatualizada quebra de formas difíceis de diagnosticar.
#
#   ./scripts/supabase-selfhost.sh
set -euo pipefail

DEST="$(cd "$(dirname "$0")/.." && pwd)/infra/supabase"

if [ -d "$DEST" ]; then
  echo "!! $DEST já existe. Remova ou faça backup antes de baixar de novo." >&2
  exit 1
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo ">> clonando supabase/supabase (apenas o diretório docker/)"
git clone --filter=blob:none --no-checkout --depth 1 \
  https://github.com/supabase/supabase.git "$TMP/supabase"
git -C "$TMP/supabase" sparse-checkout set --cone docker
git -C "$TMP/supabase" checkout

mkdir -p "$(dirname "$DEST")"
cp -R "$TMP/supabase/docker" "$DEST"
cp "$DEST/.env.example" "$DEST/.env"

cat <<'MSG'

>> Pronto: infra/supabase/

Antes de subir, edite infra/supabase/.env. NÃO deixe nenhum valor de exemplo:

  POSTGRES_PASSWORD   senha forte, aleatória
  JWT_SECRET          >= 32 chars aleatórios
  ANON_KEY            gere em https://supabase.com/docs/guides/self-hosting#api-keys
  SERVICE_ROLE_KEY    idem (assinadas com o JWT_SECRET acima)
  SECRET_KEY_BASE     openssl rand -hex 32
  VAULT_ENC_KEY       openssl rand -hex 16
  DASHBOARD_PASSWORD  senha do Studio
  SITE_URL            https://SEU_DOMINIO
  API_EXTERNAL_URL    https://SEU_SUBDOMINIO_DA_API
  SUPABASE_PUBLIC_URL https://SEU_SUBDOMINIO_DA_API

Depois:
  cd infra/supabase && docker compose up -d
  # aplique as migrations do Koinonia (docs/DEPLOY.md §4.3)

MSG
