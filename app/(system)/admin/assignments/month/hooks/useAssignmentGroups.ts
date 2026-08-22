"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type {
  AssignmentGroupKey,
  AssignmentGroupSetting,
} from "../types";

type Props = {
  organizationId: string | null;
};

export function useAssignmentGroups({ organizationId }: Props) {
  const [groupSettings, setGroupSettings] = useState<AssignmentGroupSetting[]>([]);

  const fetchGroups = useCallback(async (targetOrganizationId: string) => {
    const { data, error } = await supabase
      .from("assignment_groups")
      .select(
        "id, organization_id, group_key, display_name, is_enabled, sort_order, header_color, daily_capacity"
      )
      .eq("organization_id", targetOrganizationId)
      .order("sort_order", { ascending: true });
  
    if (error) {
      throw error;
    }
  
    return (data ?? []) as AssignmentGroupSetting[];
  }, []);
  
  useEffect(() => {
    if (!organizationId) return;
  
    let cancelled = false;
  
    void fetchGroups(organizationId)
      .then((groups) => {
        if (!cancelled) {
          setGroupSettings(groups);
        }
      })
      .catch((error) => {
        console.error("assignment_groups fetch error", error);
      });
  
    return () => {
      cancelled = true;
    };
  }, [organizationId, fetchGroups]);

  const enabledGroups = useMemo(
    () => groupSettings.filter((group) => group.is_enabled),
    [groupSettings]
  );

  const groupNameMap = useMemo(() => {
    return new Map<AssignmentGroupKey, string>(
      groupSettings.map((group) => [group.group_key, group.display_name])
    );
  }, [groupSettings]);

  return {
    groupSettings,
    enabledGroups,
    groupNameMap,
  };
}