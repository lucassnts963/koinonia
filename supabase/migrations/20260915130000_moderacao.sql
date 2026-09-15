-- Moderação: a denúncia deixa de ser um buraco.
--
-- Hoje flagContent() grava em `discussion_flags` e a UI responde "A liderança
-- da sua tribo foi avisada". Isso é falso: a única policy de select é
-- `reporter_id = auth.uid()`, então a liderança nunca vê nada, e não existe
-- policy de UPDATE nenhuma — resolver é impossível. A fila enche e ninguém lê.
--
-- `discussion_flags` também não guarda `tribe_id`: o alvo é uma discussão ou
-- uma resposta, e a tribo está na discussão. Em vez de desnormalizar (que
-- duplicaria a verdade e poderia divergir), a resolução é feita por função.

-- =====================================================================
-- 1. Qual é a tribo de um conteúdo denunciado
-- =====================================================================
create or replace function public.tribo_do_alvo(alvo_tipo text, alvo_id uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select case
    when alvo_tipo = 'discussion' then
      (select d.tribe_id from public.discussions d where d.id = alvo_id)
    when alvo_tipo = 'reply' then
      (select d.tribe_id
         from public.discussion_replies r
         join public.discussions d on d.id = r.discussion_id
        where r.id = alvo_id)
  end;
$$;

-- =====================================================================
-- 2. A liderança lê e resolve as denúncias da própria tribo
-- =====================================================================
drop policy if exists "Liderança vê denúncias da tribo" on public.discussion_flags;
create policy "Liderança vê denúncias da tribo"
  on public.discussion_flags for select
  using (
    public.is_tribe_shepherd(public.tribo_do_alvo(target_type, target_id), auth.uid())
  );

drop policy if exists "Liderança resolve denúncias da tribo" on public.discussion_flags;
create policy "Liderança resolve denúncias da tribo"
  on public.discussion_flags for update
  using (
    public.is_tribe_shepherd(public.tribo_do_alvo(target_type, target_id), auth.uid())
  )
  with check (
    public.is_tribe_shepherd(public.tribo_do_alvo(target_type, target_id), auth.uid())
  );

-- =====================================================================
-- 3. A fila, já com o conteúdo denunciado
-- =====================================================================
-- Devolve tudo montado porque o alvo vive em duas tabelas diferentes: fazer
-- isso no cliente seria uma consulta por denúncia.
create or replace function public.denuncias_da_minha_tribo(incluir_resolvidas boolean default false)
returns table (
  id uuid,
  target_type text,
  target_id uuid,
  reason text,
  created_at timestamptz,
  resolved_at timestamptz,
  reporter_username text,
  tribe_id uuid,
  tribe_name text,
  conteudo text,
  autor_username text,
  autor_id uuid,
  discussion_id uuid,
  ja_oculto boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select
    f.id,
    f.target_type,
    f.target_id,
    f.reason,
    f.created_at,
    f.resolved_at,
    rep.username as reporter_username,
    t.id as tribe_id,
    t.name as tribe_name,
    case when f.target_type = 'discussion'
         then coalesce(d.title || ' — ' || left(d.body, 400), '(conteúdo removido)')
         else coalesce(left(r.body, 400), '(conteúdo removido)')
    end as conteudo,
    case when f.target_type = 'discussion' then da.username else ra.username end as autor_username,
    case when f.target_type = 'discussion' then da.id else ra.id end as autor_id,
    case when f.target_type = 'discussion' then d.id else r.discussion_id end as discussion_id,
    case when f.target_type = 'discussion' then d.deleted_at is not null
         else r.deleted_at is not null end as ja_oculto
  from public.discussion_flags f
  left join public.profiles rep on rep.id = f.reporter_id
  left join public.discussions d on f.target_type = 'discussion' and d.id = f.target_id
  left join public.profiles da on da.id = d.author_id
  left join public.discussion_replies r on f.target_type = 'reply' and r.id = f.target_id
  left join public.profiles ra on ra.id = r.author_id
  join public.tribes t on t.id = public.tribo_do_alvo(f.target_type, f.target_id)
  where public.is_tribe_shepherd(t.id, auth.uid())
    and (incluir_resolvidas or f.resolved_at is null)
  order by f.created_at desc;
$$;

-- =====================================================================
-- 4. Resolver
-- =====================================================================
-- Três desfechos possíveis, e a denúncia NUNCA afeta a pontuação do
-- conteúdo — é canal de pastoreio, não de ranking:
--   ignorar  -> marca resolvida, conteúdo fica
--   ocultar  -> deleted_at no alvo (a RLS de leitura já filtra deleted_at)
--   arquivar -> a discussão para de aceitar respostas novas
create or replace function public.resolver_denuncia(denuncia uuid, acao text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  eu uuid := auth.uid();
  f public.discussion_flags;
  tribo uuid;
begin
  if acao not in ('ignorar', 'ocultar', 'arquivar') then
    raise exception 'Ação inválida';
  end if;

  select * into f from public.discussion_flags where id = denuncia;
  if f.id is null then
    raise exception 'Denúncia não encontrada';
  end if;

  tribo := public.tribo_do_alvo(f.target_type, f.target_id);
  if not public.is_tribe_shepherd(tribo, eu) then
    raise exception 'Só a liderança da tribo pode resolver denúncias';
  end if;

  if acao = 'ocultar' then
    if f.target_type = 'discussion' then
      update public.discussions set deleted_at = now() where id = f.target_id;
    else
      update public.discussion_replies set deleted_at = now() where id = f.target_id;
    end if;
  elsif acao = 'arquivar' then
    if f.target_type = 'discussion' then
      update public.discussions set status = 'archived' where id = f.target_id;
    else
      update public.discussions set status = 'archived'
       where id = (select discussion_id from public.discussion_replies where id = f.target_id);
    end if;
  end if;

  -- Todas as denúncias sobre o mesmo alvo se resolvem juntas: três pessoas
  -- denunciando a mesma mensagem é um caso, não três.
  update public.discussion_flags
     set resolved_by = eu, resolved_at = now()
   where target_type = f.target_type
     and target_id = f.target_id
     and resolved_at is null;
end;
$$;

-- =====================================================================
-- 5. Quem pastoreia alguma tribo?
-- =====================================================================
-- Usado para decidir se o link de moderação aparece na navegação.
create or replace function public.sou_lideranca()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.tribe_members
     where user_id = auth.uid() and role in ('shepherd', 'leader')
  );
$$;
