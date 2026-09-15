-- Tribo passa a ter porta de entrada.
--
-- Contexto: existiam DUAS coisas chamadas "Tribo" no app.
--   profiles.mentor_id  -> árvore mentor→discípulo, é o que /discipulado usa
--   tribes/tribe_members -> grupo, é o que a discussão exige
--
-- O usuário clicava em "Buscar Cobertura", recebia "Você agora faz parte desta
-- Tribo!", e `listMyTribes()` continuava vazio — porque o fluxo só escrevia
-- mentor_id. Resultado: a camada de discussão inteira era inalcançável sem SQL
-- manual.
--
-- Aqui a entrada passa a povoar as duas coisas. mentor_id continua sendo o
-- discipulado 1:1 e não muda de significado; a tribo do líder passa a existir
-- de fato e a receber os discípulos como membros.
--
-- Duas policies de 20260904120000 tornavam isso impossível pelo cliente, e
-- nenhuma delas é afrouxada aqui — a saída é `security definer`, a mesma
-- técnica de is_tribe_member() e pode_ler_versao():
--
--   1. "Usuário entra na tribo" exige role = 'member' no insert, então quem
--      cria a tribo não consegue se inserir como 'leader'.
--   2. O select de `tribes` é `is_public or is_tribe_member(...)`, então um
--      não-membro não enxerga a tribo privada e nunca acha pelo invite_code.

-- =====================================================================
-- 1. Código de convite
-- =====================================================================
-- Alfabeto sem 0/O/1/I/L: o código é lido em voz alta numa célula e digitado
-- por outra pessoa; ambiguidade ali vira suporte.
create or replace function public.gerar_invite_code()
returns text
language plpgsql
volatile
as $$
declare
  alfabeto constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  candidato text;
  tentativa int := 0;
begin
  loop
    candidato := '';
    for _ in 1..6 loop
      candidato := candidato || substr(alfabeto, 1 + floor(random() * length(alfabeto))::int, 1);
    end loop;

    exit when not exists (select 1 from public.tribes where invite_code = candidato);

    tentativa := tentativa + 1;
    if tentativa > 50 then
      -- 31^6 ≈ 887 milhões de combinações; 50 colisões seguidas significa
      -- que o espaço encheu, não azar. Falhar é melhor que girar para sempre.
      raise exception 'Não foi possível gerar um código de convite único';
    end if;
  end loop;

  return candidato;
end;
$$;

-- =====================================================================
-- 2. Criar tribo
-- =====================================================================
create or replace function public.criar_tribo(nome text, descricao text default null)
returns public.tribes
language plpgsql
security definer
set search_path = public
as $$
declare
  eu uuid := auth.uid();
  nova public.tribes;
  base_slug text;
  slug_final text;
  sufixo int := 0;
begin
  if eu is null then
    raise exception 'Não autenticado';
  end if;

  nome := btrim(nome);
  if char_length(nome) < 3 then
    raise exception 'O nome da tribo precisa de ao menos 3 caracteres';
  end if;

  -- Slug a partir do nome, sem acento e sem símbolo. `unaccent` não está
  -- garantido no projeto, então a normalização é por translate — cobre o
  -- português, que é o caso real.
  base_slug := lower(translate(nome,
    'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇç',
    'aaaaaaaaaaeeeeeeeeiiiiiiiioooooooooouuuuuuuucc'));
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  base_slug := btrim(base_slug, '-');
  if base_slug = '' then base_slug := 'tribo'; end if;

  slug_final := base_slug;
  while exists (select 1 from public.tribes where slug = slug_final) loop
    sufixo := sufixo + 1;
    slug_final := base_slug || '-' || sufixo;
  end loop;

  insert into public.tribes (name, slug, description, leader_id, invite_code)
  values (nome, slug_final, nullif(btrim(coalesce(descricao, '')), ''), eu, public.gerar_invite_code())
  returning * into nova;

  -- O criador entra como leader. É este insert que a policy do cliente barra.
  insert into public.tribe_members (tribe_id, user_id, role)
  values (nova.id, eu, 'leader')
  on conflict (tribe_id, user_id) do update set role = 'leader';

  return nova;
end;
$$;

-- =====================================================================
-- 3. Entrar por código
-- =====================================================================
create or replace function public.entrar_na_tribo_por_codigo(codigo text)
returns public.tribes
language plpgsql
security definer
set search_path = public
as $$
declare
  eu uuid := auth.uid();
  alvo public.tribes;
begin
  if eu is null then
    raise exception 'Não autenticado';
  end if;

  -- Código é digitado por humano: maiúsculas e espaços sobrando não podem
  -- ser motivo de "tribo não encontrada".
  select * into alvo from public.tribes
   where invite_code = upper(btrim(codigo));

  if alvo.id is null then
    raise exception 'Código de convite inválido';
  end if;

  -- Idempotente: entrar de novo não rebaixa quem já é shepherd ou leader.
  insert into public.tribe_members (tribe_id, user_id, role)
  values (alvo.id, eu, 'member')
  on conflict (tribe_id, user_id) do nothing;

  return alvo;
