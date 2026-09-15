-- bible_books nunca recebeu RLS em nenhuma migration, ao contrário de
-- bible_versions/bible_verses/bible_book_names, que ganharam em
-- 20260904140000. Achado pelo advisor de segurança do Supabase MCP ao
-- inspecionar o projeto de produção antes de aplicar as migrations
-- pendentes: sem RLS, `anon`/`authenticated` podem ler OU ESCREVER
-- qualquer linha via REST — os grants padrão do Supabase concedem CRUD a
-- esses papéis em toda tabela do schema public, a menos que RLS ou GRANT
-- de coluna diga o contrário (é a mesma classe de buraco que
-- profiles.talents_balance tinha).
--
-- É referência canônica, pública por natureza (os 66 livros da Bíblia não
-- são segredo) — a policy é leitura livre, escrita só por service_role
-- (o seed), do mesmo jeito que bible_book_names já funciona.
alter table public.bible_books enable row level security;

drop policy if exists "Livros da Bíblia são públicos" on public.bible_books;
create policy "Livros da Bíblia são públicos"
  on public.bible_books for select
  using ( true );
