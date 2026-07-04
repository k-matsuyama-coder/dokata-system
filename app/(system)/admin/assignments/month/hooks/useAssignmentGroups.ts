"use client";

import { useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    if (!organizationId) {
      setGroupSettings([]);
      return;
    }

    void fetchGroups(organizationId);
  }, [organizationId]);

  const fetchGroups = async (targetOrganizationId: string) => {
    const { data, error } = await supabase
      .from("assignment_groups")
      .select(
        "id, organization_id, group_key, display_name, is_enabled, sort_order, header_color"
      )
      .eq("organization_id", targetOrganizationId)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("assignment_groups fetch error", error);
      return;
    }

    setGroupSettings((data ?? []) as AssignmentGroupSetting[]);
  };

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
    fetchGroups,
  };
}