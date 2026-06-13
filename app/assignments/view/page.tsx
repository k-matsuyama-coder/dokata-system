"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";

type Assignment = {
  id: string;
  site_name: string | null;
  contractor_name: string | null;
  manager_name: string | null;
  contact_phone: string | null;
  address: string | null;
  meeting_time: string | null;
  shift_type: string | null;
  construction_type: string | null;
};

type SiteMember = {
  id: string;
  assignment_id: string;
  work_date: string;
  employee_name: string;
  is_driver: boolean | null;
  is_operator: boolean | null;
  heavy_equipment: string | null;
};

type DailyInfo = {
  id: string;
  assignment_id: string;
  work_date: string;
  planned_count: number | null;
  detail: string | null;
  vehicle_names: string[] | null;
};

export default function AssignmentViewPage() {
  const [date, setDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [siteMembers, setSiteMembers] = useState<SiteMember[]>([]);
  const [dailyInfos, setDailyInfos] = useState<DailyInfo[]>([]);
  const [viewMode, setViewMode] = useState<"day" | "3days" | "week">("day");
  
  const getDisplayDates = () => {
    if (viewMode === "3days") {
      return Array.from({ length: 3 }, (_, i) => {
        const d = new Date(date);
        d.setDate(d.getDate() + i);
        return d.toISOString().slice(0, 10);
      });
    }
  
    if (viewMode === "week") {
      const d = new Date(date);
      const day = d.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      d.setDate(d.getDate() + diffToMonday);
  
      return Array.from({ length: 7 }, (_, i) => {
        const x = new Date(d);
        x.setDate(d.getDate() + i);
        return x.toISOString().slice(0, 10);
      });
    }
  
    return [date];
  };

  const fetchData = async () => {
    const displayDates = getDisplayDates();
const startDate = displayDates[0];
const endDate = displayDates[displayDates.length - 1];
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
        construction_type
      `)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (assignmentError) {
      alert("現場取得失敗: " + assignmentError.message);
      return;
    }

    const assignmentIds = assignmentData?.map((a) => a.id) ?? [];

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
        heavy_equipment
      `)
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
      .in("assignment_id", assignmentIds)
      .gte("work_date", startDate)
.lte("work_date", endDate);

    if (dailyInfoError) {
      alert("日別情報取得失敗: " + dailyInfoError.message);
      return;
    }

    setAssignments(assignmentData ?? []);
    setSiteMembers(memberData ?? []);
    setDailyInfos(dailyInfoData ?? []);
  };

  useEffect(() => {
    fetchData();
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
        () => fetchData()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assignment_site_daily_infos",
        },
        () => fetchData()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assignments",
        },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [date, viewMode]);

  const getMembers = (assignmentId: string, workDate: string) => {
    return siteMembers.filter(
      (m) => m.assignment_id === assignmentId && m.work_date === workDate
    );
  };
  
  const getDailyInfo = (assignmentId: string, workDate: string) => {
    return dailyInfos.find(
      (d) => d.assignment_id === assignmentId && d.work_date === workDate
    );
  };

  const visibleAssignments = assignments.filter((assignment) => {
    const displayDates = getDisplayDates();
  
    return displayDates.some((workDate) => {
      const members = getMembers(assignment.id, workDate);
      const dailyInfo = getDailyInfo(assignment.id, workDate);
  
      return (
        members.length > 0 ||
        (dailyInfo?.planned_count ?? 0) > 0 ||
        !!dailyInfo?.detail ||
        !!dailyInfo?.vehicle_names?.length
      );
    });
  });

  const moveDate = (amount: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + amount);
    setDate(d.toISOString().slice(0, 10));
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
        <button type="button" onClick={() => moveDate(-1)} style={buttonStyle}>
          前日
        </button>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={inputStyle}
        />

        <button type="button" onClick={() => moveDate(1)} style={buttonStyle}>
          翌日
        </button>

        <button
          type="button"
          onClick={() => setDate(new Date().toISOString().slice(0, 10))}
          style={buttonStyle}
        >
          今日
        </button>

        <button type="button" onClick={() => setViewMode("day")} style={buttonStyle}>
  1日
</button>

<button
  type="button"
  onClick={() => {
    setDate(new Date().toISOString().slice(0, 10));
    setViewMode("3days");
  }}
  style={buttonStyle}
>
  3日間
</button>

<button type="button" onClick={() => setViewMode("week")} style={buttonStyle}>
  7日間
</button>

      </div>

      <div style={{ display: "grid", gap: 14 }}>
        {visibleAssignments.length === 0 && (
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 20,
              color: "#666",
            }}
          >
            この日の番割はありません。
          </div>
        )}

        {visibleAssignments.map((assignment) => {
          const displayDates = getDisplayDates();

          return (
            <div
              key={assignment.id}
              style={{
                backgroundColor: "#fff",
                borderRadius: 14,
                padding: 16,
                border: "1px solid #e5e7eb",
                boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>
                    {assignment.site_name || "-"}
                  </div>

                  <div style={{ fontSize: 13, color: "#555", fontWeight: 700 }}>
                    {assignment.construction_type || "第一工事"}
                  </div>

                  <div style={{ fontSize: 13, color: "#666" }}>
                    元請：{assignment.contractor_name || "-"}
                  </div>
                </div>

                <div
                  style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    backgroundColor:
                      assignment.shift_type === "night" ? "#111827" : "#f3f4f6",
                    color: assignment.shift_type === "night" ? "#fff" : "#111",
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                  }}
                >
                  {assignment.shift_type === "night" ? "夜" : "昼"}
                </div>
              </div>

              <div style={{ marginTop: 12, display: "grid", gap: 6 }}>
                <div>集合：{assignment.meeting_time || "-"}</div>
                <div>担当：{assignment.manager_name || "-"}</div>
                <div>連絡先：{assignment.contact_phone || "-"}</div>
                <div>住所：{assignment.address || "-"}</div>
              </div>

                <div
                style={{
                  marginTop: 16,
                  display: "grid",
                  gap: 12,
                }}
              >
                {displayDates.map((workDate) => {
                  const members = getMembers(
                    assignment.id,
                    workDate
                  );
              
                  const dailyInfo = getDailyInfo(
                    assignment.id,
                    workDate
                  );
              
                  if (
                    members.length === 0 &&
                    !dailyInfo?.detail &&
                    !dailyInfo?.vehicle_names?.length &&
                    !(dailyInfo?.planned_count ?? 0)
                  ) {
                    return null;
                  }
              
                  return (
                    <div
                      key={workDate}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 10,
                        padding: 10,
                        backgroundColor: "#fafafa",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 900,
                          marginBottom: 8,
                        }}
                      >
                        {workDate}
                      </div>
              
                      {dailyInfo?.detail && (
                        <div
                          style={{
                            marginBottom: 8,
                            color: "#166534",
                            fontWeight: 800,
                          }}
                        >
                          作業：{dailyInfo.detail}
                        </div>
                      )}
              
                      {dailyInfo?.vehicle_names?.length ? (
                        <div
                          style={{
                            marginBottom: 8,
                          }}
                        >
                          🚚 {dailyInfo.vehicle_names.join(" / ")}
                        </div>
                      ) : null}
              
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 6,
                        }}
                      >
                        {members.map((member) => (
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
                            {member.employee_name}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const buttonStyle = {
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid #ccc",
  backgroundColor: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

const inputStyle = {
  padding: 9,
  borderRadius: 8,
  border: "1px solid #ccc",
  fontSize: 16,
};