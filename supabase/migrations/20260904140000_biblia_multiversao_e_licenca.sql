-- Bíblia multi-versão, com licença como dado de primeira classe.
--
-- Três problemas do schema anterior impediam ter mais de uma tradução:
--
-- 1. `bible_verses.fts` era `to_tsvector('portuguese', text)` fixo. Texto
--    em inglês seria radicalizado com regras do português, e hebraico/grego
--    não têm configuração no Postgres — a busca sairia errada em silêncio.
-- 2. O seed fazia `on conflict (id) do update set name, slug` em
--    `bible_books`. Semear uma tradução em inglês renomearia os 66 livros e
--    trocaria os slugs — e `reading_history`, `annotations` e a Teia guardam
--    `book_slug` como texto. Uma segunda versão corrompia o histórico.
-- 3. Não havia onde registrar licença. Sem isso não dá para hospedar ACF,
--    NVI ou qualquer tradução fechada, nem para provar que o que está no ar
--    pode estar no ar.

-- =====================================================================
-- 1. Licença e idioma como colunas da versão
-- =====================================================================
alter table public.bible_versions
  add column if not exists abbreviation text,
  add column if not exists year int,
  -- 'public_domain' | 'cc_by' | 'licensed'. Domínio público e CC BY podem
  -- ser servidos a qualquer um; 'licensed' exige contrato e é servido só a
  -- quem tem concessão (tabela bible_version_grants abaixo).
  add column if not exists license text not null default 'public_domain'
    check (license in ('public_domain', 'cc_by', 'licensed')),
  add column if not exists license_url text,
  add column if not exists copyright_holder text,
  -- Texto de crédito. CC BY não é "de graça e pronto": exige atribuição
  -- visível. Quem renderiza o capítulo tem que mostrar isto.
  add column if not exists attribution text,
  add column if not exists direction text not null default 'ltr'
    check (direction in ('ltr', 'rtl')),
  -- Configuração de busca do Postgres para esta versão. 'simple' não
  -- radicaliza — é o certo para grego e hebraico.
  add column if not exists search_config text not null default 'portuguese',
  add column if not exists is_enabled boolean not null default true,
  add column if not exists sort_order int not null default 100;

-- A configuração precisa existir no servidor, senão o trigger de fts quebra
-- só na hora do insert, com o seed já rodando.
alter table public.bible_versions
  drop constraint if exists bible_versions_search_config_valida;
alter table public.bible_versions
  add constraint bible_versions_search_config_valida
  check (search_config in ('simple', 'portuguese', 'english', 'spanish', 'german', 'french'));

-- =====================================================================
-- 2. Nomes de livro por idioma
-- =====================================================================
-- `bible_books` volta a ser canônico e imutável: id 1..66, slug estável
-- ('gn'), nome em português. É a chave que o resto do app referencia.
-- Tradução de nome de livro vira dado à parte.
create table if not exists public.bible_book_names (
  book_id int references public.bible_books(id) on delete cascade,
  language text not null,
  name text not null,
  abbreviation text,
  primary key (book_id, language)
);

alter table public.bible_book_names enable row level security;
drop policy if exists "Nomes de livro são públicos" on public.bible_book_names;
create policy "Nomes de livro são públicos"
  on public.bible_book_names for select using ( true );

-- Semeia o português a partir do que já existe.
insert into public.bible_book_names (book_id, language, name, abbreviation)
select id, 'pt-BR', name, slug from public.bible_books
on conflict (book_id, language) do nothing;

-- =====================================================================
-- 3. FTS por versão, não fixo em português
-- =====================================================================
-- Coluna gerada não consegue consultar outra tabela, então a manutenção
-- passa a ser por trigger. O índice e a query de busca não mudam.
do $$
begin
  if exists (
    select 1 from information_schema.columns
     where table_schema='public' and table_name='bible_verses'
       and column_name='fts' and is_generated='ALWAYS'
  ) then
    alter table public.bible_verses drop column fts;
  end if;
end $$;

alter table public.bible_verses add column if not exists fts tsvector;

create or replace function public.sync_verse_fts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg text;
begin
  select search_config into cfg
    from public.bible_versions where id = new.version_id;

  -- Versão desconhecida ou sem config: 'simple' indexa sem radicalizar,
  -- que é pior para busca mas nunca erra o idioma.
  new.fts := to_tsvector(coalesce(cfg, 'simple')::regconfig, new.text);
  return new;
end;
$$;

drop trigger if exists trg_verse_fts on public.bible_verses;
create trigger trg_verse_fts
  before insert or update of text, version_id on public.bible_verses
  for each row execute function public.sync_verse_fts();

-- Reindexa o que já está gravado (no-op num banco vazio).
update public.bible_verses set text = text where fts is null;

