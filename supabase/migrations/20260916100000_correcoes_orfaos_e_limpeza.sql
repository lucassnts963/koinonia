-- Correções encontradas na investigação do incidente de produção de 15/09:
-- órfãos por falta de FK em alvo polimórfico, mentor_id divergindo de
-- tribe_members, e a limpeza de duas tabelas órfãs criadas por engano.

-- =====================================================================
-- A1. reactions e discussion_flags órfãos quando o alvo é apagado
-- =====================================================================
-- Os dois são alvo polimórfico (target_type + target_id) e não têm FK — o
-- alvo vive em duas tabelas diferentes, então FK direta é impossível. Sem
-- isto, apagar uma discussão deixa reação e denúncia apontando para o nada,
-- e sync_edifying_counters() conta um alvo que não existe mais.
create or replace function public.limpar_orfaos_do_alvo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  tipo text := tg_argv[0];
begin
  delete from public.reactions where target_type = tipo and target_id = old.id;
  delete from public.discussion_flags where target_type = tipo and target_id = old.id;
  return old;
end;
$$;

drop trigger if exists trg_limpar_orfaos_discussion on public.discussions;
create trigger trg_limpar_orfaos_discussion
  after delete on public.discussions
  for each row execute function public.limpar_orfaos_do_alvo('discussion');

drop trigger if exists trg_limpar_orfaos_reply on public.discussion_replies;
create trigger trg_limpar_orfaos_reply
  after delete on public.discussion_replies
  for each row execute function public.limpar_orfaos_do_alvo('reply');

-- =====================================================================
-- A3. mentor_id pode divergir de tribe_members
-- =====================================================================
-- entrar_na_tribo_do_mentor() manteve mentor_id e tribe_members andando
-- juntos na entrada, mas sair da tribo pela UI (delete em tribe_members)
-- não desfazia o mentor_id correspondente. Só limpa quando o mentor
-- removido era justamente o líder da tribo da qual a linha saiu — sair de
-- uma tribo onde a pessoa é só shepherd não deve mexer no discipulado 1:1.
create or replace function public.limpar_mentor_ao_sair_da_tribo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  lider uuid;
begin
  select leader_id into lider from public.tribes where id = old.tribe_id;

  update public.profiles
     set mentor_id = null
   where id = old.user_id
     and mentor_id = lider;

  return old;
end;
$$;

drop trigger if exists trg_limpar_mentor_ao_sair on public.tribe_members;
create trigger trg_limpar_mentor_ao_sair
  after delete on public.tribe_members
  for each row execute function public.limpar_mentor_ao_sair_da_tribo();

-- =====================================================================
-- A5. Limpeza: tabelas órfãs criadas por engano em 20260904130000
-- =====================================================================
-- reading_plan_days/user_plan_progress foram criadas para dar suporte a
-- actions/plan.ts (plano único global) — mas esse arquivo nunca teve
-- nenhum importador. O sistema de jornada real, em produção desde janeiro,
-- é reading_plans/plan_days/user_active_plans (actions/plans.ts, plural).
-- Nenhuma linha real foi gravada nas tabelas órfãs — a migration que as
-- criou nunca chegou a produção. Uma migration nova desfaz em vez de
-- editar a anterior, para manter o histórico honesto.
drop table if exists public.reading_plan_days cascade;
drop table if exists public.user_plan_progress cascade;
