"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type {
  AssignmentGroupKey,
  AssignmentGroupSetting,
} from "../types";

export function useAssignmentGroups() {
  const [groupSettings, setGroupSettings] = useState<AssignmentGroupSetting[]>([]);

  useEffect(() => {
    void fetchGroups();
  }, []);

  const fetchGroups = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) return;

    const res = await fetch("/api/current-organization", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await res.json();

    if (!res.ok || !result.organizationId) {
      return;
    }

    const { data, error } = await supabase
      .from("assignment_groups")
      .select("id, organization_id, group_key, display_name, is_enabled, sort_order, header_color")
      .eq("organization_id", result.organizationId)
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