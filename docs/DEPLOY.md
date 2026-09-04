# Deploy do Koinonia numa VPS

Stack: **Caddy** (TLS automático) → **Next.js standalone** em contêiner.
O banco/auth continua sendo Supabase.

---

## 0. Antes de decidir: onde fica o Supabase?

Duas topologias possíveis, e a escolha muda o custo operacional:

| | Supabase gerenciado (§1–§3) | Supabase self-hosted (§4) |
|---|---|---|
| Contêineres na VPS | 2 | ~14 |
| Backup do Postgres | Supabase faz | **você faz** |
| Rotação de chave JWT | Supabase faz | você faz |
| Se o volume do banco morrer | restaura do painel | perde tudo, inclusive as contas |
| VPS mínima | 1 vCPU / 1 GB | 4 GB de RAM, na prática |

**Comece pelo gerenciado.** O ganho de self-hostar é soberania do dado e
custo em escala; nenhum dos dois pesa antes dos primeiros usuários reais, e
o preço é você virar DBA. Migrar depois é um `pg_dump`.

---

## 1. Preparar a VPS

Debian 12 / Ubuntu 24.04, como root:

```bash
# Docker Engine + plugin compose
curl -fsSL https://get.docker.com | sh

# Firewall: só SSH e HTTP(S)
apt install -y ufw
ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable

# Swap ajuda no `next build` em VPS de 1–2 GB
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

DNS: registro **A** de `koinonia.example.com` apontando para o IP da VPS.
Faça isso **antes** do primeiro `up` — o Let's Encrypt valida por HTTP e
tem rate limit de 5 falhas por hora e por domínio.

## 2. Clonar e configurar

```bash
git clone https://github.com/lucassnts963/koinonia.git /opt/koinonia
cd /opt/koinonia
cp .env.example .env
$EDITOR .env
```

Preencher: `APP_DOMAIN`, `ACME_EMAIL`, as três chaves do Supabase e a
`OPENAI_API_KEY`.

> **Armadilha das `NEXT_PUBLIC_*`.** Elas são inlinadas no bundle do
> cliente em tempo de build, não lidas em runtime. Se você trocar a URL ou
> a anon key no `.env`, `docker compose restart` **não** surte efeito —
> precisa de `docker compose up -d --build`. As demais (service role,
> OpenAI) são runtime e bastam um restart.

## 3. Subir

```bash
docker compose up -d --build
docker compose ps            # app deve estar (healthy)
docker compose logs -f caddy # acompanhar a emissão do certificado
```

`https://koinonia.example.com` responde, e `/api/health` devolve
`{"status":"ok"}`.

### Atualizar

```bash
cd /opt/koinonia && git pull && docker compose up -d --build
```

O `--build` é obrigatório: o código vive dentro da imagem.

### Migrations

O compose não roda migration nenhuma — de propósito. Aplicar DDL em toda
inicialização de contêiner é como se perde produção. Rode você:

```bash
npx supabase link --project-ref SEU_REF
npx supabase db push
```

A migration `20260904130000_reconciliacao_e_lockdown_progressao.sql`
revoga o UPDATE do papel `authenticated` em `profiles` e o devolve só nas
colunas de perfil. Se depois disso alguém rodar um
`grant ... on all tables in schema public to authenticated` no painel para
"consertar permissão", os Talentos voltam a ser auto-emitíveis sem aviso.

`supabase/snippets/` é histórico: são SQL avulsos aplicados pelo editor do
painel antes de existir disciplina de migration. Não aplique nada de lá —
o que ainda fazia falta foi incorporado à migration acima.

### Operação

```bash
docker compose logs -f app          # logs
docker compose down                 # derruba (mantém volumes)
docker system prune -af --volumes   # NÃO rode: apaga o volume dos certificados
```

O `caddy_data` guarda os certificados. Apagá-lo força reemissão e, se você
repetir, o rate limit do Let's Encrypt te deixa sem HTTPS por uma semana.

---

## 4. Opcional: Supabase na mesma VPS

