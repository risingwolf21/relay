-- ─────────────────────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────────────────────
create type public.project_role    as enum ('admin', 'editor', 'viewer');
create type public.ticket_status   as enum ('backlog', 'todo', 'in_progress', 'in_review', 'done');
create type public.ticket_priority as enum ('low', 'medium', 'high', 'urgent');

-- ─────────────────────────────────────────────────────────────
-- PROFILES (mirrors auth.users, auto-populated via trigger)
-- ─────────────────────────────────────────────────────────────
create table public.profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  email       text        not null,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- PROJECTS
-- ─────────────────────────────────────────────────────────────
create table public.projects (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  description text,
  slug        text        not null unique,
  created_by  uuid        not null references public.profiles(id) on delete restrict,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index projects_created_by_idx on public.projects(created_by);

-- ─────────────────────────────────────────────────────────────
-- PROJECT MEMBERS (RBAC junction table)
-- ─────────────────────────────────────────────────────────────
create table public.project_members (
  project_id  uuid         not null references public.projects(id) on delete cascade,
  user_id     uuid         not null references public.profiles(id) on delete cascade,
  role        project_role not null default 'viewer',
  invited_by  uuid         references public.profiles(id) on delete set null,
  joined_at   timestamptz  not null default now(),
  primary key (project_id, user_id)
);

create index project_members_user_id_idx on public.project_members(user_id);

-- ─────────────────────────────────────────────────────────────
-- TICKETS
-- ─────────────────────────────────────────────────────────────
create table public.tickets (
  id           uuid            primary key default gen_random_uuid(),
  project_id   uuid            not null references public.projects(id) on delete cascade,
  title        text            not null,
  description  text,
  status       ticket_status   not null default 'backlog',
  priority     ticket_priority not null default 'medium',
  assignee_id  uuid            references public.profiles(id) on delete set null,
  created_by   uuid            not null references public.profiles(id) on delete restrict,
  position     integer         not null default 0,
  created_at   timestamptz     not null default now(),
  updated_at   timestamptz     not null default now()
);

create index tickets_project_id_idx      on public.tickets(project_id);
create index tickets_assignee_id_idx     on public.tickets(assignee_id);
create index tickets_project_status_idx  on public.tickets(project_id, status, position);

-- ─────────────────────────────────────────────────────────────
-- HELPER FUNCTIONS (SECURITY DEFINER avoids RLS recursion)
-- ─────────────────────────────────────────────────────────────

create or replace function public.my_project_role(p_project_id uuid)
returns project_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from   public.project_members
  where  project_id = p_project_id
  and    user_id    = auth.uid();
$$;

create or replace function public.is_project_member(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from   public.project_members
    where  project_id = p_project_id
    and    user_id    = auth.uid()
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────

alter table public.profiles       enable row level security;
alter table public.projects       enable row level security;
alter table public.project_members enable row level security;
alter table public.tickets        enable row level security;

-- profiles
create policy "profiles: read by authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles: update own"
  on public.profiles for update
  to authenticated
  using  (id = auth.uid())
  with check (id = auth.uid());

-- projects
create policy "projects: read by member"
  on public.projects for select
  to authenticated
  using (public.is_project_member(id));

create policy "projects: create"
  on public.projects for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "projects: update by admin"
  on public.projects for update
  to authenticated
  using  (public.my_project_role(id) = 'admin')
  with check (public.my_project_role(id) = 'admin');

create policy "projects: delete by admin"
  on public.projects for delete
  to authenticated
  using (public.my_project_role(id) = 'admin');

-- project_members
create policy "project_members: read by member"
  on public.project_members for select
  to authenticated
  using (public.is_project_member(project_id));

create policy "project_members: invite by admin"
  on public.project_members for insert
  to authenticated
  with check (public.my_project_role(project_id) = 'admin');

create policy "project_members: update by admin"
  on public.project_members for update
  to authenticated
  using  (public.my_project_role(project_id) = 'admin')
  with check (public.my_project_role(project_id) = 'admin');

create policy "project_members: delete by admin or self"
  on public.project_members for delete
  to authenticated
  using (
    public.my_project_role(project_id) = 'admin'
    or user_id = auth.uid()
  );

-- tickets
create policy "tickets: read by member"
  on public.tickets for select
  to authenticated
  using (public.is_project_member(project_id));

create policy "tickets: create by admin or editor"
  on public.tickets for insert
  to authenticated
  with check (
    public.my_project_role(project_id) in ('admin', 'editor')
    and created_by = auth.uid()
  );

create policy "tickets: update by admin or editor"
  on public.tickets for update
  to authenticated
  using  (public.my_project_role(project_id) in ('admin', 'editor'))
  with check (public.my_project_role(project_id) in ('admin', 'editor'));

create policy "tickets: delete by admin"
  on public.tickets for delete
  to authenticated
  using (public.my_project_role(project_id) = 'admin');

-- ─────────────────────────────────────────────────────────────
-- TRIGGERS
-- ─────────────────────────────────────────────────────────────

-- Auto-create profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-add project creator as admin
create or replace function public.handle_new_project()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.project_members (project_id, user_id, role, invited_by)
  values (new.id, new.created_by, 'admin', new.created_by);
  return new;
end;
$$;

create trigger on_project_created
  after insert on public.projects
  for each row execute function public.handle_new_project();

-- Keep updated_at current
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.handle_updated_at();

create trigger tickets_updated_at
  before update on public.tickets
  for each row execute function public.handle_updated_at();
