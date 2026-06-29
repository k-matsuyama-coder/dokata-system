import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function useRealtime(fetchData: () => void, baseMonth: string) {
  useEffect(() => {
    const channel = supabase
      .channel("two-month-realtime")

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assignment_site_daily_infos",
        },
        fetchData
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assignments",
        },
        fetchData
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assignment_site_members",
        },
        fetchData
      )

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [baseMonth]);
}