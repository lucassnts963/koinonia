-- Migration Corretiva para Knowledge Links
-- Objetivo: Garantir colunas source/target padronizadas

-- 1. Verificar e renomear colunas antigas se existirem (Fallback comum)
do $$
begin
  if exists(select 1 from information_schema.columns where table_name='knowledge_links' and column_name='verse_from') then
    alter table knowledge_links rename column verse_from to source;
  end if;

  if exists(select 1 from information_schema.columns where table_name='knowledge_links' and column_name='verse_to') then
    alter table knowledge_links rename column verse_to to target;
  end if;
end $$;

-- 2. Garantir que as colunas existam (Se tabela foi criada do zero errada)
alter table knowledge_links add column if not exists source text;
alter table knowledge_links add column if not exists target text;
alter table knowledge_links add column if not exists type text default 'related';
alter table knowledge_links add column if not exists user_id uuid references auth.users;

-- 3. Atualizar Constraints se necessário (Opcional para performance)
-- create index if not exists idx_knowledge_links_source on knowledge_links(source);
-- create index if not exists idx_knowledge_links_target on knowledge_links(target);

-- 4. Agora sim, rodar o Seed de Teste (incorporado para facilitar)
DO $$
DECLARE
    target_user_id uuid;
BEGIN
    SELECT id INTO target_user_id FROM auth.users ORDER BY created_at DESC LIMIT 1;
    
    IF target_user_id IS NOT NULL THEN
        -- Seed Annotations - Usando IF NOT EXISTS via conflito
        -- Assumindo que annotations tem unique(user_id, book_slug, chapter, verse) ou apenas insert safe
        begin
            INSERT INTO public.annotations (user_id, book_slug, chapter, verse, content) VALUES
            (target_user_id, 'gn', 1, 1, 'Mente criadora.'),
            (target_user_id, 'jo', 1, 1, 'Logos divino.')
            on conflict do nothing; 
        exception when others then null; -- Ignora erros de constraint se schema for diferente
        end;

        -- Seed Links
        INSERT INTO public.knowledge_links (user_id, source, target, type) VALUES
        (target_user_id, 'gn-1-1', 'jo-1-1', 'theology')
        ON CONFLICT DO NOTHING; -- Se tiver constraint unique
        
    END IF;
END $$;
