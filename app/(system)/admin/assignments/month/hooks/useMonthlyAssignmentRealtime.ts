// app/(system)/admin/assignments/month/hooks/useMonthlyAssignmentRealtime.ts

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  month: string;
  viewMode: "month" | "week";
  weekStart: string;
  fetchScheduleData: () => Promise<void>;
};

const REALTIME_FETCH_DEBOUNCE_MS = 500;

export function useMonthlyAssignmentRealtime({
  month,
  viewMode,
  weekStart,
  fetchScheduleData,
}: Props) {
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 常に最新のfetchScheduleDataを保持
  const fetchScheduleDataRef = useRef(fetchScheduleData);

  useEffect(() => {
    fetchScheduleDataRef.current = fetchScheduleData;
  }, [fetchScheduleData]);

  // Realtime購読はマウント時に1回だけ
  useEffect(() => {
    const scheduleFetch = () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }

      fetchTimeoutRef.current = setTimeout(() => {
        void fetchScheduleDataRef.current();
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
        fetchTimeoutRef.current = null;
      }

      void supabase.removeChannel(channel);
    };
  }, []);

  // 表示範囲が変わった時だけ取得
  useEffect(() => {
    void fetchScheduleDataRef.current();
  }, [month, viewMode, weekStart]);
}