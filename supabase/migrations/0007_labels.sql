-- Labels table (per project)
CREATE TABLE IF NOT EXISTS public.labels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6366f1',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS labels_project_id_idx ON public.labels(project_id);

-- Ticket-label junction table
CREATE TABLE IF NOT EXISTS public.ticket_labels (
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  label_id uuid NOT NULL REFERENCES public.labels(id) ON DELETE CASCADE,
  PRIMARY KEY (ticket_id, label_id)
);

CREATE INDEX IF NOT EXISTS ticket_labels_ticket_id_idx ON public.ticket_labels(ticket_id);
CREATE INDEX IF NOT EXISTS ticket_labels_label_id_idx ON public.ticket_labels(label_id);

-- Enable RLS
ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_labels ENABLE ROW LEVEL SECURITY;

-- Labels policies
CREATE POLICY "labels_select" ON public.labels
  FOR SELECT USING (public.is_project_member(project_id));

CREATE POLICY "labels_insert" ON public.labels
  FOR INSERT WITH CHECK (public.my_project_role(project_id) IN ('admin', 'editor'));

CREATE POLICY "labels_update" ON public.labels
  FOR UPDATE USING (public.my_project_role(project_id) IN ('admin', 'editor'));

CREATE POLICY "labels_delete" ON public.labels
  FOR DELETE USING (public.my_project_role(project_id) = 'admin');

-- ticket_labels policies
CREATE POLICY "ticket_labels_select" ON public.ticket_labels
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_id AND public.is_project_member(t.project_id)
    )
  );

CREATE POLICY "ticket_labels_insert" ON public.ticket_labels
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_id
        AND public.my_project_role(t.project_id) IN ('admin', 'editor')
    )
  );

CREATE POLICY "ticket_labels_delete" ON public.ticket_labels
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_id
        AND public.my_project_role(t.project_id) IN ('admin', 'editor')
    )
  );
