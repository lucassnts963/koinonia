-- 6. Annotations (Notas Pessoais)
create table public.annotations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  book_slug text not null,
  chapter int not null,
  verse int not null,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS Annotations (Privado)
alter table public.annotations enable row level security;
create policy "Users can crud own annotations"
  on annotations for all
  using ( auth.uid() = user_id );

-- 7. Reading History (Histórico de Leitura para Gamificação)
create table public.reading_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  book_slug text not null,
  chapter int not null,
  completed_at timestamptz default now(),
  
  -- Garante que só existe um registro por capítulo por usuário (Idempotência)
  unique(user_id, book_slug, chapter)
);

-- RLS Reading History
alter table public.reading_history enable row level security;
create policy "Users can read own history"
  on reading_history for select
  using ( auth.uid() = user_id );

-- (Service Role vai inserir aqui, então não precisa de policy de insert pública explícita se usarmos bypass, 
--  mas para client-side fetch precisamos de select)
