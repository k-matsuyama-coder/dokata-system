import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function useRealtime(
  fetchData: () => void | Promise<void>,
  baseMonth: string,
  organizationId: string | null
) {
  useEffect(() => {
    if (!organizationId) return;

    let fetchTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleFetch = () => {
      if (fetchTimer) {
        clearTimeout(fetchTimer);
      }

      fetchTimer = setTimeout(() => {
        fetchTimer = null;
        void fetchData();
      }, 500);
    };

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
        scheduleFetch
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assignments",
          filter: `organization_id=eq.${organizationId}`,
        },
        scheduleFetch
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assignment_site_members",
          filter: `organization_id=eq.${organizationId}`,
        },
        scheduleFetch
      )
      .subscribe();

    return () => {
      if (fetchTimer) {
        clearTimeout(fetchTimer);
      }

      void supabase.removeChannel(channel);
    };
  }, [baseMonth, organizationId, fetchData]);
}