end;
$$;

-- =====================================================================
-- 4. A tribo de um líder, criada sob demanda
-- =====================================================================
-- É o que liga o fluxo antigo ("Buscar Cobertura" pelo username do líder) ao
-- modelo novo: ao aceitar um mentor, o discípulo passa a ser membro da tribo
-- desse mentor, e a discussão fica alcançável sem o usuário aprender nada.
create or replace function public.tribo_do_lider(lider uuid)
returns public.tribes
language plpgsql
security definer
set search_path = public
as $$
declare
  alvo public.tribes;
  nome_lider text;
  base_slug text;
  slug_final text;
  sufixo int := 0;
begin
  select * into alvo from public.tribes where leader_id = lider order by created_at limit 1;
  if alvo.id is not null then
    return alvo;
  end if;

  select coalesce(nullif(btrim(full_name), ''), username, 'Líder')
    into nome_lider from public.profiles where id = lider;

  if nome_lider is null then
    raise exception 'Líder não encontrado';
  end if;

  base_slug := lower(regexp_replace(
    translate(nome_lider,
      'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇç',
      'aaaaaaaaaaeeeeeeeeiiiiiiiioooooooooouuuuuuuucc'),
    '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := btrim(base_slug, '-');
  if base_slug = '' then base_slug := 'tribo'; end if;
  base_slug := 'tribo-' || base_slug;

  slug_final := base_slug;
  while exists (select 1 from public.tribes where slug = slug_final) loop
    sufixo := sufixo + 1;
    slug_final := base_slug || '-' || sufixo;
  end loop;

  insert into public.tribes (name, slug, description, leader_id, invite_code)
  values ('Tribo de ' || nome_lider, slug_final,
          'Criada automaticamente a partir do discipulado.', lider, public.gerar_invite_code())
  returning * into alvo;

  insert into public.tribe_members (tribe_id, user_id, role)
  values (alvo.id, lider, 'leader')
  on conflict (tribe_id, user_id) do update set role = 'leader';

  return alvo;
end;
$$;

-- =====================================================================
-- 5. Aceitar um mentor passa a colocar o discípulo na tribo dele
-- =====================================================================
create or replace function public.entrar_na_tribo_do_mentor(mentor uuid)
returns public.tribes
language plpgsql
security definer
set search_path = public
as $$
declare
  eu uuid := auth.uid();
  alvo public.tribes;
begin
  if eu is null then raise exception 'Não autenticado'; end if;
  if mentor = eu then raise exception 'Você não pode discipular a si mesmo'; end if;

  alvo := public.tribo_do_lider(mentor);

  insert into public.tribe_members (tribe_id, user_id, role)
  values (alvo.id, eu, 'member')
  on conflict (tribe_id, user_id) do nothing;

  return alvo;
end;
$$;

-- =====================================================================
-- 6. Liderança gerencia papéis
-- =====================================================================
-- Faltava policy de update em tribe_members: nem o líder conseguia promover
-- alguém a shepherd.
drop policy if exists "Liderança define papéis" on public.tribe_members;
create policy "Liderança define papéis"
  on public.tribe_members for update
  using ( public.is_tribe_shepherd(tribe_id, auth.uid()) )
  with check ( public.is_tribe_shepherd(tribe_id, auth.uid()) );

create or replace function public.definir_papel(alvo_tribo uuid, alvo_usuario uuid, novo_papel text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  eu uuid := auth.uid();
  lider uuid;
begin
  if novo_papel not in ('member', 'shepherd', 'leader') then
    raise exception 'Papel inválido';
  end if;
  if not public.is_tribe_shepherd(alvo_tribo, eu) then
    raise exception 'Só a liderança da tribo pode mudar papéis';
  end if;

  select leader_id into lider from public.tribes where id = alvo_tribo;

  -- O líder registrado em `tribes` não pode ser rebaixado por um shepherd:
  -- senão um auxiliar promovido toma a tribo de quem a criou.
  if alvo_usuario = lider and novo_papel <> 'leader' then
    raise exception 'O líder da tribo não pode ser rebaixado';
  end if;

  update public.tribe_members
     set role = novo_papel
   where tribe_id = alvo_tribo and user_id = alvo_usuario;
end;
$$;

-- =====================================================================
-- 7. Backfill: quem já tem mentor vira membro da tribo dele
-- =====================================================================
-- Sem isto, todo usuário que já aceitou um mentor continuaria sem tribo e sem
-- conseguir discutir. Idempotente: roda de novo sem duplicar.
do $$
declare
  r record;
  t public.tribes;
begin
  for r in
    select distinct mentor_id from public.profiles
     where mentor_id is not null
  loop
    t := public.tribo_do_lider(r.mentor_id);

    insert into public.tribe_members (tribe_id, user_id, role)
    select t.id, p.id, 'member'
      from public.profiles p
     where p.mentor_id = r.mentor_id
    on conflict (tribe_id, user_id) do nothing;
  end loop;
end $$;
