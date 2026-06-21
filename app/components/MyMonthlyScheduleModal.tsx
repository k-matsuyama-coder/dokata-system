"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type SiteMember = {
  id: string;
  assignment_id: string;
  work_date: string;
  employee_name: string;
};

type Assignment = {
  id: string;
  site_name: string | null;
  contractor_name: string | null;
  shift_type: string | null;

  manager_name: string | null;
  contact_phone: string | null;
  address: string | null;
  meeting_time: string | null;
  construction_type: string | null;
  start_date: string | null;
  end_date: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function MyMonthlyScheduleModal({ open, onClose }: Props) {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [members, setMembers] = useState<SiteMember[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  const days = useMemo(() => {
    const [year, monthNum] = month.split("-").map(Number);
    const lastDay = new Date(year, monthNum, 0).getDate();

    return Array.from({ length: lastDay }, (_, i) => {
      const day = i + 1;
      return `${month}-${String(day).padStart(2, "0")}`;
    });
  }, [month]);

  useEffect(() => {
    if (!open) return;

    const fetchSchedule = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) return;

      const { data: employee } = await supabase
        .from("employees")
        .select("name")
        .eq("auth_user_id", user.id)
        .single();

      if (!employee) return;

      const startDate = `${month}-01`;
      const endDate = days[days.length - 1];

      const { data: memberData, error: memberError } = await supabase
        .from("assignment_site_members")
        .select("id, assignment_id, work_date, employee_name")
        .eq("employee_name", employee.name)
        .gte("work_date", startDate)
        .lte("work_date", endDate);

      if (memberError) {
        alert("予定取得失敗: " + memberError.message);
        return;
      }

      setMembers(memberData ?? []);

      const assignmentIds = Array.from(
        new Set((memberData ?? []).map((m) => m.assignment_id))
      );

      if (assignmentIds.length === 0) {
        setAssignments([]);
        return;
      }

      const { data: assignmentData, error: assignmentError } = await supabase
  .from("assignments")
  .select(`
    id,
    site_name,
    contractor_name,
    shift_type,
    manager_name,
    contact_phone,
    address,
    meeting_time,
    construction_type,
    start_date,
    end_date
  `)
  .in("id", assignmentIds);

      if (assignmentError) {
        alert("現場取得失敗: " + assignmentError.message);
        return;
      }

      setAssignments(assignmentData ?? []);
    };

    fetchSchedule();
  }, [open, month, days]);

  if (!open) return null;

  const getSchedulesByDate = (date: string) => {
    return members
      .filter((m) => m.work_date === date)
      .map((m) => assignments.find((a) => a.id === m.assignment_id))
      .filter(Boolean) as Assignment[];
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.45)",
        zIndex: 99999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "calc(100vw - 24px)",
          maxWidth: 900,
          maxHeight: "90vh",
          overflowY: "auto",
          overflowX: "hidden",
          backgroundColor: "#fff",
          borderRadius: 16,
          padding: 12,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <h2 style={{ margin: 0 }}>自分の番割カレンダー</h2>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              backgroundColor: "#111",
              color: "#fff",
              borderRadius: 8,
              padding: "8px 12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            閉じる
          </button>
        </div>

        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={{
            padding: 10,
            border: "1px solid #ccc",
            borderRadius: 8,
            marginBottom: 12,
            fontSize: 16,
          }}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            gap: 4,
            width: "100%",
          }}
        >
          {["日", "月", "火", "水", "木", "金", "土"].map((d) => (
            <div
              key={d}
              style={{
                fontWeight: 800,
                textAlign: "center",
                padding: 8,
                backgroundColor: "#f3f4f6",
                borderRadius: 8,
              }}
            >
              {d}
            </div>
          ))}

          {Array.from({
            length: new Date(`${month}-01`).getDay(),
          }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {days.map((date) => {
            const schedules = getSchedulesByDate(date);
            const day = new Date(date).getDay();

            return (
              <div
                key={date}
                style={{
                  minHeight: 90,
                  minWidth: 0,
                  border: "1px solid #ddd",
                  borderRadius: 10,
                  padding: 6,
                  backgroundColor:
                    day === 0 ? "#fff7f7" : day === 6 ? "#f7fbff" : "#fff",
                }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    marginBottom: 6,
                    color:
                      day === 0 ? "#d11a2a" : day === 6 ? "#2563eb" : "#111",
                  }}
                >
                  {Number(date.slice(-2))}
                </div>

                <div style={{ display: "grid", gap: 4 }}>
                {schedules.map((assignment) => (
  <div
    key={assignment.id}
    onClick={() => setSelectedAssignment(assignment)}
    style={{
      padding: "4px 6px",
      borderRadius: 8,
      overflow: "hidden",
      minWidth: 0,
      wordBreak: "keep-all",
      backgroundColor:
                          assignment.shift_type === "night"
                            ? "#374151"
                            : "#dcfce7",
                        color:
                          assignment.shift_type === "night" ? "#fff" : "#166534",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      <div
  style={{
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    fontSize: 10,
    lineHeight: 1.2,
  }}
>
  {assignment.site_name || "-"}
</div>

<div
  style={{
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    fontSize: 9,
    opacity: 0.8,
    lineHeight: 1.2,
  }}
>
  {assignment.contractor_name || "-"} /{" "}
  {assignment.shift_type === "night" ? "夜" : "昼"}
</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {selectedAssignment && (
  <div
    onClick={() => setSelectedAssignment(null)}
    style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.45)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 100000,
      padding: 16,
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: "100%",
        maxWidth: 520,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        display: "grid",
        gap: 10,
      }}
    >
      <h2 style={{ margin: 0 }}>
        {selectedAssignment.site_name}
      </h2>

      <div>
        <strong>元請：</strong>
        {selectedAssignment.contractor_name || "-"}
      </div>

      <div>
        <strong>担当者：</strong>
        {selectedAssignment.manager_name || "-"}
      </div>

      <div>
        <strong>連絡先：</strong>
        {selectedAssignment.contact_phone || "-"}
      </div>

      <div>
  <strong>住所：</strong>

  {selectedAssignment.address ? (
    <a
      href={
        selectedAssignment.address.startsWith("http")
          ? selectedAssignment.address
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              selectedAssignment.address
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
      {selectedAssignment.address}
    </a>
  ) : (
    "-"
  )}
</div>

      <div>
        <strong>集合：</strong>
        {selectedAssignment.meeting_time || "-"}
      </div>

      <div>
        <strong>工事区分：</strong>
        {selectedAssignment.construction_type || "-"}
      </div>

      <div>
        <strong>工期：</strong>
        {selectedAssignment.start_date || "-"}
        {" ～ "}
        {selectedAssignment.end_date || "-"}
      </div>

      <div>
        <strong>昼夜：</strong>
        {selectedAssignment.shift_type === "night"
          ? "夜勤"
          : "日勤"}
      </div>

      <button
        onClick={() => setSelectedAssignment(null)}
        style={{
          marginTop: 10,
          padding: 12,
          border: "none",
          borderRadius: 8,
          backgroundColor: "#111",
          color: "#fff",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        閉じる
      </button>
    </div>
  </div>
)}
      </div>
    </div>
  );
}