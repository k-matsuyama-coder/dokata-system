import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  month: string;
  viewMode: "month" | "week";
  weekStart: string;
  fetchData: () => Promise<void>;
};

export function useMonthlyAssignmentRealtime({
  month,
  viewMode,
  weekStart,
  fetchData,
}: Props) {
  useEffect(() => {
    const channel = supabase
      .channel("monthly-assignments-realtime")

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assignment_site_members",
        },
        fetchData
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shift_requests",
        },
        fetchData
      )

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

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [month, viewMode, weekStart, fetchData]);
}