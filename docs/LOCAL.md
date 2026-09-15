# Rodar o Koinonia na sua máquina

Stack local: Supabase pela CLI (Postgres + Auth + PostgREST em contêineres)
e o Next em `npm run dev`. Nada toca o projeto de produção.

Pré-requisitos: Docker rodando e Node 20+.

## 1. Subir o Supabase local

```bash
npm install
npm run db:start
```

O primeiro `db:start` baixa ~10 imagens; leva uns minutos. No fim ele
imprime as chaves locais. Você vai precisar de três linhas:

```
API URL: http://127.0.0.1:54321
anon key: eyJ...
service_role key: eyJ...
```

> Se o comando reclamar de `config.toml`, você está numa árvore antiga —
> o arquivo passou a ser versionado em `supabase/config.toml`.

## 2. Configurar o `.env.local`

```bash
cp .env.example .env.local
```

E preencha com o que o passo 1 imprimiu:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key local>
SUPABASE_SERVICE_ROLE_KEY=<service_role key local>
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
OPENAI_API_KEY=<opcional; sem ela só o dicionário deixa de funcionar>
```

São as chaves **locais**, iguais para todo mundo e sem valor nenhum fora da
sua máquina. Não use as de produção aqui: o `service_role` ignora RLS.

## 3. Aplicar o schema

```bash
npm run db:reset
```

Derruba o banco local e reaplica `supabase/migrations/` em ordem. Isso
inclui a criação de perfil no cadastro, o catálogo de versões da Bíblia e o
lockdown de progressão.

## 4. Semear a Bíblia

```bash
npm run seed:bible            # A Bíblia Livre (pt-BR), padrão
npm run seed:bible kjv        # King James (en)
npm run seed:bible -- --list  # o que tem adaptador pronto
```

São ~31 mil versículos por versão; leva um ou dois minutos cada.

`bible_books` é canônico: os 66 livros, com slug estável (`gn`, `sl`), são
gravados uma vez pela primeira versão semeada e **nunca** sobrescritos —
`reading_history`, `annotations` e a Teia guardam `book_slug` como texto e
quebrariam junto. Os nomes traduzidos vão para `bible_book_names`.

O seed se recusa a semear uma versão marcada como `licensed` no catálogo.
É de propósito: é o que impede hospedar uma tradução protegida sem contrato.

## 5. Rodar o app

```bash
npm run dev
```

`http://localhost:3000`. Crie a conta em `/login` — com
`enable_confirmations = false` no `config.toml`, o cadastro entra direto,
sem e-mail de confirmação. Os e-mails que o app enviaria aparecem no
Mailpit local (`npm run db:start` imprime a URL).

## 6. Ver a discussão funcionando

A discussão nasce **dentro de uma tribo** — não existe praça pública onde
qualquer um abre tema. Com o app rodando, em `/discipulado`:

1. **Criar uma tribo** (você vira o líder) ou **entrar por código**, se alguém
   já te passou um. O código de convite aparece na tela de quem lidera.
2. Aceitar um mentor em "Buscar Cobertura" também coloca você na tribo dele —
   é a mesma porta, e ela grava as duas coisas.

Com tribo, abra qualquer capítulo (`/leitura/gn/1`) e role até o fim: o bloco
"Conversa sobre Gênesis 1" aparece com o botão de abrir discussão. Publicar
leva para `/discussao/<id>`, com respostas (um nível de aninhamento), reações
(`edificante`, `me_ajudou`, `orando` — não existe voto negativo), marcar
resposta e denunciar.

Clicando no número de um versículo há também "Discutir com a tribo", que
ancora a conversa naquele versículo específico.

Sem tribo, o bloco mostra o convite para entrar em uma. Isso é o
comportamento correto, não um bug.

### Moderação

Denunciar um conteúdo manda para a fila da liderança da tribo. Se você é
líder ou pastor, `/moderacao` aparece na navegação com a fila, e cada
denúncia tem três desfechos: sem problema, ocultar, ou arquivar a discussão.
Nada disso mexe em Talentos ou ranking — é canal de pastoreio.

### Acervo

Em `/estudos`, cada estudo tem "Publicar no acervo". O estudo publicado vira
uma discussão pública em `/acervo`, aberta a quem não é da sua tribo. É o
único caminho para o acervo: nada nasce lá.

### Versões da Bíblia

Se você semeou mais de uma versão (passo 4), o seletor aparece no topo do
capítulo. A escolha vira `?v=<slug>` na URL e fica gravada no seu perfil.

## Comandos

```bash
npm run db:start    # sobe o Supabase local
npm run db:stop     # derruba (mantém os dados)
npm run db:reset    # recria o banco e reaplica as migrations (APAGA os dados locais)
npm run dev         # Next em modo desenvolvimento
npm run build       # build de produção
```

## Quando algo não sobe

- **`supabase start` trava baixando imagem**: é rede. Rode de novo; ele
  retoma do que já baixou.
- **Login redireciona e volta pro `/login`**: `NEXT_PUBLIC_SUPABASE_URL`
  no `.env.local` tem que ser exatamente `http://127.0.0.1:54321`, e
  `site_url` no `config.toml`, `http://localhost:3000`. Misturar
  `localhost` e `127.0.0.1` quebra o cookie de sessão.
- **Capítulo vazio**: faltou o passo 4. Confira com
  `select slug, count(*) from bible_verses bv join bible_versions v on v.id=bv.version_id group by 1;`
- **Mudou `NEXT_PUBLIC_*`**: reinicie o `npm run dev`. Essas variáveis são
  lidas no build do cliente, não a cada request.
