// Hand-written types matching supabase/migrations/0001_schema.sql.
// Regenerate with `supabase gen types typescript` once your project is
// live if you want these kept perfectly in sync automatically.

export type Vertical = {
  vertical_id: number;
  vertical_name: string;
  header_id: number | null;
  header_name: string | null;
  header_score: number | null;
};

export type SrsConfigRow = {
  id: number;
  vertical_id: number;
  category_id: number;
  category_name: string;
  sub_category_id: number;
  sub_category_name: string;
  component_limit: number;
  points: number;
  no_of_days: number;
  total_score: number;
  is_per_item: boolean;
};

export type ExclusiveGroup = {
  group_key: string;
  group_label: string;
  category_key: string;
  group_type: "top_n" | "path_priority";
  cap: number | null;
  selection_kind: "exclusive" | "capped";
  explainer: string | null;
  full_marks_hint: string | null;
  paths: { path_key: string; path_label: string; members: string[] }[] | null;
  members: string[] | null;
};

export type ConnectionGroupCap = {
  id: number;
  vertical_id: number;
  connections_list: string[];
  srs_max_connections: number;
};

export type Agent = {
  agent_id: number;
  vertical_id: number;
};

export type AgentCategoryCompletion = {
  id: number;
  agent_id: number;
  vertical_id: number;
  category_name: string;
  completed: Record<string, number>;
};

export type AgentScoreHistory = {
  id: number;
  agent_id: number;
  category_name: string;
  sub_category_name: string;
  peak_score: number;
  peak_period: string | null;
};

export type AgentMonthlySnapshot = {
  agent_id: number;
  previous_month_score: number;
  month_label: string | null;
};

export type Profile = {
  user_id: string;
  role: "viewer" | "admin";
  full_name: string | null;
};

// Loose Database shape sufficient for supabase-js's generic client typing.
export type Database = {
  __InternalSupabase: { PostgrestVersion: string };
  public: {
    Tables: {
      verticals: { Row: Vertical; Insert: Partial<Vertical>; Update: Partial<Vertical>; Relationships: [] };
      srs_config: { Row: SrsConfigRow; Insert: Partial<SrsConfigRow>; Update: Partial<SrsConfigRow>; Relationships: [] };
      exclusive_groups: { Row: ExclusiveGroup; Insert: Partial<ExclusiveGroup>; Update: Partial<ExclusiveGroup>; Relationships: [] };
      connection_group_caps: { Row: ConnectionGroupCap; Insert: Partial<ConnectionGroupCap>; Update: Partial<ConnectionGroupCap>; Relationships: [] };
      agents: { Row: Agent; Insert: Partial<Agent>; Update: Partial<Agent>; Relationships: [] };
      agent_category_completions: { Row: AgentCategoryCompletion; Insert: Partial<AgentCategoryCompletion>; Update: Partial<AgentCategoryCompletion>; Relationships: [] };
      agent_score_history: { Row: AgentScoreHistory; Insert: Partial<AgentScoreHistory>; Update: Partial<AgentScoreHistory>; Relationships: [] };
      agent_monthly_snapshot: { Row: AgentMonthlySnapshot; Insert: Partial<AgentMonthlySnapshot>; Update: Partial<AgentMonthlySnapshot>; Relationships: [] };
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile>; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
