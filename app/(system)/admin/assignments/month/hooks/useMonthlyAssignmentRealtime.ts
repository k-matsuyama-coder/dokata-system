// app/(system)/admin/assignments/month/hooks/useMonthlyAssignmentRealtime.ts
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  month: string;
  viewMode: "month" | "week";
  weekStart: string;
  fetchData: () => Promise<void>;
};

const REALTIME_FETCH_DEBOUNCE_MS = 300;

export function useMonthlyAssignmentRealtime({
  month,
  viewMode,
  weekStart,
  fetchData,
}: Props) {
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const scheduleFetch = () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }

      fetchTimeoutRef.current = setTimeout(() => {
        void fetchData();
      }, REALTIME_FETCH_DEBOUNCE_MS);
    };

    const channel = supabase
      .channel("monthly-assignments-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assignment_site_members",
        },
        scheduleFetch
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shift_requests",
        },
        scheduleFetch
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assignment_site_daily_infos",
        },
        scheduleFetch
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assignments",
        },
        scheduleFetch
      )
      .subscribe();

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }

      void supabase.removeChannel(channel);
    };
  }, [fetchData]);

  useEffect(() => {
    void fetchData();
  }, [month, viewMode, weekStart, fetchData]);
}