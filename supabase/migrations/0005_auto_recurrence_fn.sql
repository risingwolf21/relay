-- Returns the number of new tickets created.
-- Called daily by pg_cron (job: create-pending-recurrences).
-- Finds every recurring ticket that is past due and has no child yet,
-- then inserts the next occurrence into backlog.
create or replace function public.create_pending_recurrences()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  rec           record;
  next_due      date;
  new_position  integer;
  created_count integer := 0;
begin
  for rec in
    select t.*
    from public.tickets t
    where t.recurrence_frequency is not null
      and t.due_date is not null
      and t.due_date <= current_date
      and not exists (
        select 1 from public.tickets child
        where child.parent_ticket_id = t.id
      )
  loop
    next_due := case rec.recurrence_frequency
      when 'daily'    then rec.due_date + interval '1 day'
      when 'weekly'   then rec.due_date + interval '7 days'
      when 'biweekly' then rec.due_date + interval '14 days'
      when 'monthly'  then rec.due_date + interval '1 month'
    end;

    select coalesce(max(position) + 1, 0)
    into new_position
    from public.tickets
    where project_id = rec.project_id
      and status = 'backlog';

    insert into public.tickets (
      project_id, title, description, status, priority,
      assignee_id, due_date, recurrence_frequency,
      parent_ticket_id, created_by, position
    ) values (
      rec.project_id, rec.title, rec.description, 'backlog', rec.priority,
      rec.assignee_id, next_due, rec.recurrence_frequency,
      rec.id, rec.created_by, new_position
    );

    created_count := created_count + 1;
  end loop;

  return created_count;
end;
$$;

-- Schedule via pg_cron: daily at 06:00 UTC.
-- Unschedule first so re-running the migration is idempotent.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'create-pending-recurrences') then
    perform cron.unschedule('create-pending-recurrences');
  end if;
end;
$$;

select cron.schedule(
  'create-pending-recurrences',
  '0 6 * * *',
  $$select public.create_pending_recurrences()$$
);
