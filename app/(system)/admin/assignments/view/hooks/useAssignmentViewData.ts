"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { createSignedUrlMap } from "@/lib/storageSignedUrls";

export function useAssignmentViewData({
  displayDates,
  date,
  viewMode,
}: Props) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [siteMembers, setSiteMembers] = useState<SiteMember[]>([]);
  const [dailyInfos, setDailyInfos] = useState<DailyInfo[]>([]);
  const [assignmentFiles, setAssignmentFiles] = useState<AssignmentFile[]>([]);
  const [groupSettings, setGroupSettings] = useState<AssignmentGroupSetting[]>(
    defaultGroupSettings()
  );

  const organizationIdRef = useRef<string | null>(null);
  const fetchDataRef = useRef<() => Promise<void>>(async () => {});

  const getCurrentOrganization = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) return null;

    const res = await fetch("/api/current-organization", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await res.json();

    if (!res.ok) return null;

    return result.organizationId as string | null;
  }, []);

  const fetchData = useCallback(async () => {
    const organizationId = await getCurrentOrganization();

    if (!organizationId) return;

    organizationIdRef.current = organizationId;

    const startDate = displayDates[0];
    const endDate = displayDates[displayDates.length - 1];

    const [groupResult, assignmentResult] = await Promise.all([
      supabase
        .from("assignment_groups")
        .select("id, group_key, display_name, is_enabled, sort_order, header_color")
        .eq("organization_id", organizationId)
        .order("sort_order", { ascending: true }),

      supabase
        .from("assignments")
        .select(`
          id,
          site_name,
          contractor_name,
          manager_name,
          contact_phone,
          address,
          meeting_time,
          shift_type,
          group_key
        `)
        .eq("organization_id", organizationId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
    ]);

    if (!groupResult.error && groupResult.data?.length) {
      setGroupSettings(groupResult.data as AssignmentGroupSetting[]);
    } else {
      setGroupSettings(defaultGroupSettings());
    }

    if (assignmentResult.error) return;

    const assignmentData = assignmentResult.data ?? [];
    const assignmentIds = assignmentData.map((a) => a.id);

    if (assignmentIds.length === 0) {
      setAssignments([]);
      setSiteMembers([]);
      setDailyInfos([]);
      setAssignmentFiles([]);
      return;
    }

    const [memberResult, dailyInfoResult, fileResult] = await Promise.all([
      supabase
        .from("assignment_site_members")
        .select(`
          id,
          assignment_id,
          work_date,
          employee_name,
          is_driver,
          is_operator,
          is_foreman,
          heavy_equipment
        `)
        .eq("organization_id", organizationId)
        .in("assignment_id", assignmentIds)
        .gte("work_date", startDate)
        .lte("work_date", endDate),

      supabase
        .from("assignment_site_daily_infos")
        .select(`
          id,
          assignment_id,
          work_date,
          planned_count,
          detail,
          vehicle_names
        `)
        .eq("organization_id", organizationId)
        .in("assignment_id", assignmentIds)
        .gte("work_date", startDate)
        .lte("work_date", endDate),

      supabase
        .from("assignment_files")
        .select("id, assignment_id, file_name, file_path")
        .eq("organization_id", organizationId)
        .in("assignment_id", assignmentIds),
    ]);

    if (memberResult.error || dailyInfoResult.error || fileResult.error) {
      return;
    }

    const files = fileResult.data ?? [];

    const signedUrlMap = await createSignedUrlMap(
      "assignment-files",
      files.map((file) => file.file_path)
    );

    const filesWithSignedUrls: AssignmentFile[] = files.map((file) => ({
      ...file,
      file_url: signedUrlMap[file.file_path] ?? "",
    }));

    setAssignments(assignmentData as Assignment[]);
    setSiteMembers((memberResult.data ?? []) as SiteMember[]);
    setDailyInfos((dailyInfoResult.data ?? []) as DailyInfo[]);
    setAssignmentFiles(filesWithSignedUrls);
  }, [displayDates, getCurrentOrganization]);

  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    void fetchDataRef.current();
  }, [date, viewMode]);

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtime = async () => {
      const organizationId =
        organizationIdRef.current ?? (await getCurrentOrganization());

      if (!organizationId || cancelled) return;

      organizationIdRef.current = organizationId;

      channel = supabase
        .channel(`assignment-view-realtime-${organizationId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "assignment_site_members",
            filter: `organization_id=eq.${organizationId}`,
          },
          () => void fetchDataRef.current()
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "assignment_site_daily_infos",
            filter: `organization_id=eq.${organizationId}`,
          },
          () => void fetchDataRef.current()
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "assignments",
            filter: `organization_id=eq.${organizationId}`,
          },
          () => void fetchDataRef.current()
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "assignment_groups",
            filter: `organization_id=eq.${organizationId}`,
          },
          () => void fetchDataRef.current()
        )
        .subscribe();
    };

    void setupRealtime();

    return () => {
      cancelled = true;

      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [getCurrentOrganization]);

  return {
    assignments,
    siteMembers,
    dailyInfos,
    assignmentFiles,
    groupSettings,
    fetchData,
  };
}