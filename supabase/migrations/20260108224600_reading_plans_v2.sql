-- 1. Tabela de Definição dos Planos (Metadados)
create table if not exists public.reading_plans (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  days_count int default 0,
  created_at timestamptz default now()
);

-- 2. Tabela de Dias do Plano (Conteúdo)
create table if not exists public.plan_days (
  id uuid default gen_random_uuid() primary key,
  plan_id uuid references public.reading_plans not null,
  day_number int not null,
  description text,
  refs jsonb not null, 
  unique(plan_id, day_number)
);

-- 3. Planos Ativos do Usuário
create table if not exists public.user_active_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  plan_id uuid references public.reading_plans not null,
  current_day int default 1,
  completed_days int[] default '{}',
  started_at timestamptz default now(),
  updated_at timestamptz default now(),
  is_completed boolean default false,
  unique(user_id, plan_id)
);

-- RLS
alter table reading_plans enable row level security;
do $$ begin
    create policy "Public read plans" on reading_plans for select using (true);
exception when others then null; end $$;

alter table plan_days enable row level security;
do $$ begin
    create policy "Public read plan days" on plan_days for select using (true);
exception when others then null; end $$;

alter table user_active_plans enable row level security;
do $$ begin
    create policy "Users can crud own active plans" on user_active_plans for all using (auth.uid() = user_id);
exception when others then null; end $$;

-- SEED DATA Initial
do $$
declare
  p1_id uuid;
  p2_id uuid;
begin
  if not exists (select 1 from reading_plans where title = 'Gênesis Expresso') then
      -- Plano 1: Gênesis em 1 Semana
      insert into reading_plans (title, description, days_count) 
      values ('Gênesis Expresso', 'Uma jornada rápida pelo início de tudo em 7 dias.', 7)
      returning id into p1_id;

      insert into plan_days (plan_id, day_number, description, refs) values
      (p1_id, 1, 'A Criação', '[{"book":"gn","chapters":[1,2,3]}]'),
      (p1_id, 2, 'A Queda', '[{"book":"gn","chapters":[4,5]}]'),
      (p1_id, 3, 'O Dilúvio', '[{"book":"gn","chapters":[6,7,8,9]}]'),
      (p1_id, 4, 'A Torre de Babel', '[{"book":"gn","chapters":[10,11]}]'),
      (p1_id, 5, 'O Chamado de Abrão', '[{"book":"gn","chapters":[12,13,14]}]'),
      (p1_id, 6, 'A Aliança', '[{"book":"gn","chapters":[15,16,17]}]'),
      (p1_id, 7, 'Sodoma e Gomorra', '[{"book":"gn","chapters":[18,19]}]');
  end if;

  if not exists (select 1 from reading_plans where title = 'Salmos de Sabedoria') then
      -- Plano 2: Salmos de Sabedoria
      insert into reading_plans (title, description, days_count) 
      values ('Salmos de Sabedoria', '3 dias meditando na sabedoria divina.', 3)
      returning id into p2_id;

      insert into plan_days (plan_id, day_number, description, refs) values
      (p2_id, 1, 'O Caminho do Justo', '[{"book":"sl","chapters":[1]}]'),
      (p2_id, 2, 'O Rei Ungido', '[{"book":"sl","chapters":[2]}]'),
      (p2_id, 3, 'Oração Matutina', '[{"book":"sl","chapters":[5]}]');
  end if;
end $$;
