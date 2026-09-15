-- Jornada deixa de ser "um plano fixo escolhido no catálogo" para virar
-- "jornada com dono e escopo": do sistema (curada), pessoal (cada um cria a
-- sua) ou da tribo (o líder cria para os discípulos).
--
-- user_active_plans já suportava múltiplas jornadas por usuário
-- (unique(user_id, plan_id), não unique(user_id)) — o teto de "uma jornada
-- por vez" estava só na camada de ação (getUserActivePlan com .single()) e
-- na UI. O schema não precisa mudar ali.

-- =====================================================================
-- 1. reading_plans ganha dono e escopo
-- =====================================================================
alter table public.reading_plans
  add column if not exists created_by uuid references public.profiles(id) on delete cascade,
  add column if not exists tribe_id uuid references public.tribes(id) on delete cascade,
  add column if not exists is_system boolean not null default false;

-- As duas jornadas curadas de hoje (Gênesis Expresso, Salmos de Sabedoria) e
-- as que scripts/seed-jornadas.js vai gerar são "do sistema": sem dono,
-- visíveis a todo mundo, do jeito que "Public read plans" já funcionava.
update public.reading_plans set is_system = true where created_by is null and tribe_id is null;

-- =====================================================================
-- 2. RLS de reading_plans: sistema, dono, ou membro da tribo
-- =====================================================================
drop policy if exists "Public read plans" on public.reading_plans;
drop policy if exists "Vê jornadas do sistema, próprias ou da tribo" on public.reading_plans;
create policy "Vê jornadas do sistema, próprias ou da tribo"
  on public.reading_plans for select
  using (
    is_system
    or created_by = auth.uid()
    or (tribe_id is not null and public.is_tribe_member(tribe_id, auth.uid()))
  );

-- Qualquer autenticado cria jornada pessoal (tribe_id null); só quem
-- pastoreia a tribo cria com tribe_id preenchido. is_system nunca entra pelo
-- grant de coluna abaixo — só o seed (service_role) marca uma jornada como
-- do sistema.
drop policy if exists "Cria jornada própria ou da tribo que pastoreia" on public.reading_plans;
create policy "Cria jornada própria ou da tribo que pastoreia"
  on public.reading_plans for insert
  with check (
    created_by = auth.uid()
    and (tribe_id is null or public.is_tribe_shepherd(tribe_id, auth.uid()))
  );

drop policy if exists "Dono ou liderança edita a jornada" on public.reading_plans;
create policy "Dono ou liderança edita a jornada"
  on public.reading_plans for update
  using (
    created_by = auth.uid()
    or (tribe_id is not null and public.is_tribe_shepherd(tribe_id, auth.uid()))
  )
  with check (
    created_by = auth.uid()
    or (tribe_id is not null and public.is_tribe_shepherd(tribe_id, auth.uid()))
  );

drop policy if exists "Dono ou liderança apaga a jornada" on public.reading_plans;
create policy "Dono ou liderança apaga a jornada"
  on public.reading_plans for delete
  using (
    created_by = auth.uid()
    or (tribe_id is not null and public.is_tribe_shepherd(tribe_id, auth.uid()))
  );

-- Mesma lição de talents_balance: RLS decide QUAIS LINHAS, nunca QUAIS
-- COLUNAS. is_system só pode nascer false pelo cliente (o default da
-- coluna) — sem isso, qualquer um marcaria a própria jornada como "do
-- sistema" e ela apareceria pra todo mundo sem ser dono nem tribo.
revoke insert, update on public.reading_plans from anon, authenticated;
grant insert (title, description, days_count, created_by, tribe_id)
  on public.reading_plans to authenticated;
grant update (title, description, days_count)
  on public.reading_plans to authenticated;

-- =====================================================================
-- 3. RLS de plan_days segue a visibilidade da jornada dona
-- =====================================================================
drop policy if exists "Public read plan days" on public.plan_days;
drop policy if exists "Vê os dias de uma jornada que pode ver" on public.plan_days;
create policy "Vê os dias de uma jornada que pode ver"
  on public.plan_days for select
  using (
    exists (
      select 1 from public.reading_plans p
       where p.id = plan_days.plan_id
         and (
           p.is_system
           or p.created_by = auth.uid()
           or (p.tribe_id is not null and public.is_tribe_member(p.tribe_id, auth.uid()))
         )
    )
  );

-- Escrever os dias é privilégio de quem pode editar a jornada dona — a
-- checagem repete a mesma condição de "Dono ou liderança edita a jornada",
-- e o WITH CHECK do UPDATE reavalia contra o plan_id NOVO, então mover um
-- dia para uma jornada alheia falha do mesmo jeito que criar um dia nela.
drop policy if exists "Dono ou liderança escreve os dias" on public.plan_days;
create policy "Dono ou liderança escreve os dias"
  on public.plan_days for insert
  with check (
    exists (
      select 1 from public.reading_plans p
       where p.id = plan_days.plan_id
         and (p.created_by = auth.uid() or (p.tribe_id is not null and public.is_tribe_shepherd(p.tribe_id, auth.uid())))
    )
  );

