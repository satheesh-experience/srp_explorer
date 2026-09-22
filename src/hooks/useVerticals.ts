import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import type { Vertical } from "@/lib/database.types";

export function useVerticals() {
  return useQuery({
    queryKey: ["verticals"],
    queryFn: async (): Promise<Vertical[]> => {
      const { data, error } = await supabase.from("verticals").select("*").order("vertical_name");
      if (error) throw error;
      return data ?? [];
    },
  });
}
