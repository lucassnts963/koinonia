-- Endurecimento apontado pelo advisor de segurança do Supabase logo após
-- aplicar as migrations pendentes em produção.
--
-- Dois achados reais, o resto é ruído esperado para este desenho (tabelas
-- de leitura pública aparecem no schema GraphQL por natureza; `vector` e
-- `pg_trgm` em public são de 20260108175522, anteriores a esta sessão, e
-- mover extensão de schema é operação arriscada o bastante para não fazer
-- de passagem).

-- =====================================================================
-- 1. search_path ausente em duas funções
-- =====================================================================
-- Todas as outras já tinham `set search_path = public`; essas duas
-- escaparam. Sem isso, um search_path malicioso no papel de quem chama
-- poderia, em tese, fazer a função resolver um objeto de outro schema em
-- vez do pretendido.
create or replace function public.enforce_reply_depth()
returns trigger
language plpgsql
set search_path = public
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

create or replace function public.gerar_invite_code()
returns text
language plpgsql
volatile
set search_path = public
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
      raise exception 'Não foi possível gerar um código de convite único';
    end if;
  end loop;

  return candidato;
end;
$$;

-- =====================================================================
-- 2. Funções que só deveriam disparar por trigger, expostas via REST
-- =====================================================================
-- handle_new_user, sync_discussion_counters, sync_edifying_counters,
-- sync_verse_fts, limpar_orfaos_do_alvo e limpar_mentor_ao_sair_da_tribo
-- não fazem sentido chamadas direto — todas dependem de NEW/OLD, que só
-- existem em contexto de trigger, e chamá-las via /rest/v1/rpc/... erraria
-- de qualquer forma. Mas ficarem executáveis por anon/authenticated é
-- superfície de ataque à toa: revogar aqui não afeta o trigger em si —
-- disparo de trigger não passa pelo GRANT de EXECUTE da função, só chamada
-- direta via RPC passa.
--
-- Duas camadas de grant dão EXECUTE aqui, e as duas precisam ser revogadas
-- ou o acesso sobrevive por uma delas:
-- 1. `create function` concede EXECUTE a PUBLIC por padrão do Postgres;
-- 2. o próprio Supabase roda `alter default privileges ... grant execute on
--    functions to anon, authenticated` no schema public, então toda função
--    nova já nasce com grant explícito para os dois papéis, além do de
--    PUBLIC.
-- Confirmado testando local: revogar só de anon/authenticated (sobra
-- PUBLIC) ou só de PUBLIC (sobra o grant explícito) deixava
-- has_function_privilege true do mesmo jeito nos dois casos — só revogando
-- das três fontes o acesso cai de fato.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.sync_discussion_counters() from public, anon, authenticated;
revoke execute on function public.sync_edifying_counters() from public, anon, authenticated;
revoke execute on function public.sync_verse_fts() from public, anon, authenticated;
revoke execute on function public.limpar_orfaos_do_alvo() from public, anon, authenticated;
revoke execute on function public.limpar_mentor_ao_sair_da_tribo() from public, anon, authenticated;

-- As demais SECURITY DEFINER (criar_tribo, entrar_na_tribo_por_codigo,
-- resolver_denuncia, is_tribe_member, pode_ler_versao, etc.) continuam
-- executáveis: são a API pretendida — todas checam auth.uid() internamente
-- (ou, no caso de is_tribe_member/is_tribe_shepherd/pode_ler_versao/
-- tribo_do_alvo/tribo_do_lider, são usadas DENTRO de policies de RLS, e
-- revogar delas quebraria a avaliação da policy para qualquer papel,
-- inclusive leitura pública legítima — não é o mesmo risco que as de cima.
