-- Dicionário deixa de depender de IA. Duas fontes, sem chamada a OpenAI:
--   Concordância — actions/bible.ts:searchVersesByTerm(), já existe, custo zero.
--   Verbete curado — dictionary_entries, escrito por gente, aprovado pela
--   liderança antes de virar público.
--
-- Os verbetes gerados por IA em produção hoje (source = 'ai_generated')
-- ficam: já estão no ar, já foram lidos, apagar seria destruir conteúdo
-- real por purismo. Ficam marcados como IA (a coluna `source` já existia
-- para isso) e como 'published' — não regride o que já era público.

-- =====================================================================
-- 1. status, autoria e enriquecimento do verbete
-- =====================================================================
alter table public.dictionary_entries
  add column if not exists status text not null default 'draft' check (status in ('draft', 'published')),
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists approved_by uuid references public.profiles(id) on delete set null,
  add column if not exists aliases text[] not null default '{}',
  add column if not exists sources jsonb not null default '[]'::jsonb;

-- Verbete novo, proposto pela UI, nasce 'manual' — só o cache antigo é IA.
alter table public.dictionary_entries alter column source set default 'manual';

-- O que já existia (manual ou ai_generated) já era público antes desta
-- migration existir; continua.
update public.dictionary_entries set status = 'published' where status = 'draft';

-- =====================================================================
-- 2. RLS: publicado é de todo mundo; rascunho é do autor e da liderança
-- =====================================================================
-- Nome curto de propósito: o nome antigo, mais descritivo, passava de 63
-- bytes e o Postgres truncava em silêncio — dois `create policy` com nomes
-- que truncam para o mesmo texto colidem.
drop policy if exists "Read dictionary" on public.dictionary_entries;
drop policy if exists "Vê publicado, o próprio rascunho, ou é liderança" on public.dictionary_entries;
create policy "Vê publicado, o próprio rascunho, ou é liderança"
  on public.dictionary_entries for select
  using (status = 'published' or created_by = auth.uid() or public.sou_lideranca());

drop policy if exists "Propõe um verbete" on public.dictionary_entries;
create policy "Propõe um verbete"
  on public.dictionary_entries for insert
  with check (created_by = auth.uid());

-- Autor edita o próprio rascunho (corrigir antes de ser aprovado). Depois de
-- publicado, o verbete não é mais dele para editar livremente — mudar o
-- texto de algo já aprovado é uma decisão da liderança, feita fora daqui.
drop policy if exists "Autor edita o próprio rascunho" on public.dictionary_entries;
create policy "Autor edita o próprio rascunho"
  on public.dictionary_entries for update
  using (created_by = auth.uid() and status = 'draft')
  with check (created_by = auth.uid() and status = 'draft');

drop policy if exists "Autor apaga o próprio rascunho" on public.dictionary_entries;
create policy "Autor apaga o próprio rascunho"
  on public.dictionary_entries for delete
  using (created_by = auth.uid() and status = 'draft');

-- Rejeitar o rascunho de outra pessoa é apagar, não é coluna privilegiada
-- como status/approved_by — dá para resolver com policy comum, sem função.
drop policy if exists "Liderança apaga qualquer rascunho" on public.dictionary_entries;
create policy "Liderança apaga qualquer rascunho"
  on public.dictionary_entries for delete
  using (status = 'draft' and public.sou_lideranca());

-- Mesma lição de talents_balance: status/approved_by nunca entram no grant
-- de coluna do cliente — nem para o autor, nem em tese para outro
-- authenticated qualquer. A única porta para publicar é a função abaixo,
-- que checa liderança por dentro (mesmo padrão de resolver_denuncia): GRANT
-- de coluna é por PAPEL inteiro, não dá para dizer "só se for liderança"
-- numa condição — isso só uma função pode decidir.
revoke insert, update, delete on public.dictionary_entries from anon, authenticated;
grant insert (term, definition, language_code, aliases, sources, created_by)
  on public.dictionary_entries to authenticated;
grant update (term, definition, language_code, aliases, sources)
  on public.dictionary_entries to authenticated;
grant delete on public.dictionary_entries to authenticated;

-- =====================================================================
-- 3. Aprovar — a liderança publica o rascunho
-- =====================================================================
-- Não é por tribo: o dicionário é um acervo só, compartilhado pelo app
-- inteiro (como o próprio texto bíblico), então "liderança" aqui é
-- sou_lideranca() — pastorear QUALQUER tribo já qualifica, do mesmo jeito
-- que qualifica para ver a fila de moderação.
create or replace function public.aprovar_verbete(entry_id int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.sou_lideranca() then
    raise exception 'Só a liderança pode aprovar verbetes';
  end if;

  update public.dictionary_entries
     set status = 'published', approved_by = auth.uid()
   where id = entry_id;
end;
$$;
