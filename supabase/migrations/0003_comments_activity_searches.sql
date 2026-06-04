-- ─────────────────────────────────────────────────────────────
-- TICKET COMMENTS
-- ─────────────────────────────────────────────────────────────
create table public.ticket_comments (
  id         uuid        primary key default gen_random_uuid(),
  ticket_id  uuid        not null references public.tickets(id) on delete cascade,
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  content    text        not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ticket_comments_ticket_id_idx on public.ticket_comments(ticket_id);

-- ─────────────────────────────────────────────────────────────
-- TICKET ACTIVITY (change history log)
-- ─────────────────────────────────────────────────────────────
create table public.ticket_activity (
  id         uuid        primary key default gen_random_uuid(),
  ticket_id  uuid        not null references public.tickets(id) on delete cascade,
  user_id    uuid        references public.profiles(id) on delete set null,
  type       text        not null,  -- 'created' | 'status_changed' | 'priority_changed' | 'assigned' | 'title_changed'
  old_value  text,
  new_value  text,
  created_at timestamptz not null default now()
);

create index ticket_activity_ticket_id_idx on public.ticket_activity(ticket_id);

-- ─────────────────────────────────────────────────────────────
-- SAVED SEARCHES
-- ─────────────────────────────────────────────────────────────
create table public.saved_searches (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  name       text        not null,
  -- filters: { project_ids, statuses, priorities, assignee_me, text }
  filters    jsonb       not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index saved_searches_user_id_idx on public.saved_searches(user_id);

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────
alter table public.ticket_comments  enable row level security;
alter table public.ticket_activity  enable row level security;
alter table public.saved_searches   enable row level security;

-- Helper subquery: get project_id from a ticket (used in policies)
-- ticket_comments
create policy "ticket_comments: read by member"
  on public.ticket_comments for select
  to authenticated
  using (
    public.is_project_member(
      (select project_id from public.tickets where id = ticket_id limit 1)
    )
  );

create policy "ticket_comments: insert by member"
  on public.ticket_comments for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.is_project_member(
      (select project_id from public.tickets where id = ticket_id limit 1)
    )
  );

create policy "ticket_comments: update own"
  on public.ticket_comments for update
  to authenticated
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "ticket_comments: delete own or admin"
  on public.ticket_comments for delete
  to authenticated
  using (
    user_id = auth.uid()
    or public.my_project_role(
      (select project_id from public.tickets where id = ticket_id limit 1)
    ) = 'admin'
  );

-- ticket_activity: members can read; inserts come only from SECURITY DEFINER triggers
create policy "ticket_activity: read by member"
  on public.ticket_activity for select
  to authenticated
  using (
    public.is_project_member(
      (select project_id from public.tickets where id = ticket_id limit 1)
    )
  );

-- saved_searches: owner-only full access
create policy "saved_searches: owner"
  on public.saved_searches for all
  to authenticated
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- TRIGGERS — activity logging
-- ─────────────────────────────────────────────────────────────

-- Log "created" event when a ticket is inserted
create or replace function public.handle_ticket_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.ticket_activity (ticket_id, user_id, type)
  values (new.id, new.created_by, 'created');
  return new;
end;
$$;

create trigger on_ticket_created
  after insert on public.tickets
  for each row execute function public.handle_ticket_created();

-- Log field changes when a ticket is updated
create or replace function public.handle_ticket_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid;
begin
  v_actor := auth.uid();

  if new.status is distinct from old.status then
    insert into public.ticket_activity (ticket_id, user_id, type, old_value, new_value)
    values (new.id, v_actor, 'status_changed', old.status::text, new.status::text);
  end if;

  if new.priority is distinct from old.priority then
    insert into public.ticket_activity (ticket_id, user_id, type, old_value, new_value)
    values (new.id, v_actor, 'priority_changed', old.priority::text, new.priority::text);
  end if;

  if new.assignee_id is distinct from old.assignee_id then
    insert into public.ticket_activity (ticket_id, user_id, type, old_value, new_value)
    values (new.id, v_actor, 'assigned', old.assignee_id::text, new.assignee_id::text);
  end if;

  if new.title is distinct from old.title then
    insert into public.ticket_activity (ticket_id, user_id, type, old_value, new_value)
    values (new.id, v_actor, 'title_changed', old.title, new.title);
  end if;

  return new;
end;
$$;

create trigger on_ticket_updated
  after update on public.tickets
  for each row execute function public.handle_ticket_updated();

-- updated_at maintenance
create trigger ticket_comments_updated_at
  before update on public.ticket_comments
  for each row execute function public.handle_updated_at();

create trigger saved_searches_updated_at
  before update on public.saved_searches
  for each row execute function public.handle_updated_at();
