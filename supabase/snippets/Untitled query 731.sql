-- 1. Tabela do Plano de Leitura
create table public.reading_plan_days (
  id uuid default uuid_generate_v4() primary key,
  day_number int not null unique,
  description text, -- ex: "Gênesis 1-3, Salmos 1"
  refs jsonb not null -- Estrutura: [{"book": "gn", "chapters": [1,2,3]}, ...]
);

-- População Mínima (Seed de 3 dias para teste)
insert into reading_plan_days (day_number, description, refs) values 
(1, 'O Princípio', '[{"book": "gn", "chapters": [1,2,3]}]'),
(2, 'O Primeiro Homicídio', '[{"book": "gn", "chapters": [4,5,6]}]'),
(3, 'A Arca de Noé', '[{"book": "gn", "chapters": [7,8,9]}]')
on conflict (day_number) do nothing;

-- 2. Progresso do Usuário no Plano
create table public.user_plan_progress (
  user_id uuid references auth.users not null primary key,
  current_day int default 1,
  completed_days int[] default '{}',
  updated_at timestamptz default now()
);

alter table public.user_plan_progress enable row level security;

create policy "Users can crud own plan progress"
  on user_plan_progress for all
  using ( auth.uid() = user_id );

-- 3. Tabela de Estudos (Sermões/Anotações)
create table public.studies (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  content text, -- HTML ou JSON
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.studies enable row level security;

create policy "Users can crud own studies"
  on studies for all
  using ( auth.uid() = user_id );

-- 4. Atualização Knowledge Links (Teia) para suportar links privados
alter table public.knowledge_links add column user_id uuid references auth.users;

-- Importante: Atualizar policies de knowledge_links
alter table public.knowledge_links enable row level security;

drop policy if exists "Public read access" on knowledge_links;
create policy "Users can read system links and own links"
  on knowledge_links for select
  using ( user_id is null or user_id = auth.uid() );

create policy "Users can insert own links"
  on knowledge_links for insert
  with check ( auth.uid() = user_id );

--- 5. Índice Full Text Search para Busca Bíblica Rápida
-- Presume que a tabela bible_verses já existe. Adicionando coluna tsvector gerada.
alter table public.bible_verses 
add column if not exists fts tsvector 
generated always as (to_tsvector('portuguese', text)) stored;

create index if not exists bible_verses_fts_idx on public.bible_verses using gin (fts);
