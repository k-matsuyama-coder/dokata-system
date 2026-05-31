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

  const fetchData = async () => {
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
      .eq("work_date", date);

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
      .eq("work_date", date);

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
  }, [date]);

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
  }, [date]);

  const getMembers = (assignmentId: string) => {
    return siteMembers.filter((m) => m.assignment_id === assignmentId);
  };

  const getDailyInfo = (assignmentId: string) => {
    return dailyInfos.find((d) => d.assignment_id === assignmentId);
  };

  const visibleAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const members = getMembers(assignment.id);
      const dailyInfo = getDailyInfo(assignment.id);

      return (
        members.length > 0 ||
        (dailyInfo?.planned_count ?? 0) > 0 ||
        !!dailyInfo?.detail ||
        !!dailyInfo?.vehicle_names?.length
      );
    });
  }, [assignments, siteMembers, dailyInfos]);

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
          const members = getMembers(assignment.id);
          const dailyInfo = getDailyInfo(assignment.id);

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

              {dailyInfo?.detail && (
                <div
                  style={{
                    marginTop: 12,
                    padding: 10,
                    borderRadius: 10,
                    backgroundColor: "#ecfdf5",
                    color: "#166534",
                    fontWeight: 800,
                  }}
                >
                  作業：{dailyInfo.detail}
                </div>
              )}

              {dailyInfo?.vehicle_names?.length ? (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 800, marginBottom: 6 }}>車両</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {dailyInfo.vehicle_names.map((name) => (
                      <span
                        key={name}
                        style={{
                          padding: "4px 8px",
                          borderRadius: 999,
                          backgroundColor: "#e0f2fe",
                          color: "#0369a1",
                          fontWeight: 700,
                        }}
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div style={{ marginTop: 14 }}>
                <div style={{ fontWeight: 900, marginBottom: 8 }}>
                  人員 {members.length}人
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
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
                      {member.is_driver ? " 🚚" : ""}
                      {member.is_operator ? " OP" : ""}
                      {member.heavy_equipment ? ` ${member.heavy_equipment}` : ""}
                    </div>
                  ))}
                </div>
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