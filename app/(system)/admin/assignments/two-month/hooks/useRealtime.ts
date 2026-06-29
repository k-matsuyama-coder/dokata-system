import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function useRealtime(
  fetchData: () => void,
  baseMonth: string,
  organizationId: string | null
) {
  useEffect(() => {
    if (!organizationId) return;

    const channel = supabase
      .channel(`two-month-realtime-${organizationId}`)

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assignment_site_daily_infos",
          filter: `organization_id=eq.${organizationId}`,
        },
        fetchData
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assignments",
          filter: `organization_id=eq.${organizationId}`,
        },
        fetchData
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assignment_site_members",
          filter: `organization_id=eq.${organizationId}`,
        },
        fetchData
      )

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [baseMonth, organizationId, fetchData]);
}