-- Reconciliação do schema + fechamento do buraco de progressão.
--
-- Contexto: parte do schema de produção foi aplicada pelo editor SQL do
-- painel (ver supabase/snippets/) e nunca virou migration. O resultado é
-- que um banco criado do zero a partir de supabase/migrations/ não roda o
-- app: faltam colunas em `profiles` e duas tabelas do plano de leitura.
--
-- Tudo aqui é idempotente, para poder ser aplicado tanto num banco novo
-- quanto no de produção, que já tem parte disto.

-- =====================================================================
-- 1. profiles: colunas que o código já usa e nenhuma migration criava
-- =====================================================================
-- actions/gamification.ts e actions/progress.ts leem stature_level e
-- last_activity_date; actions/tribe.ts lê full_name e avatar_url.
alter table public.profiles
  add column if not exists stature_level int default 1,
  add column if not exists last_activity_date date,
  add column if not exists full_name text,
  add column if not exists avatar_url text;

-- Backfill coerente com a fórmula de gamification.ts: nível = talentos/100 + 1.
update public.profiles
   set stature_level = greatest(1, floor(coalesce(talents_balance, 0) / 100.0)::int + 1)
 where stature_level is null or stature_level < 1;

-- =====================================================================
-- 2. Plano de leitura: tabelas que só existiam no painel
-- =====================================================================
create table if not exists public.reading_plan_days (
  id uuid default gen_random_uuid() primary key,
  day_number int not null unique,
  description text,
  refs jsonb not null
);

create table if not exists public.user_plan_progress (
  user_id uuid references auth.users on delete cascade not null primary key,
  current_day int default 1,
  completed_days int[] default '{}',
  updated_at timestamptz default now()
);

alter table public.reading_plan_days enable row level security;
alter table public.user_plan_progress enable row level security;

drop policy if exists "Dias do plano são públicos" on public.reading_plan_days;
create policy "Dias do plano são públicos"
  on public.reading_plan_days for select using ( true );

-- `for all` precisa de with check além de using, senão o UPDATE passa a
-- linha para outro user_id sem ser barrado.
drop policy if exists "Users can crud own plan progress" on public.user_plan_progress;
drop policy if exists "Usuário gerencia o próprio progresso" on public.user_plan_progress;
create policy "Usuário gerencia o próprio progresso"
  on public.user_plan_progress for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

-- =====================================================================
-- 3. Criação do perfil no cadastro
-- =====================================================================
-- Não havia policy de INSERT em profiles: o insert de actions/auth.ts era
-- barrado por RLS e o erro só ia para o console. Trigger é o caminho certo
-- (roda como definer, não depende do cliente acertar as colunas).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'full_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- O cadastro ainda pode querer criar o próprio perfil como fallback.
-- Permitido — mas só a própria linha, e as colunas de progressão ficam
-- fora do alcance pelos grants da seção 4.
drop policy if exists "Usuário cria o próprio perfil" on public.profiles;
create policy "Usuário cria o próprio perfil"
  on public.profiles for insert
  with check ( auth.uid() = id );

-- =====================================================================
-- 4. Talentos deixam de ser auto-emitíveis
-- =====================================================================
-- A policy "Users can update own profile" autoriza update com
-- auth.uid() = id e nada mais. RLS decide QUAIS LINHAS, nunca quais
-- colunas — então qualquer usuário podia chamar a API REST do Supabase
-- direto e escrever o próprio talents_balance, stature_level ou
-- constancy_streak. Toda a gamificação era honra.
--
-- Postgres resolve isso por GRANT de coluna, não por policy: revoga-se o
-- UPDATE da tabela e devolve-se apenas nas colunas de perfil. O
-- service_role (usado por gamification.ts e discussion.ts) não passa por
-- aqui e continua escrevendo progressão.
revoke update on public.profiles from anon, authenticated;
grant update (username, full_name, avatar_url, mentor_id)
  on public.profiles to authenticated;

-- Insert pelo cliente também só nas colunas de identidade; o resto vem
-- dos defaults da tabela.
revoke insert on public.profiles from anon, authenticated;
grant insert (id, username, full_name, avatar_url)
  on public.profiles to authenticated;

-- CUIDADO: qualquer `grant update on public.profiles to authenticated`
-- posterior — inclusive um `grant ... on all tables in schema public`
-- rodado no painel para "consertar permissão" — reabre este buraco em
-- silêncio, porque o grant de tabela cobre todas as colunas. Se um dia
-- talents_balance voltar a ser gravável pelo cliente, é aqui que se olha.
-- Colunas de progressão novas nascem negadas: só entram se alguém as
-- adicionar explicitamente ao grant acima.

-- =====================================================================
-- 5. Teia: impedir que salvar o mesmo estudo duplique os links
-- =====================================================================
-- saveStudy() reinsere os links a cada save sem limpar os anteriores, o
-- que infla o grafo em silêncio. A correção no código apaga os links do
-- estudo antes de regravar — mas knowledge_links só tinha policy de
-- SELECT e INSERT, então esse delete não removeria nada e falharia calado.
drop policy if exists "Usuário apaga os próprios links" on public.knowledge_links;
create policy "Usuário apaga os próprios links"
  on public.knowledge_links for delete
  using ( user_id = auth.uid() );

-- A constraint fecha a porta pelo banco, para o caso de outro caminho de
-- código reinserir. A limpeza dos duplicados que já existem vem antes
-- dela, senão a criação do índice falha.
delete from public.knowledge_links a
 using public.knowledge_links b
 where a.ctid > b.ctid
   and a.source = b.source
   and a.target = b.target
   and a.user_id is not distinct from b.user_id;

create unique index if not exists idx_kl_unico
  on public.knowledge_links (source, target, coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid));
