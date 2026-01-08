-- 1. Adiciona a coluna se ela estiver faltando
ALTER TABLE dictionary_entries 
ADD COLUMN IF NOT EXISTS language_code text DEFAULT 'pt-BR';

-- 2. Força o Supabase a recarregar o cache da estrutura do banco
NOTIFY pgrst, 'reload config';