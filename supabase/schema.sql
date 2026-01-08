-- Enable Extensions
create extension if not exists "vector";
create extension if not exists "pg_trgm";
create extension if not exists "uuid-ossp";

-- 1. Profiles (Users)
-- 'stature' follows the gamification rules: Neófito -> Discípulo -> Obreiro -> Mestre
create table public.profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  mentor_id uuid references public.profiles(id), -- Auto-relationship for Hierarchy
  stature text default 'Neófito' check (stature in ('Neófito', 'Discípulo', 'Obreiro', 'Mestre')),
  talents_balance int default 0, -- XP
  constancy_streak int default 0, -- Constância
  is_leader boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS for Profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

-- 2. Bible Structure
create table public.bible_versions (
  id serial primary key,
  name text not null,
  slug text unique not null, -- 'acf', 'nvi'
  language text default 'pt-BR'
);

create table public.bible_books (
  id int primary key, -- 1-66
  slug text unique not null, -- 'genesis'
  name text not null,
  order_index int not null,
  testament text check (testament in ('VT', 'NT'))
);

create table public.bible_verses (
  id serial primary key,
  version_id int references public.bible_versions(id) on delete cascade,
  book_id int references public.bible_books(id) on delete cascade,
  chapter int not null,
  verse int not null,
  text text not null,
  fts tsvector generated always as (to_tsvector('portuguese', text)) stored
);

-- Index for FTS
create index idx_bible_verses_fts on bible_verses using gin(fts);
-- Index for quick lookup
create index idx_bible_verses_lookup on bible_verses(version_id, book_id, chapter, verse);

-- 3. Dictionary & AI
create table public.dictionary_entries (
  id serial primary key,
  term text unique not null,
  definition text not null,
  source text check (source in ('manual', 'ai_generated')),
  created_at timestamptz default now()
);

alter table public.dictionary_entries enable row level security;
create policy "Read dictionary" on dictionary_entries for select using (true);
-- Write policy: Only authenticated or service role (for AI)

-- 4. Knowledge Graph (A Teia)
create table public.knowledge_links (
  id serial primary key,
  source_type text not null, -- 'verse', 'note', 'topic'
  source_id text not null,
  target_type text not null,
  target_id text not null,
  connection_type text, -- 'profecia', 'cumprimento', 'relacionado'
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.knowledge_links enable row level security;
create policy "Read links" on knowledge_links for select using (true);

-- 5. Financial Transparency
create table public.donations (
  id serial primary key,
  donor_name text default 'Anônimo',
  amount decimal(10,2) not null,
  currency text default 'BRL',
  platform text default 'Apoia.se',
  date timestamptz default now()
);

create table public.project_costs (
  id serial primary key,
  description text not null,
  amount decimal(10,2) not null,
  category text, -- 'Server', 'Domain', 'API'
  date timestamptz default now()
);

alter table public.donations enable row level security;
alter table public.project_costs enable row level security;
create policy "Public read donations" on donations for select using (true);
create policy "Public read costs" on project_costs for select using (true);
