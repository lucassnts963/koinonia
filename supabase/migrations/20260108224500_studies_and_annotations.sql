-- 1. Tabela de Estudos (Sermões/Anotações)
create table if not exists public.studies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  content text, 
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.studies enable row level security;
do $$ begin
    create policy "Users can crud own studies" on studies for all using ( auth.uid() = user_id );
exception when others then null; end $$;

-- 2. Annotations (Notas Pessoais vinculadas a versículos)
create table if not exists public.annotations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  book_slug text not null,
  chapter int not null,
  verse int not null,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.annotations enable row level security;
do $$ begin
    create policy "Users can crud own annotations" on annotations for all using ( auth.uid() = user_id );
exception when others then null; end $$;

-- 3. Reading History (Histórico de Leitura para Gamificação)
create table if not exists public.reading_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  book_slug text not null,
  chapter int not null,
  completed_at timestamptz default now(),
  unique(user_id, book_slug, chapter)
);

alter table public.reading_history enable row level security;
do $$ begin
    create policy "Users can read own history" on reading_history for select using ( auth.uid() = user_id );
exception when others then null; end $$;

-- 4. FTS and Schema Fixes
-- Garantir que bible_verses tenha tsvector gerado (caso não esteja no inicial)
do $$ begin
    alter table public.bible_verses 
    add column if not exists fts tsvector 
    generated always as (to_tsvector('portuguese', text)) stored;
    
    create index if not exists bible_verses_fts_idx on public.bible_verses using gin (fts);
exception when others then null; end $$;
