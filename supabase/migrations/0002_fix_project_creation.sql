-- Drop the trigger-based approach that caused RLS deadlock:
-- The handle_new_project trigger ran as SECURITY DEFINER but the
-- project_members INSERT policy still called my_project_role(), which
-- returned NULL (no members exist yet), causing the transaction to
-- roll back with an RLS violation reported on the projects table.
drop trigger if exists on_project_created on public.projects;
drop function if exists public.handle_new_project();

-- Atomic RPC: inserts the project and adds the creator as admin in one
-- transaction. SECURITY DEFINER runs as the function owner (postgres,
-- which has BYPASSRLS) so both inserts succeed without policy checks,
-- while auth.uid() still resolves from the caller's JWT.
create or replace function public.create_project(
  p_name        text,
  p_description text,
  p_slug        text
)
returns public.projects
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project public.projects;
begin
  insert into public.projects (name, description, slug, created_by)
  values (p_name, p_description, p_slug, auth.uid())
  returning * into v_project;

  insert into public.project_members (project_id, user_id, role, invited_by)
  values (v_project.id, auth.uid(), 'admin', auth.uid());

  return v_project;
end;
$$;

grant execute on function public.create_project(text, text, text) to authenticated;
