import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import type { Agent } from "@/lib/database.types";

export function useAgents() {
  return useQuery({
    queryKey: ["agents"],
    queryFn: async (): Promise<Agent[]> => {
      const { data, error } = await supabase.from("agents").select("*").order("agent_id");
      if (error) throw error;
      return data ?? [];
    },
  });
}
