"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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

function getWeekday(date: string) {
  const day = parseLocalDate(date).getDay();
  return ["日", "月", "火", "水", "木", "金", "土"][day] ?? "";
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function FragmentWithKey({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

type BoardRow = Assignment;

export default function AssignmentViewPage() {
  const [date, setDate] = useState(() => formatLocalDate(new Date()));
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [siteMembers, setSiteMembers] = useState<SiteMember[]>([]);
  const [dailyInfos, setDailyInfos] = useState<DailyInfo[]>([]);
  const [viewMode, setViewMode] = useState<"day" | "3days" | "week">("day");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [groupSettings, setGroupSettings] = useState<AssignmentGroupSetting[]>(
    defaultGroupSettings()
  );
  const [isMobile, setIsMobile] = useState(false);

  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    updateIsMobile();
    window.addEventListener("resize", updateIsMobile);

    return () => {
      window.removeEventListener("resize", updateIsMobile);
    };
  }, []);

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
        const nextDate = parseLocalDate(date);
        nextDate.setDate(nextDate.getDate() + index);
        return formatLocalDate(nextDate);
      });
    }
  
    if (viewMode === "week") {
      const start = parseLocalDate(date);
      const day = start.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      start.setDate(start.getDate() + diffToMonday);
  
      return Array.from({ length: 7 }, (_, index) => {
        const nextDate = new Date(start);
        nextDate.setDate(start.getDate() + index);
        return formatLocalDate(nextDate);
      });
    }
  
    return [date];
  };

  const displayDates = useMemo(() => getDisplayDates(), [date, viewMode]);

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
      const nextDate = parseLocalDate(date);
      nextDate.setDate(nextDate.getDate() + amount);
      setDate(formatLocalDate(nextDate));
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
    link.href = canvas.toDataURL("image/jpeg", 0.92);
    link.click();
  };

  return (
    <div
      style={{
        padding: isMobile ? 10 : 16,
        background: "linear-gradient(180deg, #f3f4f6 0%, #eef2f7 100%)",
        minHeight: "100vh",
      }}
    >
      <BackButton />

      <h1 style={{ marginBottom: 12 }}>番割</h1>

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
          style={viewButtonStyle}
        >
          {viewMode === "week" ? "前週" : "前日"}
        </button>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={viewInputStyle}
        />

        <button
          type="button"
          onClick={() => moveDate(viewMode === "week" ? 7 : 1)}
          style={viewButtonStyle}
        >
          {viewMode === "week" ? "翌週" : "翌日"}
        </button>

        <button
          type="button"
          onClick={() => {
            const today = parseLocalDate(formatLocalDate(new Date()));

            if (viewMode === "week") {
              const day = today.getDay();
              const diff = day === 0 ? -6 : 1 - day;
              today.setDate(today.getDate() + diff);
            }

            setDate(formatLocalDate(today));
          }}
          style={viewButtonStyle}
        >
          {viewMode === "week" ? "今週" : "今日"}
        </button>

        {(["day", "3days", "week"] as const).map((mode) => {
          const label = mode === "day" ? "1日" : mode === "3days" ? "3日" : "週間";

          return (
            <button
              key={mode}
              type="button"
              onClick={() => {
                if (mode === "3days") {
                  setDate(formatLocalDate(new Date()));
                }

                if (mode === "week") {
                  const today = parseLocalDate(formatLocalDate(new Date()));
                  const day = today.getDay();
                  const diff = day === 0 ? -6 : 1 - day;
                  today.setDate(today.getDate() + diff);
                  setDate(formatLocalDate(today));
                }

                setViewMode(mode);
              }}
              style={{
                ...viewButtonStyle,
                backgroundColor: viewMode === mode ? "#2563eb" : "#fff",
                color: viewMode === mode ? "#fff" : "#111",
                border:
                  viewMode === mode
                    ? "1px solid #2563eb"
                    : "1px solid #d1d5db",
              }}
            >
              {label}
            </button>
          );
        })}

        <select
          value={filterMode}
          onChange={(e) => setFilterMode(e.target.value as FilterMode)}
          style={viewInputStyle}
        >
          <option value="all">全体表示</option>
          {enabledGroups.map((group) => (
            <option key={group.group_key} value={group.group_key}>
              {group.display_name}のみ
            </option>
          ))}
        </select>

        <button type="button" onClick={downloadImage} style={viewButtonStyle}>
          画像保存
        </button>
      </div>

      <div
        ref={pdfRef}
        style={{
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          border: "1px solid #dbe2ea",
          borderRadius: 20,
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
        }}
      >
        <table
          style={{
            borderCollapse: "separate",
            borderSpacing: 0,
            minWidth: 0,
            width: "100%",
            backgroundColor: "#fff",
          }}
        >
          <thead>
            <tr>
              <th style={{ ...stickyHeaderCellStyle, ...stickySiteHeaderStyle }}>
                現場
              </th>
              <th style={{ ...stickyHeaderCellStyle, ...stickyShiftHeaderStyle }}>
                区分
              </th>

              {displayDates.map((workDate) => {
                const colors = getDateAccentColors(workDate);

                return (
                  <th
                    key={workDate}
                    style={{
                      ...dateHeaderStyleBase,
                      background: `linear-gradient(180deg, ${colors.headerBackground} 0%, #ffffff 100%)`,
                      color: colors.headerColor,
                    }}
                  >
                    <div style={dateHeaderTopTextStyle}>{workDate}</div>
                    <div style={dateHeaderBottomTextStyle}>{getWeekday(workDate)}</div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {groupedVisibleAssignments.length === 0 && (
              <tr>
                <td
                  colSpan={2 + displayDates.length}
                  style={emptyBoardCellStyle}
                >
                  番割なし
                </td>
              </tr>
            )}

            {groupedVisibleAssignments.map((group) => (
              <FragmentWithKey key={`group-${group.group_key}`}>
                <tr>
                  <td
                    colSpan={2 + displayDates.length}
                    style={{
                      padding: isMobile ? "8px 10px" : "10px 14px",
                      background: `linear-gradient(180deg, ${group.header_color || "#e5e7eb"} 0%, #ffffff 180%)`,
                      borderTop: "1px solid #dbe2ea",
                      borderBottom: "1px solid #dbe2ea",
                      fontWeight: 900,
                      fontSize: isMobile ? 12 : 14,
                    }}
                  >
                    {group.display_name}
                  </td>
                </tr>

                {group.rows.map((assignment) => {
                  const isNight = assignment.shift_type === "night";
                  const rowSurfaceStyle = isNight
                    ? nightRowSurfaceStyleGray
                    : dayRowSurfaceStyle;
                  const shiftBadgeStyle = isNight
                    ? shiftBadgeNightStyleGray
                    : shiftBadgeDayStyle;

                  return (
                    <tr key={assignment.id}>
                      <td
                        style={{
                          ...stickySiteBodyStyle,
                          ...rowSurfaceStyle,
                        }}
                      >
                        <div
                          style={{
                            ...siteTitleStyleEnhanced,
                            fontSize: isMobile ? 12 : 14,
                            lineHeight: isMobile ? 1.2 : 1.3,
                          }}
                        >
                          {assignment.site_name || "-"}
                        </div>

                        <div style={siteMetaStackStyle}>
                          <div
                            style={{
                              ...contractorBadgeStyle,
                              fontSize: isMobile ? 10 : 11,
                              padding: isMobile ? "3px 6px" : "4px 8px",
                            }}
                          >
                            {assignment.contractor_name || "-"}
                          </div>

                          <div
                            style={{
                              ...siteMetaTextStyle,
                              fontSize: isMobile ? 10 : 11,
                              lineHeight: isMobile ? 1.25 : 1.35,
                            }}
                          >
                            担当：{assignment.manager_name || "-"}
                          </div>

                          <div
                            style={{
                              ...siteMetaTextStyle,
                              fontSize: isMobile ? 10 : 11,
                              lineHeight: isMobile ? 1.25 : 1.35,
                            }}
                          >
                            連絡先：
                            {assignment.contact_phone ? (
                              <a
                                href={toTelHref(assignment.contact_phone)}
                                style={inlineLinkStyle}
                              >
                                {assignment.contact_phone}
                              </a>
                            ) : (
                              "-"
                            )}
                          </div>

                          <div
                            style={{
                              ...siteMetaTextStyle,
                              fontSize: isMobile ? 10 : 11,
                              lineHeight: isMobile ? 1.25 : 1.35,
                            }}
                          >
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
                                style={inlineLinkStyle}
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
                      </td>

                      <td
                        style={{
                          ...stickyShiftBodyStyle,
                          ...rowSurfaceStyle,
                        }}
                      >
                        <div
                          style={{
                            ...shiftBadgeStyle,
                            fontSize: isMobile ? 11 : 13,
                            padding: isMobile ? "5px 8px" : "6px 10px",
                          }}
                        >
                          {isNight ? "夜勤" : "日勤"}
                        </div>
                      </td>

                      {displayDates.map((workDate) => {
                        const members = getMembers(assignment.id, workDate);
                        const dailyInfo = getDailyInfo(assignment.id, workDate);

                        return (
                          <td
                            key={`${assignment.id}-${workDate}`}
                            style={{
                              ...boardBodyCellStyle,
                              ...rowSurfaceStyle,
                            }}
                          >
                            <div style={cellCardStyle}>
                              <div
                                style={{
                                  ...miniInfoPillStyle,
                                  fontSize: isMobile ? 10 : 12,
                                  padding: isMobile ? "4px 8px" : "5px 10px",
                                }}
                              >
                                集合：{assignment.meeting_time || "-"}
                              </div>

                              {dailyInfo?.detail ? (
                                <div
                                  style={{
                                    ...notesBlockStyle,
                                    fontSize: isMobile ? 10 : 12,
                                  }}
                                >
                                  作業：{dailyInfo.detail}
                                </div>
                              ) : null}

                              {dailyInfo?.vehicle_names?.length ? (
                                <div
                                  style={{
                                    ...vehicleBlockStyle,
                                    fontSize: isMobile ? 10 : 12,
                                  }}
                                >
                                  🚚 {dailyInfo.vehicle_names.join(" / ")}
                                </div>
                              ) : null}

                              {members.length > 0 ? (
                                <div style={membersBlockWrapStyle}>
                                  <div
                                    style={{
                                      ...memberCountLabelStyle,
                                      fontSize: isMobile ? 10 : 12,
                                    }}
                                  >
                                    人員 {members.length}人
                                  </div>

                                  <div style={membersChipWrapStyle}>
                                    {[...members]
                                      .sort(
                                        (a, b) => Number(b.is_foreman) - Number(a.is_foreman)
                                      )
                                      .map((member) => (
                                        <div
                                          key={member.id}
                                          style={{
                                            ...memberChipElevatedStyle,
                                            fontSize: isMobile ? 10 : 12,
                                            padding: isMobile ? "5px 8px" : "7px 11px",
                                          }}
                                        >
                                          <span>{member.is_foreman ? "👷 " : ""}</span>
                                          <span>{member.employee_name}</span>
                                          {member.is_driver ? <span>🚚</span> : null}
                                          {member.is_operator ? <span>OP</span> : null}
                                          {member.heavy_equipment ? (
                                            <span>{member.heavy_equipment}</span>
                                          ) : null}
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </FragmentWithKey>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const viewButtonStyle: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  backgroundColor: "#fff",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(15,23,42,0.04)",
};

const viewInputStyle: React.CSSProperties = {
  padding: 9,
  borderRadius: 10,
  border: "1px solid #d1d5db",
  fontSize: 16,
  backgroundColor: "#fff",
  boxShadow: "0 4px 12px rgba(15,23,42,0.04)",
};

const stickyHeaderCellStyle: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 50,
  padding: "10px 6px",
  textAlign: "center",
  fontSize: 12,
  fontWeight: 900,
  whiteSpace: "nowrap",
  background:
    "linear-gradient(180deg, rgba(248,250,252,0.98) 0%, rgba(255,255,255,0.98) 100%)",
  borderBottom: "1px solid #dbe2ea",
};

const stickySiteHeaderStyle: React.CSSProperties = {
  left: 0,
  zIndex: 70,
  minWidth: 116,
  width: 116,
  boxShadow: "2px 0 0 #dbe2ea, 10px 0 24px rgba(15,23,42,0.06)",
};

const stickyShiftHeaderStyle: React.CSSProperties = {
  left: 116,
  zIndex: 71,
  minWidth: 54,
  width: 54,
  boxShadow: "2px 0 0 #dbe2ea, 10px 0 24px rgba(15,23,42,0.06)",
};

const dateHeaderStyleBase: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 40,
  minWidth: 118,
  width: 118,
  padding: "8px 4px",
  textAlign: "center",
  borderBottom: "1px solid #dbe2ea",
  borderLeft: "1px solid #eef2f7",
};

const dateHeaderTopTextStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 900,
  lineHeight: 1.15,
};

const dateHeaderBottomTextStyle: React.CSSProperties = {
  marginTop: 4,
  fontSize: 11,
  fontWeight: 700,
  opacity: 0.92,
};

const stickySiteBodyStyle: React.CSSProperties = {
  position: "sticky",
  left: 0,
  zIndex: 20,
  minWidth: 116,
  width: 116,
  padding: "8px 8px",
  borderBottom: "1px solid #edf2f7",
  boxShadow: "2px 0 0 #dbe2ea, 10px 0 24px rgba(15,23,42,0.06)",
  verticalAlign: "top",
};

const stickyShiftBodyStyle: React.CSSProperties = {
  position: "sticky",
  left: 116,
  zIndex: 21,
  minWidth: 54,
  width: 54,
  padding: "8px 4px",
  borderBottom: "1px solid #edf2f7",
  boxShadow: "2px 0 0 #dbe2ea, 10px 0 24px rgba(15,23,42,0.06)",
  textAlign: "center",
  verticalAlign: "top",
};

const dayRowSurfaceStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
};

const nightRowSurfaceStyleGray: React.CSSProperties = {
  background: "linear-gradient(180deg, #bcc3cc 0%, #d1d5db 42%, #e5e7eb 100%)",
};

const shiftBadgeDayStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "5px 8px",
  borderRadius: 999,
  backgroundColor: "#ecfdf5",
  color: "#166534",
  border: "1px solid #86efac",
  fontSize: 11,
  fontWeight: 900,
  whiteSpace: "nowrap",
};

const shiftBadgeNightStyleGray: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "5px 8px",
  borderRadius: 999,
  background: "linear-gradient(180deg, #374151 0%, #111827 100%)",
  color: "#ffffff",
  border: "1px solid #1f2937",
  boxShadow: "0 6px 14px rgba(17,24,39,0.22)",
  fontSize: 11,
  fontWeight: 900,
  whiteSpace: "nowrap",
};

const boardBodyCellStyle: React.CSSProperties = {
  minWidth: 118,
  width: 118,
  padding: "8px 4px",
  borderBottom: "1px solid #edf2f7",
  borderLeft: "1px solid #f1f5f9",
  verticalAlign: "top",
  boxSizing: "border-box",
};

const siteTitleStyleEnhanced: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  lineHeight: 1.2,
  color: "#0f172a",
  letterSpacing: 0,
  wordBreak: "break-word",
};

const siteMetaStackStyle: React.CSSProperties = {
  marginTop: 8,
  display: "grid",
  gap: 4,
};

const contractorBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  width: "fit-content",
  maxWidth: "100%",
  padding: "3px 6px",
  borderRadius: 999,
  backgroundColor: "#eef2ff",
  color: "#4338ca",
  fontSize: 10,
  fontWeight: 800,
  wordBreak: "break-word",
};

const siteMetaTextStyle: React.CSSProperties = {
  fontSize: 10,
  color: "#475569",
  lineHeight: 1.25,
  wordBreak: "break-word",
};

const inlineLinkStyle: React.CSSProperties = {
  color: "#2563eb",
  textDecoration: "underline",
  marginLeft: 2,
  fontWeight: 700,
};

const cellCardStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
};

const miniInfoPillStyle: React.CSSProperties = {
  display: "inline-flex",
  width: "fit-content",
  padding: "4px 8px",
  borderRadius: 999,
  backgroundColor: "#ffffff",
  border: "1px solid #cbd5e1",
  color: "#1e293b",
  fontSize: 10,
  fontWeight: 800,
};

const notesBlockStyle: React.CSSProperties = {
  padding: "8px 9px",
  borderRadius: 12,
  background: "linear-gradient(180deg, #f3f4f6 0%, #ffffff 100%)",
  border: "1px solid #d1d5db",
  color: "#374151",
  fontSize: 10,
  fontWeight: 800,
  lineHeight: 1.4,
  wordBreak: "break-word",
};

const vehicleBlockStyle: React.CSSProperties = {
  padding: "8px 9px",
  borderRadius: 12,
  background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
  border: "1px solid #e5e7eb",
  color: "#334155",
  fontSize: 10,
  fontWeight: 700,
  lineHeight: 1.4,
  wordBreak: "break-word",
};

const membersBlockWrapStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
};

const memberCountLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 900,
  color: "#0f172a",
};

const membersChipWrapStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 4,
};

const memberChipElevatedStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "5px 8px",
  borderRadius: 999,
  background: "linear-gradient(180deg, #fff7ed 0%, #fffbeb 100%)",
  border: "1px solid #fed7aa",
  color: "#111827",
  fontSize: 10,
  fontWeight: 800,
  lineHeight: 1.2,
  boxShadow: "0 4px 10px rgba(251,146,60,0.08)",
};

const emptyBoardCellStyle: React.CSSProperties = {
  padding: 24,
  textAlign: "center",
  color: "#6b7280",
  fontSize: 14,
};