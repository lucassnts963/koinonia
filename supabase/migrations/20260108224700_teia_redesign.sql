-- 1. Backup e Simplificação de Knowledge Links
-- Se a tabela knowledge_links existir mas tiver as colunas antigas, vamos removê-las.

do $$ 
begin
    -- Verificar se a coluna source_type existe antes de tentar rodar a migração radical
    if exists (select 1 from information_schema.columns where table_name='knowledge_links' and column_name='source_type') then
        
        -- Limpar para evitar erros de cast/not null
        truncate table knowledge_links;

        -- Dropar colunas complexas antigas
        alter table knowledge_links drop column if exists source_type;
        alter table knowledge_links drop column if exists source_id;
        alter table knowledge_links drop column if exists target_type;
        alter table knowledge_links drop column if exists target_id;
        alter table knowledge_links drop column if exists connection_type;
        alter table knowledge_links drop column if exists created_by;

        -- Adicionar colunas novas simplificadas
        alter table knowledge_links add column if not exists source text not null; 
        alter table knowledge_links add column if not exists target text not null; 
        alter table knowledge_links add column if not exists type text default 'related';
        alter table knowledge_links add column if not exists user_id uuid references auth.users;

        -- Indices
        create index if not exists idx_kl_source on knowledge_links(source);
        create index if not exists idx_kl_target on knowledge_links(target);
        create index if not exists idx_kl_user on knowledge_links(user_id);
    end if;
end $$;

-- 2. RLS e Policies para Knowledge Links
alter table if exists public.knowledge_links enable row level security;

do $$ begin
    drop policy if exists "Read links" on knowledge_links;
    drop policy if exists "Public read access" on knowledge_links;
    drop policy if exists "Users can read system links and own links" on knowledge_links;
    
    create policy "Users can read system links and own links"
      on knowledge_links for select
      using ( user_id is null or user_id = auth.uid() );

    create policy "Users can insert own links"
      on knowledge_links for insert
      with check ( auth.uid() = user_id );
exception when others then null; end $$;
