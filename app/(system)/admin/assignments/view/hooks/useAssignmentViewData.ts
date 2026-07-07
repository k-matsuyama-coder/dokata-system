"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type AssignmentGroupKey =
  | "group1"
  | "group2"
  | "group3"
  | "group4"
  | "group5";

export type AssignmentGroupSetting = {
  id: string;
  group_key: AssignmentGroupKey;
  display_name: string;
  is_enabled: boolean;
  sort_order: number;
  header_color: string | null;
};

export type Assignment = {
  id: string;
  site_name: string | null;
  contractor_name: string | null;
  manager_name: string | null;
  contact_phone: string | null;
  address: string | null;
  meeting_time: string | null;
  shift_type: string | null;
  group_key: AssignmentGroupKey | null;
};

export type SiteMember = {
  id: string;
  assignment_id: string;
  work_date: string;
  employee_name: string;
  is_driver: boolean | null;
  is_operator: boolean | null;
  heavy_equipment: string | null;
  is_foreman: boolean | null;
};

export type DailyInfo = {
  id: string;
  assignment_id: string;
  work_date: string;
  planned_count: number | null;
  detail: string | null;
  vehicle_names: string[] | null;
};

export type AssignmentFile = {
  id: string;
  assignment_id: string;
  file_name: string;
  file_url: string;
};

function defaultGroupSettings(): AssignmentGroupSetting[] {
  return [
    {
      id: "group1",
      group_key: "group1",
      display_name: "グループ①",
      is_enabled: true,
      sort_order: 0,
      header_color: "#e5e7eb",
    },
    {
      id: "group2",
      group_key: "group2",
      display_name: "グループ②",
      is_enabled: true,
      sort_order: 1,
      header_color: "#dbeafe",
    },
    {
      id: "group3",
      group_key: "group3",
      display_name: "グループ③",
      is_enabled: false,
      sort_order: 2,
      header_color: "#dcfce7",
    },
    {
      id: "group4",
      group_key: "group4",
      display_name: "グループ④",
      is_enabled: false,
      sort_order: 3,
      header_color: "#fef3c7",
    },
    {
      id: "group5",
      group_key: "group5",
      display_name: "グループ⑤",
      is_enabled: false,
      sort_order: 4,
      header_color: "#fce7f3",
    },
  ];
}

type Props = {
  displayDates: string[];
  date: string;
  viewMode: "day" | "3days" | "week";
};

export function useAssignmentViewData({ displayDates, date, viewMode }: Props) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [siteMembers, setSiteMembers] = useState<SiteMember[]>([]);
  const [dailyInfos, setDailyInfos] = useState<DailyInfo[]>([]);
  const [assignmentFiles, setAssignmentFiles] = useState<AssignmentFile[]>([]);
  const [groupSettings, setGroupSettings] = useState<AssignmentGroupSetting[]>(
    defaultGroupSettings()
  );

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

    if (!organizationId) {
      alert("会社情報が取得できません");
      return;
    }

    const { data: groupData, error: groupError } = await supabase
      .from("assignment_groups")
      .select("id, group_key, display_name, is_enabled, sort_order, header_color")
      .eq("organization_id", organizationId)
      .order("sort_order", { ascending: true });

    if (!groupError && groupData && groupData.length > 0) {
      setGroupSettings(groupData as AssignmentGroupSetting[]);
    } else {
      setGroupSettings(defaultGroupSettings());
    }

    const { data: assignmentData, error: assignmentError } = await supabase
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
      .order("created_at", { ascending: true });

    if (assignmentError) {
      alert("現場取得失敗: " + assignmentError.message);
      return;
    }

    const assignmentIds = assignmentData?.map((assignment) => assignment.id) ?? [];

    if (assignmentIds.length === 0) {
      setAssignments([]);
      setSiteMembers([]);
      setDailyInfos([]);
      setAssignmentFiles([]);
      return;
    }

    const { data: memberData, error: memberError } = await supabase
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
      .gte("work_date", displayDates[0])
      .lte("work_date", displayDates[displayDates.length - 1]);

    if (memberError) {
      alert("メンバー取得失敗: " + memberError.message);
      return;
    }

    const { data: dailyInfoData, error: dailyInfoError } = await supabase
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
      .gte("work_date", displayDates[0])
      .lte("work_date", displayDates[displayDates.length - 1]);

    if (dailyInfoError) {
      alert("日別情報取得失敗: " + dailyInfoError.message);
      return;
    }

    const { data: fileData, error: fileError } = await supabase
      .from("assignment_files")
      .select(`
        id,
        assignment_id,
        file_name,
        file_url
      `)
      .eq("organization_id", organizationId)
      .in("assignment_id", assignmentIds);

    if (fileError) {
      alert("添付ファイル取得失敗: " + fileError.message);
      return;
    }

    setAssignments((assignmentData ?? []) as Assignment[]);
    setSiteMembers((memberData ?? []) as SiteMember[]);
    setDailyInfos((dailyInfoData ?? []) as DailyInfo[]);
    setAssignmentFiles((fileData ?? []) as AssignmentFile[]);
  }, [displayDates, getCurrentOrganization]);

  useEffect(() => {
    void fetchData();
  }, [fetchData, date, viewMode]);

  useEffect(() => {
    const channel = supabase
      .channel("assignment-view-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assignment_site_members" },
        () => void fetchData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assignment_site_daily_infos" },
        () => void fetchData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assignments" },
        () => void fetchData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assignment_groups" },
        () => void fetchData()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchData, date, viewMode]);

  return {
    assignments,
    siteMembers,
    dailyInfos,
    assignmentFiles,
    groupSettings,
    fetchData,
  };
}