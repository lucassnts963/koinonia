-- Tribos como entidade de primeira classe + camada de discussão ancorada.
--
-- Contexto: até aqui "Tribo" existia apenas como profiles.mentor_id (árvore
-- mentor -> discípulos). Isso descreve discipulado 1:1, mas não consegue
-- escopar uma discussão em grupo. mentor_id continua intacto e ortogonal.

-- =====================================================================
-- 1. Tribos
-- =====================================================================
create table if not exists public.tribes (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  description text,
  leader_id uuid references public.profiles(id) not null,
  invite_code text unique not null,
  -- Quando true, as discussões da tribo também aparecem no acervo público.
  -- Padrão fechado: discussão nasce dentro da tribo.
  is_public boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.tribe_members (
  tribe_id uuid references public.tribes(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'shepherd', 'leader')),
  joined_at timestamptz default now(),
  primary key (tribe_id, user_id)
);

create index if not exists idx_tribe_members_user on public.tribe_members(user_id);

-- Helper: o usuário pertence à tribo?
create or replace function public.is_tribe_member(target_tribe uuid, target_user uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.tribe_members
    where tribe_id = target_tribe and user_id = target_user
  );
$$;

-- Helper: o usuário pastoreia a tribo (líder ou pastor auxiliar)?
create or replace function public.is_tribe_shepherd(target_tribe uuid, target_user uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.tribe_members
    where tribe_id = target_tribe
      and user_id = target_user
      and role in ('shepherd', 'leader')
  );
$$;

-- =====================================================================
-- 2. Discussões (sempre ancoradas em um objeto que já existe)
-- =====================================================================
do $$ begin
  create type public.discussion_anchor as enum ('verse', 'passage', 'study', 'term', 'plan_day');
exception when duplicate_object then null; end $$;

