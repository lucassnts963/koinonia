-- Migration RADICAL para simplificar Knowledge Links
-- O Schema atual usa source_type + source_id. O código novo espera 'source' e 'target' (strings únicas).
-- Vamos converter a tabela para o formato novo.

-- 1. Backup dos dados antigos (Se houver algo importante, joga numa temp)
create table if not exists knowledge_links_backup as select * from knowledge_links;

-- 2. Limpar a tabela para alterar estrutura (MVP approach - data loss ok se for dados de dev)
truncate table knowledge_links;

-- 3. Dropar colunas complexas antigas
alter table knowledge_links drop column source_type;
alter table knowledge_links drop column source_id;
alter table knowledge_links drop column target_type;
alter table knowledge_links drop column target_id;
alter table knowledge_links drop column connection_type;
-- created_by parece duplicar user_id

-- 4. Adicionar colunas novas simplificadas
alter table knowledge_links add column source text not null; -- ex: 'gn-1-1' ou 'study-123'
alter table knowledge_links add column target text not null; -- ex: 'jo-3-16'
alter table knowledge_links add column type text default 'related'; -- ex: 'theology', 'reference'

-- Garantir que user_id fique
-- alter table knowledge_links add column user_id uuid references auth.users; (já existe)

-- 5. Recriar Indices (Opcional)
create index if not exists idx_kl_source on knowledge_links(source);
create index if not exists idx_kl_target on knowledge_links(target);
create index if not exists idx_kl_user on knowledge_links(user_id);

-- 6. Rodar o SEED novamente
DO $$
DECLARE
    target_user_id uuid;
BEGIN
    SELECT id INTO target_user_id FROM auth.users ORDER BY created_at DESC LIMIT 1;
    
    IF target_user_id IS NOT NULL THEN
        -- Seed Annotations (Gera nós)
        INSERT INTO public.annotations (user_id, book_slug, chapter, verse, content) VALUES
        (target_user_id, 'gn', 1, 1, 'Mente criadora.'),
        (target_user_id, 'jo', 1, 1, 'Logos divino.')
        ON CONFLICT DO NOTHING;

        -- Seed Links (Gera arestas)
        INSERT INTO public.knowledge_links (user_id, source, target, type) VALUES
        (target_user_id, 'gn-1-1', 'jo-1-1', 'theology'),
        (target_user_id, 'gn-1-26', 'cl-1-15', 'theology'), -- Imago Dei
        (target_user_id, 'jo-3-16', 'rm-5-8', 'theme_love')  -- Amor
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Schema da Teia corrigido e dados inseridos!';
    END IF;
END $$;
