-- Add due_date, recurrence_frequency, and parent_ticket_id to tickets
alter table public.tickets
  add column if not exists due_date date,
  add column if not exists recurrence_frequency text check (
    recurrence_frequency in ('daily', 'weekly', 'biweekly', 'monthly')
  ),
  add column if not exists parent_ticket_id uuid references public.tickets(id) on delete set null;

create index if not exists tickets_parent_ticket_id on public.tickets(parent_ticket_id);
create index if not exists tickets_due_date on public.tickets(due_date);
