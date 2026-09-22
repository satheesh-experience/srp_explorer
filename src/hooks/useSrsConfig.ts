import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import type { SrsConfigRow, ExclusiveGroup, ConnectionGroupCap } from "@/lib/database.types";

// Loads everything the scoring engine needs: the full config table plus
// the static exclusive groups and per-vertical connection caps.
export function useSrsConfig() {
  return useQuery({
    queryKey: ["srs_config_bundle"],
    queryFn: async () => {
      const [configRes, groupsRes, capsRes] = await Promise.all([
        supabase.from("srs_config").select("*"),
        supabase.from("exclusive_groups").select("*"),
        supabase.from("connection_group_caps").select("*"),
      ]);
      if (configRes.error) throw configRes.error;
      if (groupsRes.error) throw groupsRes.error;
      if (capsRes.error) throw capsRes.error;
      return {
        configRows: (configRes.data ?? []) as SrsConfigRow[],
        exclusiveGroups: (groupsRes.data ?? []) as ExclusiveGroup[],
        connectionCaps: (capsRes.data ?? []) as ConnectionGroupCap[],
      };
    },
  });
}
