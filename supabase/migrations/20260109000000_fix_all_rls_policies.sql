-- Migration to fix RLS for multiple tables
-- Ensuring INSERT policy is explicitly covered by adding 'WITH CHECK' or using 'FOR ALL' correctly.

-- 1. Reading History
alter table if exists public.reading_history enable row level security;
do $$ begin
    drop policy if exists "Users can crud own history" on reading_history;
    drop policy if exists "Users can read own history" on reading_history;
    create policy "Users can crud own history" on reading_history for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when others then null; end $$;

-- 2. Studies
alter table if exists public.studies enable row level security;
do $$ begin
    drop policy if exists "Users can crud own studies" on studies;
    create policy "Users can crud own studies" on studies for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when others then null; end $$;

-- 3. Annotations
alter table if exists public.annotations enable row level security;
do $$ begin
    drop policy if exists "Users can crud own annotations" on annotations;
    create policy "Users can crud own annotations" on annotations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when others then null; end $$;

-- 4. User Active Plans
alter table if exists public.user_active_plans enable row level security;
do $$ begin
    drop policy if exists "Users can crud own active plans" on user_active_plans;
    create policy "Users can crud own active plans" on user_active_plans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when others then null; end $$;
