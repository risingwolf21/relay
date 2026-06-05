-- Add canceled status
ALTER TYPE public.ticket_status ADD VALUE IF NOT EXISTS 'canceled';

-- Add project key (short uppercase identifier e.g. "REL")
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS key text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS ticket_counter integer NOT NULL DEFAULT 0;

-- Backfill key from project name (first 4 alphanumeric chars, uppercase)
UPDATE public.projects
SET key = UPPER(SUBSTRING(REGEXP_REPLACE(name, '[^a-zA-Z0-9]', '', 'g'), 1, 4))
WHERE key IS NULL;

-- Add number column to tickets (sequential per project)
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS number integer;

-- Backfill existing tickets with sequential numbers per project
WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at) AS n
  FROM public.tickets
)
UPDATE public.tickets t
SET number = r.n
FROM ranked r
WHERE t.id = r.id AND t.number IS NULL;

-- Update ticket_counter on projects to match current max
UPDATE public.projects p
SET ticket_counter = COALESCE((
  SELECT MAX(number) FROM public.tickets t WHERE t.project_id = p.id
), 0);

-- Trigger function: auto-assign ticket number on insert
CREATE OR REPLACE FUNCTION public.assign_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.projects
  SET ticket_counter = ticket_counter + 1
  WHERE id = NEW.project_id
  RETURNING ticket_counter INTO NEW.number;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tickets_assign_number ON public.tickets;
CREATE TRIGGER tickets_assign_number
  BEFORE INSERT ON public.tickets
  FOR EACH ROW
  WHEN (NEW.number IS NULL)
  EXECUTE FUNCTION public.assign_ticket_number();

-- Update create_project RPC to generate key automatically
CREATE OR REPLACE FUNCTION public.create_project(
  p_name text,
  p_description text,
  p_slug text
)
RETURNS public.projects
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project public.projects;
  v_key text;
BEGIN
  v_key := UPPER(SUBSTRING(REGEXP_REPLACE(p_name, '[^a-zA-Z0-9]', '', 'g'), 1, 4));
  IF v_key = '' THEN
    v_key := 'PROJ';
  END IF;
  INSERT INTO public.projects (name, description, slug, key, created_by)
  VALUES (p_name, p_description, p_slug, v_key, auth.uid())
  RETURNING * INTO v_project;
  RETURN v_project;
END;
$$;
