-- Migration to add language_code to dictionary_entries
alter table public.dictionary_entries 
add column if not exists language_code text default 'pt-BR';

-- Add an index for performance if we filter by language
create index if not exists idx_dictionary_language_code on public.dictionary_entries(language_code);