create table if not exists public.discussions (
  id uuid default gen_random_uuid() primary key,
  -- null = acervo público (só estudos publicados chegam aqui)
  tribe_id uuid references public.tribes(id) on delete cascade,
  author_id uuid references public.profiles(id) not null,

  anchor_type public.discussion_anchor not null,
  -- Referência normalizada: 'joao-3:16', 'study-<uuid>', 'graca'
  anchor_ref text not null,

  title text not null check (char_length(title) between 3 and 160),
  body text not null check (char_length(body) between 1 and 20000),

  is_question boolean default false,
  answered_reply_id uuid,
  status text default 'open' check (status in ('open', 'answered', 'archived', 'flagged')),

  -- Contadores desnormalizados, mantidos por trigger
  reply_count int default 0,
  edifying_count int default 0,

  last_activity_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create index if not exists idx_discussions_anchor on public.discussions(anchor_type, anchor_ref);
create index if not exists idx_discussions_tribe_activity on public.discussions(tribe_id, last_activity_at desc);
create index if not exists idx_discussions_author on public.discussions(author_id);

-- =====================================================================
-- 3. Respostas (um nível de aninhamento — profundidade infinita degrada conversa)
-- =====================================================================
create table if not exists public.discussion_replies (
  id uuid default gen_random_uuid() primary key,
  discussion_id uuid references public.discussions(id) on delete cascade not null,
  parent_id uuid references public.discussion_replies(id) on delete cascade,
  author_id uuid references public.profiles(id) not null,

  body text not null check (char_length(body) between 1 and 20000),
  edifying_count int default 0,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create index if not exists idx_replies_discussion on public.discussion_replies(discussion_id, created_at);
create index if not exists idx_replies_parent on public.discussion_replies(parent_id);

-- Trava o aninhamento em 1 nível: uma resposta-filha não pode ter filhas.
create or replace function public.enforce_reply_depth()
returns trigger
language plpgsql
as $$
begin
  if new.parent_id is not null then
    if exists (
      select 1 from public.discussion_replies
      where id = new.parent_id and parent_id is not null
    ) then
      raise exception 'Respostas admitem apenas um nível de aninhamento';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_reply_depth on public.discussion_replies;
create trigger trg_reply_depth
  before insert or update on public.discussion_replies
  for each row execute function public.enforce_reply_depth();

-- =====================================================================
-- 4. Reações — deliberadamente sem voto negativo
-- =====================================================================
do $$ begin
  create type public.reaction_kind as enum ('edificante', 'me_ajudou', 'orando');
exception when duplicate_object then null; end $$;

create table if not exists public.reactions (
  user_id uuid references public.profiles(id) on delete cascade not null,
  target_type text not null check (target_type in ('discussion', 'reply')),
  target_id uuid not null,
  kind public.reaction_kind not null,
  created_at timestamptz default now(),
  primary key (user_id, target_type, target_id, kind)
);

create index if not exists idx_reactions_target on public.reactions(target_type, target_id);

-- =====================================================================
-- 5. Denúncias — canal separado do score, resolvido por pastor/líder
-- =====================================================================
create table if not exists public.discussion_flags (
  id uuid default gen_random_uuid() primary key,
  target_type text not null check (target_type in ('discussion', 'reply')),
  target_id uuid not null,
  reporter_id uuid references public.profiles(id) not null,
  reason text not null,
  resolved_by uuid references public.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz default now(),
  unique (target_type, target_id, reporter_id)
);

-- =====================================================================
-- 6. Contadores por trigger
-- =====================================================================
create or replace function public.sync_discussion_counters()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid;
begin
  target := coalesce(new.discussion_id, old.discussion_id);

  update public.discussions d
     set reply_count = (
           select count(*) from public.discussion_replies r
           where r.discussion_id = target and r.deleted_at is null
         ),
         last_activity_at = greatest(d.last_activity_at, coalesce(new.created_at, now()))
   where d.id = target;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_sync_reply_counters on public.discussion_replies;
create trigger trg_sync_reply_counters
  after insert or update or delete on public.discussion_replies
  for each row execute function public.sync_discussion_counters();

create or replace function public.sync_edifying_counters()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  t_type text;
  t_id uuid;
  total int;
begin
  t_type := coalesce(new.target_type, old.target_type);
  t_id := coalesce(new.target_id, old.target_id);

  select count(*) into total
    from public.reactions
   where target_type = t_type and target_id = t_id and kind = 'edificante';

  if t_type = 'discussion' then
    update public.discussions set edifying_count = total where id = t_id;
  else
    update public.discussion_replies set edifying_count = total where id = t_id;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_sync_edifying on public.reactions;
create trigger trg_sync_edifying
  after insert or delete on public.reactions
  for each row execute function public.sync_edifying_counters();

-- =====================================================================
-- 7. RLS
-- =====================================================================
alter table public.tribes enable row level security;
alter table public.tribe_members enable row level security;
alter table public.discussions enable row level security;
alter table public.discussion_replies enable row level security;
alter table public.reactions enable row level security;
alter table public.discussion_flags enable row level security;

-- Tribos: públicas são visíveis a todos; privadas só a membros.
drop policy if exists "Tribos visíveis a membros ou se públicas" on public.tribes;
create policy "Tribos visíveis a membros ou se públicas"
  on public.tribes for select
  using ( is_public or public.is_tribe_member(id, auth.uid()) );

drop policy if exists "Líder cria tribo" on public.tribes;
create policy "Líder cria tribo"
  on public.tribes for insert
  with check ( auth.uid() = leader_id );

drop policy if exists "Líder edita a própria tribo" on public.tribes;
create policy "Líder edita a própria tribo"
  on public.tribes for update
  using ( public.is_tribe_shepherd(id, auth.uid()) );

-- Membros
drop policy if exists "Membros veem a própria tribo" on public.tribe_members;
create policy "Membros veem a própria tribo"
  on public.tribe_members for select
  using ( user_id = auth.uid() or public.is_tribe_member(tribe_id, auth.uid()) );

drop policy if exists "Usuário entra na tribo" on public.tribe_members;
create policy "Usuário entra na tribo"
  on public.tribe_members for insert
  with check ( user_id = auth.uid() and role = 'member' );

drop policy if exists "Usuário sai da tribo" on public.tribe_members;
create policy "Usuário sai da tribo"
  on public.tribe_members for delete
  using ( user_id = auth.uid() or public.is_tribe_shepherd(tribe_id, auth.uid()) );

-- Discussões: acervo público OU tribo da qual sou membro.
drop policy if exists "Leitura de discussões" on public.discussions;
create policy "Leitura de discussões"
  on public.discussions for select
  using (
    deleted_at is null
    and (
      tribe_id is null
      or public.is_tribe_member(tribe_id, auth.uid())
    )
  );

drop policy if exists "Membro escreve na própria tribo" on public.discussions;
create policy "Membro escreve na própria tribo"
  on public.discussions for insert
  with check (
    author_id = auth.uid()
    and (tribe_id is null or public.is_tribe_member(tribe_id, auth.uid()))
  );

drop policy if exists "Autor ou pastor edita discussão" on public.discussions;
create policy "Autor ou pastor edita discussão"
  on public.discussions for update
  using (
    author_id = auth.uid()
    or (tribe_id is not null and public.is_tribe_shepherd(tribe_id, auth.uid()))
  );

-- Respostas herdam a visibilidade da discussão.
drop policy if exists "Leitura de respostas" on public.discussion_replies;
create policy "Leitura de respostas"
  on public.discussion_replies for select
  using (
    deleted_at is null
    and exists (
      select 1 from public.discussions d
      where d.id = discussion_id
        and d.deleted_at is null
        and (d.tribe_id is null or public.is_tribe_member(d.tribe_id, auth.uid()))
    )
  );

drop policy if exists "Membro responde" on public.discussion_replies;
create policy "Membro responde"
  on public.discussion_replies for insert
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.discussions d
      where d.id = discussion_id
        and d.status <> 'archived'
        and (d.tribe_id is null or public.is_tribe_member(d.tribe_id, auth.uid()))
    )
  );

drop policy if exists "Autor ou pastor edita resposta" on public.discussion_replies;
create policy "Autor ou pastor edita resposta"
  on public.discussion_replies for update
  using (
    author_id = auth.uid()
    or exists (
      select 1 from public.discussions d
      where d.id = discussion_id
        and d.tribe_id is not null
        and public.is_tribe_shepherd(d.tribe_id, auth.uid())
    )
  );

-- Reações
drop policy if exists "Leitura de reações" on public.reactions;
create policy "Leitura de reações" on public.reactions for select using ( true );

drop policy if exists "Usuário reage" on public.reactions;
create policy "Usuário reage"
  on public.reactions for insert with check ( user_id = auth.uid() );

drop policy if exists "Usuário retira a própria reação" on public.reactions;
create policy "Usuário retira a própria reação"
  on public.reactions for delete using ( user_id = auth.uid() );

-- Denúncias: quem denuncia vê a própria; pastores veem para resolver.
drop policy if exists "Denunciante vê a própria denúncia" on public.discussion_flags;
create policy "Denunciante vê a própria denúncia"
  on public.discussion_flags for select using ( reporter_id = auth.uid() );

drop policy if exists "Usuário denuncia" on public.discussion_flags;
create policy "Usuário denuncia"
  on public.discussion_flags for insert with check ( reporter_id = auth.uid() );

-- =====================================================================
-- 8. Teto diário de Talentos por participação em discussão
-- =====================================================================
alter table public.profiles
  add column if not exists discussion_talents_today int default 0,
  add column if not exists discussion_talents_date date;