drop policy if exists "Dono ou liderança edita os dias" on public.plan_days;
create policy "Dono ou liderança edita os dias"
  on public.plan_days for update
  using (
    exists (
      select 1 from public.reading_plans p
       where p.id = plan_days.plan_id
         and (p.created_by = auth.uid() or (p.tribe_id is not null and public.is_tribe_shepherd(p.tribe_id, auth.uid())))
    )
  )
  with check (
    exists (
      select 1 from public.reading_plans p
       where p.id = plan_days.plan_id
         and (p.created_by = auth.uid() or (p.tribe_id is not null and public.is_tribe_shepherd(p.tribe_id, auth.uid())))
    )
  );

drop policy if exists "Dono ou liderança apaga os dias" on public.plan_days;
create policy "Dono ou liderança apaga os dias"
  on public.plan_days for delete
  using (
    exists (
      select 1 from public.reading_plans p
       where p.id = plan_days.plan_id
         and (p.created_by = auth.uid() or (p.tribe_id is not null and public.is_tribe_shepherd(p.tribe_id, auth.uid())))
    )
  );

-- plan_days não tem coluna equivalente a is_system para travar por GRANT —
-- a única coisa sensível é plan_id, e o WITH CHECK acima já cobre isso.
-- Só falta fechar o buraco padrão do Supabase (anon com CRUD de tabela).
revoke insert, update, delete on public.plan_days from anon;

-- =====================================================================
-- 4. Progresso da tribo — o líder vê quem está em qual jornada
-- =====================================================================
-- user_active_plans só é visível ao próprio dono (auth.uid() = user_id),
-- então o líder não consegue ver o progresso dos discípulos direto pelo
-- cliente. Mesmo padrão de denuncias_da_minha_tribo(): security definer,
-- com o próprio corpo da função checando is_tribe_shepherd por dentro —
-- não abre a tabela, só este relatório.
create or replace function public.progresso_da_tribo(alvo_tribo uuid)
returns table (
  jornada_id uuid,
  jornada_titulo text,
  jornada_dias_totais int,
  membro_id uuid,
  membro_username text,
  dia_atual int,
  dias_completados int,
  is_completed boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select
    rp.id as jornada_id,
    rp.title as jornada_titulo,
    rp.days_count as jornada_dias_totais,
    tm.user_id as membro_id,
    p.username as membro_username,
    uap.current_day as dia_atual,
    coalesce(array_length(uap.completed_days, 1), 0) as dias_completados,
    coalesce(uap.is_completed, false) as is_completed
  from public.reading_plans rp
  join public.tribe_members tm on tm.tribe_id = rp.tribe_id
  join public.profiles p on p.id = tm.user_id
  left join public.user_active_plans uap on uap.plan_id = rp.id and uap.user_id = tm.user_id
  where rp.tribe_id = alvo_tribo
    and public.is_tribe_shepherd(alvo_tribo, auth.uid())
  order by rp.title, p.username;
$$;

-- =====================================================================
-- 5. Contagem real de capítulos, para criar jornada sem digitar referência
-- =====================================================================
-- scripts/seed-jornadas.js faz essa mesma conta em lote pelo Node; isto é o
-- equivalente para quando é o próprio usuário (ou um líder) criando a
-- jornada pela UI — sem puxar toda bible_verses para o cliente só para
-- achar o max(chapter) de cada livro. Sem security definer: RLS de
-- bible_verses já decide o que cada papel pode ler.
create or replace function public.contar_capitulos(alvo_versao int, livros int[] default null)
returns table (book_id int, book_slug text, capitulos int)
language sql
stable
set search_path = public
as $$
  select b.id, b.slug, max(v.chapter)::int
  from public.bible_verses v
  join public.bible_books b on b.id = v.book_id
  where v.version_id = alvo_versao
    and (livros is null or b.id = any(livros))
  group by b.id, b.slug
  order by b.id;
$$;

-- =====================================================================
-- 6. Foco: qual jornada o usuário está priorizando agora
-- =====================================================================
-- Não impede ter várias ativas (isso é o ponto da Parte D) — só guarda qual
-- delas a UI deve mostrar primeiro e destacar como "principal". Mesma
-- técnica de coluna de preferred_bible_version: FK solta, sem RLS extra.
alter table public.profiles
  add column if not exists focused_plan_id uuid references public.reading_plans(id) on delete set null;

grant update (username, full_name, avatar_url, mentor_id, preferred_bible_version, focused_plan_id)
  on public.profiles to authenticated;