Só faça isso com a `docs/DEPLOY.md §0` lida e um plano de backup escrito.

### 4.1 Baixar a stack oficial

```bash
./scripts/supabase-selfhost.sh
```

Ele clona `supabase/supabase` (só o diretório `docker/`) para
`infra/supabase/`, que está no `.gitignore`. Não mantemos uma cópia da
compose do Supabase neste repositório: são ~12 serviços mais um diretório
de configs que muda a cada release, e uma cópia velha quebra de formas
difíceis de diagnosticar.

### 4.2 Gerar segredos e subir

Edite `infra/supabase/.env`. **Nenhum valor de exemplo pode sobreviver** —
os defaults do repositório do Supabase são públicos, e uma instância que
sobe com `JWT_SECRET` padrão está aberta para qualquer um forjar um token
de `service_role`.

```bash
openssl rand -hex 32   # JWT_SECRET, SECRET_KEY_BASE
openssl rand -hex 16   # VAULT_ENC_KEY
```

`ANON_KEY` e `SERVICE_ROLE_KEY` são JWTs assinados com o `JWT_SECRET`
(gerador em https://supabase.com/docs/guides/self-hosting#api-keys).

Ajuste também `SITE_URL=https://$APP_DOMAIN`, e
`API_EXTERNAL_URL` = `SUPABASE_PUBLIC_URL` = `https://$SUPABASE_DOMAIN`.

```bash
cd infra/supabase && docker compose up -d && cd ../..
```

### 4.3 Aplicar o schema do Koinonia

```bash
for f in supabase/migrations/*.sql; do
  echo ">> $f"
  docker exec -i supabase-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 < "$f" || break
done
```

A ordem é a alfabética do nome do arquivo, que é cronológica por
convenção — não reordene. A primeira migration cria a extensão `vector`;
a imagem `supabase/postgres` já traz o pgvector, mas um Postgres puro não,
e aí a migration inteira aborta na segunda linha.

Verificado: as oito migrations aplicam limpas num Postgres 16 vazio, e o
banco resultante roda o app (trigger de criação de perfil, tabelas do
plano de leitura e o lockdown de progressão inclusos).

### 4.4 Ligar o app

No `.env` da raiz:

```
SUPABASE_DOMAIN=api.koinonia.example.com
NEXT_PUBLIC_SUPABASE_URL=https://api.koinonia.example.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY gerada acima>
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY gerada acima>
```

DNS: registro A de `api.koinonia.example.com` para o mesmo IP.

```bash
docker compose -f docker-compose.yml -f docker-compose.supabase.yml up -d --build
```

O navegador fala com `api.koinonia.example.com` direto (auth, PostgREST,
realtime), por isso ele precisa de hostname público e TLS próprios — não
dá para escondê-lo atrás do app.

### 4.5 Backup (não pule)

```bash
docker exec supabase-db pg_dump -U postgres -Fc postgres > koinonia-$(date +%F).dump
```

Num cron diário, com cópia **fora da VPS**. Backup no mesmo disco que o
banco não é backup.

---

## 5. Pendências que afetam o deploy

Ordem de prioridade, herdadas do handoff:

- **Licença da Bíblia.** `scripts/seed-bible.js` importa a *Almeida
  Corrigida Fiel*, protegida por direitos autorais da Sociedade Bíblica
  Trinitariana do Brasil. Um repositório de terceiro redistribuir não torna
  o uso lícito, e o app tem página de doações — não é uso privado. Trocar
  por texto em domínio público (ARC 1898/1911 ou *A Bíblia Livre*) **antes**
  de abrir para usuários: migrar `bible_verses` fica mais caro a cada dia.
- ~~**Talentos auto-emitíveis.**~~ Corrigido em
  `20260904130000_reconciliacao_e_lockdown_progressao.sql` por GRANT de
  coluna (RLS decide linhas, nunca colunas). **Ainda não aplicado em
  produção** — rode `supabase db push` antes de abrir para usuários, e
  leia o aviso sobre grants amplos na seção Migrations.
