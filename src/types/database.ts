export type ProjectRole = 'admin' | 'editor' | 'viewer'
export type TicketStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

// ─────────────────────────────────────────────────────────────
// Raw DB row types (used inside the Database type — no joins)
// ─────────────────────────────────────────────────────────────

export type ProfileRow = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type ProjectRow = {
  id: string
  name: string
  description: string | null
  slug: string
  created_by: string
  created_at: string
  updated_at: string
}

export type ProjectMemberRow = {
  project_id: string
  user_id: string
  role: ProjectRole
  invited_by: string | null
  joined_at: string
}

export type TicketRow = {
  id: string
  project_id: string
  title: string
  description: string | null
  status: TicketStatus
  priority: TicketPriority
  assignee_id: string | null
  created_by: string
  position: number
  created_at: string
  updated_at: string
}

// ─────────────────────────────────────────────────────────────
// App-level types (may include joined relations)
// ─────────────────────────────────────────────────────────────

export type Profile = ProfileRow

export type Project = ProjectRow

export type ProjectMember = ProjectMemberRow & {
  profile?: Profile
}

export type Ticket = TicketRow & {
  assignee?: Profile | null
  creator?: Profile | null
}

// ─────────────────────────────────────────────────────────────
// Supabase Database type — matches the shape expected by createClient<Database>
// ─────────────────────────────────────────────────────────────

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
        Relationships: {
          foreignKeyName: string
          columns: string[]
          isOneToOne?: boolean
          referencedRelation: string
          referencedColumns: string[]
        }[]
      }
      projects: {
        Row: ProjectRow
        Insert: {
          id?: string
          name: string
          description?: string | null
          slug: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: {
          foreignKeyName: string
          columns: string[]
          isOneToOne?: boolean
          referencedRelation: string
          referencedColumns: string[]
        }[]
      }
      project_members: {
        Row: ProjectMemberRow
        Insert: {
          project_id: string
          user_id: string
          role?: ProjectRole
          invited_by?: string | null
          joined_at?: string
        }
        Update: {
          role?: ProjectRole
        }
        Relationships: {
          foreignKeyName: string
          columns: string[]
          isOneToOne?: boolean
          referencedRelation: string
          referencedColumns: string[]
        }[]
      }
      tickets: {
        Row: TicketRow
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string | null
          status?: TicketStatus
          priority?: TicketPriority
          assignee_id?: string | null
          created_by: string
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          status?: TicketStatus
          priority?: TicketPriority
          assignee_id?: string | null
          position?: number
          updated_at?: string
        }
        Relationships: {
          foreignKeyName: string
          columns: string[]
          isOneToOne?: boolean
          referencedRelation: string
          referencedColumns: string[]
        }[]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_project: {
        Args: { p_name: string; p_description: string | null; p_slug: string }
        Returns: ProjectRow
      }
    }
    Enums: {
      project_role: ProjectRole
      ticket_status: TicketStatus
      ticket_priority: TicketPriority
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
