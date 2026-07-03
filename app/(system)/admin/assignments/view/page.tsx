"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";
import { getDateAccentColors } from "@/app/(system)/admin/assignments/month/utils/dateColors";

type AssignmentGroupKey =
  | "group1"
  | "group2"
  | "group3"
  | "group4"
  | "group5";

type AssignmentGroupSetting = {
  id: string;
  group_key: AssignmentGroupKey;
  display_name: string;
  is_enabled: boolean;
  sort_order: number;
  header_color: string | null;
};

type Assignment = {
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

type SiteMember = {
  id: string;
  assignment_id: string;
  work_date: string;
  employee_name: string;
  is_driver: boolean | null;
  is_operator: boolean | null;
  heavy_equipment: string | null;
  is_foreman: boolean | null;
};

type DailyInfo = {
  id: string;
  assignment_id: string;
  work_date: string;
  planned_count: number | null;
  detail: string | null;
  vehicle_names: string[] | null;
};

type FilterMode = "all" | AssignmentGroupKey;

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

export default function AssignmentViewPage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [siteMembers, setSiteMembers] = useState<SiteMember[]>([]);
  const [dailyInfos, setDailyInfos] = useState<DailyInfo[]>([]);
  const [viewMode, setViewMode] = useState<"day" | "3days" | "week">("day");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [groupSettings, setGroupSettings] = useState<AssignmentGroupSetting[]>(
    defaultGroupSettings()
  );

  const pdfRef = useRef<HTMLDivElement>(null);

  const enabledGroups = useMemo(() => {
    return [...groupSettings]
      .filter((group) => group.is_enabled)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [groupSettings]);

  const groupNameMap = useMemo(() => {
    return new Map(
      groupSettings.map((group) => [group.group_key, group.display_name])
    );
  }, [groupSettings]);

  const getDisplayDates = () => {
    if (viewMode === "3days") {
      return Array.from({ length: 3 }, (_, index) => {
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + index);
        return nextDate.toISOString().slice(0, 10);
      });
    }

    if (viewMode === "week") {
      const start = new Date(date);
      const day = start.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      start.setDate(start.getDate() + diffToMonday);

      return Array.from({ length: 7 }, (_, index) => {
        const nextDate = new Date(start);
        nextDate.setDate(start.getDate() + index);
        return nextDate.toISOString().slice(0, 10);
      });
    }

    return [date];
  };

  const getCurrentOrganization = async () => {
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
  };

  const fetchData = async () => {
    const organizationId = await getCurrentOrganization();

    if (!organizationId) {
      alert("会社情報が取得できません");
      return;
    }

    const displayDates = getDisplayDates();
    const startDate = displayDates[0];
    const endDate = displayDates[displayDates.length - 1];

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
      .gte("work_date", startDate)
      .lte("work_date", endDate);

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
      .gte("work_date", startDate)
      .lte("work_date", endDate);

    if (dailyInfoError) {
      alert("日別情報取得失敗: " + dailyInfoError.message);
      return;
    }

    setAssignments((assignmentData ?? []) as Assignment[]);
    setSiteMembers((memberData ?? []) as SiteMember[]);
    setDailyInfos((dailyInfoData ?? []) as DailyInfo[]);
  };

  useEffect(() => {
    void fetchData();
  }, [date, viewMode]);

  useEffect(() => {
    const channel = supabase
      .channel("assignment-view-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assignment_site_members",
        },
        () => {
          void fetchData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assignment_site_daily_infos",
        },
        () => {
          void fetchData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assignments",
        },
        () => {
          void fetchData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assignment_groups",
        },
        () => {
          void fetchData();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [date, viewMode]);

  const getMembers = (assignmentId: string, workDate: string) => {
    return siteMembers.filter(
      (member) =>
        member.assignment_id === assignmentId && member.work_date === workDate
    );
  };

  const getDailyInfo = (assignmentId: string, workDate: string) => {
    return dailyInfos.find(
      (dailyInfo) =>
        dailyInfo.assignment_id === assignmentId && dailyInfo.work_date === workDate
    );
  };

  const matchesGroupFilter = (assignment: Assignment) => {
    if (filterMode === "all") return true;
    return (assignment.group_key ?? "group1") === filterMode;
  };

  const filteredAssignments = assignments.filter(matchesGroupFilter);

  const visibleAssignments = filteredAssignments.filter((assignment) => {
    const displayDates = getDisplayDates();

    return displayDates.some((workDate) => {
      const members = getMembers(assignment.id, workDate);
      const dailyInfo = getDailyInfo(assignment.id, workDate);

      return (
        members.length > 0 ||
        (dailyInfo?.planned_count ?? 0) > 0 ||
        Boolean(dailyInfo?.detail) ||
        Boolean(dailyInfo?.vehicle_names?.length)
      );
    });
  });

  const groupedVisibleAssignments = enabledGroups
    .map((group) => ({
      ...group,
      rows: visibleAssignments.filter(
        (assignment) => (assignment.group_key ?? "group1") === group.group_key
      ),
    }))
    .filter((group) => group.rows.length > 0);

  const moveDate = (amount: number) => {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + amount);
    setDate(nextDate.toISOString().slice(0, 10));
  };

  const toTelHref = (phone: string) => {
    return `tel:${phone.replace(/[^\d+]/g, "")}`;
  };

  const downloadImage = async () => {
    const html2canvas = (await import("html2canvas")).default;

    if (!pdfRef.current) return;

    const canvas = await html2canvas(pdfRef.current, {
      scale: 1.2,
      backgroundColor: "#f5f6f8",
      useCORS: true,
    });

    const link = document.createElement("a");
    link.download = `番割_${date}.jpg`;
    link.href = canvas.toDataURL("image/jpeg", 0.8);
    link.click();
  };

  return (
    <div style={{ padding: 16, backgroundColor: "#f5f6f8", minHeight: "100vh" }}>
      <BackButton />

      <h1>番割</h1>

      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={() => moveDate(viewMode === "week" ? -7 : -1)}
          style={buttonStyle}
        >
          {viewMode === "week" ? "前週" : "前日"}
        </button>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={inputStyle}
        />

        <button
          type="button"
          onClick={() => moveDate(viewMode === "week" ? 7 : 1)}
          style={buttonStyle}
        >
          {viewMode === "week" ? "翌週" : "翌日"}
        </button>

        <button
          type="button"
          onClick={() => {
            const today = new Date();

            if (viewMode === "week") {
              const day = today.getDay();
              const diff = day === 0 ? -6 : 1 - day;
              today.setDate(today.getDate() + diff);
            }

            setDate(today.toISOString().slice(0, 10));
          }}
          style={buttonStyle}
        >
          {viewMode === "week" ? "今週" : "今日"}
        </button>

        <button
          type="button"
          onClick={() => setViewMode("day")}
          style={{
            ...buttonStyle,
            backgroundColor: viewMode === "day" ? "#2563eb" : "#fff",
            color: viewMode === "day" ? "#fff" : "#111",
            border: viewMode === "day" ? "1px solid #2563eb" : "1px solid #d1d5db",
          }}
        >
          1日
        </button>

        <button
          type="button"
          onClick={() => {
            setDate(new Date().toISOString().slice(0, 10));
            setViewMode("3days");
          }}
          style={{
            ...buttonStyle,
            backgroundColor: viewMode === "3days" ? "#2563eb" : "#fff",
            color: viewMode === "3days" ? "#fff" : "#111",
            border:
              viewMode === "3days" ? "1px solid #2563eb" : "1px solid #d1d5db",
          }}
        >
          3日
        </button>

        <button
          type="button"
          onClick={() => {
            const today = new Date();
            const day = today.getDay();
            const diff = day === 0 ? -6 : 1 - day;

            today.setDate(today.getDate() + diff);
            setDate(today.toISOString().slice(0, 10));
            setViewMode("week");
          }}
          style={{
            ...buttonStyle,
            backgroundColor: viewMode === "week" ? "#2563eb" : "#fff",
            color: viewMode === "week" ? "#fff" : "#111",
            border: viewMode === "week" ? "1px solid #2563eb" : "1px solid #d1d5db",
          }}
        >
          週間
        </button>

        <select
          value={filterMode}
          onChange={(e) => setFilterMode(e.target.value as FilterMode)}
          style={inputStyle}
        >
          <option value="all">全体表示</option>
          {enabledGroups.map((group) => (
            <option key={group.group_key} value={group.group_key}>
              {group.display_name}のみ
            </option>
          ))}
        </select>

        <button type="button" onClick={downloadImage} style={buttonStyle}>
          画像保存
        </button>
      </div>

      <div
        ref={pdfRef}
        style={{
          display: "grid",
          gridTemplateColumns:
            viewMode === "day"
              ? "1fr"
              : `repeat(${getDisplayDates().length}, minmax(280px, 1fr))`,
          gap: 14,
          overflowX: "auto",
        }}
      >
        {getDisplayDates().map((workDate, index) => {
          const day = new Date(workDate).getDay();
          const colors = getDateAccentColors(workDate);

          const title =
            viewMode === "3days"
              ? index === 0
                ? "今日"
                : index === 1
                ? "明日"
                : "明後日"
              : viewMode === "week"
              ? ["月", "火", "水", "木", "金", "土", "日"][index]
              : "今日";

          const dayGroups = groupedVisibleAssignments
            .map((group) => ({
              ...group,
              rows: group.rows.filter((assignment) => {
                const members = getMembers(assignment.id, workDate);
                const dailyInfo = getDailyInfo(assignment.id, workDate);

                return (
                  members.length > 0 ||
                  (dailyInfo?.planned_count ?? 0) > 0 ||
                  Boolean(dailyInfo?.detail) ||
                  Boolean(dailyInfo?.vehicle_names?.length)
                );
              }),
            }))
            .filter((group) => group.rows.length > 0);

          return (
            <div key={workDate}>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: 18,
                  marginBottom: 8,
                  backgroundColor: colors.headerBackground,
                  color: colors.headerColor,
                  border: "1px solid #d1d5db",
                  borderRadius: 10,
                  padding: 10,
                  textAlign: "center",
                }}
              >
                {title}
                <div
                  style={{
                    fontSize: 12,
                    marginTop: 4,
                    fontWeight: 600,
                  }}
                >
                  {workDate}
                </div>
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                {dayGroups.length === 0 && (
                  <div
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: 12,
                      padding: 16,
                      color: "#666",
                    }}
                  >
                    番割なし
                  </div>
                )}

                {dayGroups.map((group) => (
                  <div key={`${workDate}-${group.group_key}`} style={{ display: "grid", gap: 10 }}>
                    <div
                      style={{
                        fontWeight: 900,
                        padding: "8px 10px",
                        backgroundColor: group.header_color || "#e5e7eb",
                        borderRadius: 10,
                        border: "1px solid #d1d5db",
                      }}
                    >
                      {group.display_name}
                    </div>

                    {group.rows.map((assignment) => {
                      const members = getMembers(assignment.id, workDate);
                      const dailyInfo = getDailyInfo(assignment.id, workDate);
                      const groupName =
                        groupNameMap.get(
                          (assignment.group_key ?? "group1") as AssignmentGroupKey
                        ) ?? "未設定グループ";

                      return (
                        <div
                          key={`${workDate}-${assignment.id}`}
                          style={{
                            backgroundColor:
                              assignment.shift_type === "night" ? "#eff6ff" : "#fff",
                            borderRadius: 14,
                            padding: 14,
                            border:
                              assignment.shift_type === "night"
                                ? "1px solid #bfdbfe"
                                : "1px solid #e5e7eb",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              gap: 8,
                              marginBottom: 2,
                            }}
                          >
                            <div>
                              <div style={{ fontSize: 17, fontWeight: 900 }}>
                                {assignment.site_name || "-"}
                              </div>
                              <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
                                {groupName}
                              </div>
                            </div>

                            <div
                              style={{
                                padding: "4px 8px",
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 800,
                                whiteSpace: "nowrap",
                                backgroundColor:
                                  assignment.shift_type === "night"
                                    ? "#eff6ff"
                                    : "#f9fafb",
                                color:
                                  assignment.shift_type === "night"
                                    ? "#1d4ed8"
                                    : "#374151",
                                border:
                                  assignment.shift_type === "night"
                                    ? "1px solid #bfdbfe"
                                    : "1px solid #e5e7eb",
                              }}
                            >
                              {assignment.shift_type === "night" ? "夜勤" : "日勤"}
                            </div>
                          </div>

                          <div style={{ fontSize: 13, color: "#666" }}>
                            元請：{assignment.contractor_name || "-"}
                          </div>

                          <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
                            <div>集合：{assignment.meeting_time || "-"}</div>
                            <div>担当：{assignment.manager_name || "-"}</div>
                            <div>
                              連絡先：
                              {assignment.contact_phone ? (
                                <a
                                  href={toTelHref(assignment.contact_phone)}
                                  style={{
                                    color: "#2563eb",
                                    textDecoration: "underline",
                                    fontWeight: 700,
                                  }}
                                >
                                  {assignment.contact_phone}
                                </a>
                              ) : (
                                "-"
                              )}
                            </div>
                            <div>
                              住所：
                              {assignment.address ? (
                                <a
                                  href={
                                    assignment.address.startsWith("http")
                                      ? assignment.address
                                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                          assignment.address
                                        )}`
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    color: "#2563eb",
                                    textDecoration: "underline",
                                    fontWeight: 700,
                                  }}
                                >
                                  {assignment.address.startsWith("http")
                                    ? "📍GoogleMap"
                                    : assignment.address}
                                </a>
                              ) : (
                                "-"
                              )}
                            </div>
                          </div>

                          {dailyInfo?.detail && (
                            <div
                              style={{
                                marginTop: 10,
                                padding: 8,
                                borderRadius: 8,
                                backgroundColor: "#ecfdf5",
                                color: "#166534",
                                fontWeight: 800,
                              }}
                            >
                              作業：{dailyInfo.detail}
                            </div>
                          )}

                          {dailyInfo?.vehicle_names?.length ? (
                            <div style={{ marginTop: 10 }}>
                              🚚 {dailyInfo.vehicle_names.join(" / ")}
                            </div>
                          ) : null}

                          <div style={{ marginTop: 12 }}>
                            <div style={{ fontWeight: 900, marginBottom: 6 }}>
                              人員 {members.length}人
                            </div>

                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {[...members]
                                .sort(
                                  (a, b) => Number(b.is_foreman) - Number(a.is_foreman)
                                )
                                .map((member) => (
                                  <div
                                    key={member.id}
                                    style={{
                                      padding: "6px 10px",
                                      borderRadius: 999,
                                      backgroundColor: "#fff7ed",
                                      border: "1px solid #fed7aa",
                                      fontWeight: 800,
                                    }}
                                  >
                                    {member.is_foreman ? "👷 " : ""}
                                    {member.employee_name}
                                    {member.is_driver ? " 🚚" : ""}
                                    {member.is_operator ? " OP" : ""}
                                    {member.heavy_equipment
                                      ? ` ${member.heavy_equipment}`
                                      : ""}
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid #ccc",
  backgroundColor: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

const inputStyle: React.CSSProperties = {
  padding: 9,
  borderRadius: 8,
  border: "1px solid #ccc",
  fontSize: 16,
};