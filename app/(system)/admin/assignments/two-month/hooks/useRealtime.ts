import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { DailyInfo } from "../types";

type SetDailyInfos = React.Dispatch<
  React.SetStateAction<DailyInfo[]>
>;

export function useRealtime(
  fetchData: () => void | Promise<void>,
  baseMonth: string,
  organizationId: string | null,
  setDailyInfos: SetDailyInfos
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
        (payload) => {
          if (payload.eventType === "DELETE") {
            const deletedRow = payload.old as {
              id?: string;
            };

            if (!deletedRow.id) {
              scheduleFetch();
              return;
            }

            setDailyInfos((prev) =>
              prev.filter((row) => row.id !== deletedRow.id)
            );
            return;
          }

          const changedRow =
            payload.new as unknown as DailyInfo;

          if (
            !changedRow.id ||
            !changedRow.assignment_id ||
            !changedRow.work_date
          ) {
            scheduleFetch();
            return;
          }

          setDailyInfos((prev) => {
            const index = prev.findIndex(
              (row) => row.id === changedRow.id
            );

            if (index === -1) {
              return [...prev, changedRow];
            }

            const current = prev[index];

            if (
              current.planned_count === changedRow.planned_count &&
              current.detail === changedRow.detail &&
              current.memo === changedRow.memo &&
              current.assignment_id === changedRow.assignment_id &&
              current.work_date === changedRow.work_date
            ) {
              return prev;
            }

            const next = [...prev];
            next[index] = changedRow;
            return next;
          });
        }
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
  }, [
    baseMonth,
    organizationId,
    fetchData,
    setDailyInfos,
  ]);
}