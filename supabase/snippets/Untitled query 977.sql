create policy "Users can insert own history"
  on reading_history for insert
  with check ( auth.uid() = user_id );

create policy "Users can insert own annotations"
  on annotations for insert
  with check ( auth.uid() = user_id );

-- Policies de Update/Delete para anotações
create policy "Users can update own annotations"
  on annotations for update
  using ( auth.uid() = user_id );

create policy "Users can delete own annotations"
  on annotations for delete
  using ( auth.uid() = user_id );