create index if not exists bible_verses_fts_idx on public.bible_verses using gin (fts);
create index if not exists idx_verses_versao_livro
  on public.bible_verses (version_id, book_id, chapter, verse);

-- =====================================================================
-- 4. Preparo para traduções licenciadas
-- =====================================================================
-- Hoje nenhuma versão é 'licensed'. Quando a ACF ou a NVI forem
-- autorizadas, basta inserir a versão com license='licensed' e conceder
-- acesso aqui — o gating já está de pé e testado, em vez de ser escrito às
-- pressas no dia da assinatura do contrato.
create table if not exists public.bible_version_grants (
  version_id int references public.bible_versions(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  granted_at timestamptz default now(),
  expires_at timestamptz,
  primary key (version_id, user_id)
);

alter table public.bible_version_grants enable row level security;
drop policy if exists "Usuário vê as próprias concessões" on public.bible_version_grants;
create policy "Usuário vê as próprias concessões"
  on public.bible_version_grants for select using ( user_id = auth.uid() );

create or replace function public.pode_ler_versao(target_version int)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.bible_versions v
     where v.id = target_version
       and v.is_enabled
       and (
         v.license <> 'licensed'
         or exists (
           select 1 from public.bible_version_grants g
            where g.version_id = v.id
              and g.user_id = auth.uid()
              and (g.expires_at is null or g.expires_at > now())
         )
       )
  );
$$;

alter table public.bible_versions enable row level security;
alter table public.bible_verses enable row level security;

drop policy if exists "Versões habilitadas são visíveis" on public.bible_versions;
create policy "Versões habilitadas são visíveis"
  on public.bible_versions for select using ( is_enabled );

-- O catálogo de versões é público (a pessoa precisa saber que a ACF
-- existe para querer acesso), mas o TEXTO de uma versão licenciada só sai
-- para quem tem concessão.
drop policy if exists "Versículos seguem a licença da versão" on public.bible_verses;
create policy "Versículos seguem a licença da versão"
  on public.bible_verses for select
  using ( public.pode_ler_versao(version_id) );

-- =====================================================================
-- 5. Versão preferida do usuário
-- =====================================================================
alter table public.profiles
  add column if not exists preferred_bible_version text;

-- Precisa entrar no grant de coluna da migration anterior, senão o usuário
-- não consegue trocar a própria versão de leitura.
grant update (username, full_name, avatar_url, mentor_id, preferred_bible_version)
  on public.profiles to authenticated;

-- =====================================================================
-- 6. Catálogo inicial
-- =====================================================================
-- Só metadado; o texto entra pelo scripts/seed-bible.js.
--
-- A ACF que estava no seed saiu: é da Sociedade Bíblica Trinitariana do
-- Brasil e o app tem página de doações, então não é uso privado. Fica
-- registrada como 'licensed' e desabilitada — o dia em que houver contrato,
-- é um update de uma linha.
insert into public.bible_versions
  (name, slug, language, abbreviation, license, license_url, copyright_holder, attribution, direction, search_config, is_enabled, sort_order)
values
  ('Almeida Revista e Corrigida (Bíblia Livre)', 'blivre', 'pt-BR', 'BLIVRE',
   'cc_by', 'https://creativecommons.org/licenses/by/3.0/br/', 'Projeto Bíblia Livre',
   'Texto: Projeto Bíblia Livre — CC BY 3.0 BR', 'ltr', 'portuguese', true, 10),

  ('King James Version', 'kjv', 'en', 'KJV',
   'public_domain', null, null,
   'Texto em domínio público', 'ltr', 'english', true, 20),

  ('Almeida Corrigida Fiel', 'acf', 'pt-BR', 'ACF',
   'licensed', null, 'Sociedade Bíblica Trinitariana do Brasil',
   'Uso mediante licença da Sociedade Bíblica Trinitariana do Brasil', 'ltr', 'portuguese', false, 30),

  ('Nestle 1904 (Novo Testamento grego)', 'grc-nestle1904', 'grc', 'N1904',
   'public_domain', null, null,
   'Texto em domínio público', 'ltr', 'simple', false, 40),

  ('Westminster Leningrad Codex (Antigo Testamento hebraico)', 'hbo-wlc', 'hbo', 'WLC',
   'public_domain', null, null,
   'Texto em domínio público', 'rtl', 'simple', false, 50)
on conflict (slug) do update set
  name = excluded.name,
  language = excluded.language,
  abbreviation = excluded.abbreviation,
  license = excluded.license,
  license_url = excluded.license_url,
  copyright_holder = excluded.copyright_holder,
  attribution = excluded.attribution,
  direction = excluded.direction,
  search_config = excluded.search_config,
  sort_order = excluded.sort_order;
