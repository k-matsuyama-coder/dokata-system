"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

export default function AssignmentViewPage() {
  const [date, setDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [siteMembers, setSiteMembers] = useState<SiteMember[]>([]);
  const [dailyInfos, setDailyInfos] = useState<DailyInfo[]>([]);
  const [viewMode, setViewMode] = useState<"day" | "3days" | "week">("day");

  const pdfRef = useRef<HTMLDivElement>(null);
  
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
        is_foreman,
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
  onClick={() =>
    moveDate(viewMode === "week" ? -7 :  -1)
  }
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
  onClick={() =>
    moveDate(viewMode === "week" ? 7 : 1)
  }
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
    backgroundColor:
  viewMode === "day"
    ? "#2563eb"
    : "#fff",
    color:
      viewMode === "day"
        ? "#fff"
        : "#111",
    border:
      viewMode === "day"
        ? "1px solid #2563eb"
        : "1px solid #d1d5db",
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
  
    backgroundColor:
  viewMode === "3days"
    ? "#2563eb"
    : "#fff",
  
    color:
      viewMode === "3days"
        ? "#fff"
        : "#111",
  
    border:
      viewMode === "3days"
        ? "1px solid #2563eb"
        : "1px solid #d1d5db",
  }}
>
  3日
</button>

<button
  type="button"
  onClick={() => {
    const today = new Date();

    const day = today.getDay();

    const diff =
      day === 0
        ? -6
        : 1 - day;

    today.setDate(
      today.getDate() + diff
    );

    setDate(
      today.toISOString().slice(0, 10)
    );

    setViewMode("week");
  }}
  style={{
    ...buttonStyle,
  
    backgroundColor:
  viewMode === "week"
    ? "#2563eb"
    : "#fff",
  
    color:
  viewMode === "week"
    ? "#fff"
    : "#111",

border:
  viewMode === "week"
    ? "1px solid #2563eb"
    : "1px solid #d1d5db",
  }}
>
  週間
</button>

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

    const dayAssignments = assignments.filter((assignment) => {
      const members = getMembers(assignment.id, workDate);
      const dailyInfo = getDailyInfo(assignment.id, workDate);

      return (
        members.length > 0 ||
        (dailyInfo?.planned_count ?? 0) > 0 ||
        !!dailyInfo?.detail ||
        !!dailyInfo?.vehicle_names?.length
      );
    });

    return (
      <div key={workDate}>

<div
  style={{
    fontWeight: 900,
    fontSize: 18,
    marginBottom: 8,

    backgroundColor:
      day === 0
        ? "#fee2e2"
        : day === 6
        ? "#dbeafe"
        : "#f3f4f6",

    color:
      day === 0
        ? "#dc2626"
        : day === 6
        ? "#2563eb"
        : "#111827",

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
          {dayAssignments.length === 0 && (
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

          {dayAssignments.map((assignment) => {
            const members = getMembers(assignment.id, workDate);
            const dailyInfo = getDailyInfo(assignment.id, workDate);

            return (
              <div
                key={`${workDate}-${assignment.id}`}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 14,
                  padding: 14,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ fontSize: 17, fontWeight: 900 }}>
                  {assignment.site_name || "-"}
                </div>

                <div style={{ fontSize: 13, color: "#666" }}>
                  元請：{assignment.contractor_name || "-"}
                </div>

                <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
                  <div>集合：{assignment.meeting_time || "-"}</div>
                  <div>担当：{assignment.manager_name || "-"}</div>
                  <div>連絡先：{assignment.contact_phone || "-"}</div>
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
  .sort((a, b) => Number(b.is_foreman) - Number(a.is_foreman))
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