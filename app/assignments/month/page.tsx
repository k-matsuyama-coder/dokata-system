"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";

type Assignment = {
  id: string;
  assignment_date: string;
  site_name: string | null;
  contractor_name: string | null;
  shift_type: string | null;
  start_time: string | null;
  end_time: string | null;
};

type AssignmentMember = {
  id: string;
  assignment_id: string;
  employee_name: string;
  is_driver: boolean | null;
  is_operator: boolean | null;
  heavy_equipment: string | null;
};

type Employee = {
    name: string;
  };

export default function MonthlyAssignmentsPage() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [members, setMembers] = useState<AssignmentMember[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
const [memberInput, setMemberInput] = useState("");

  const days = useMemo(() => {
    const [year, monthNum] = month.split("-").map(Number);
    const lastDay = new Date(year, monthNum, 0).getDate();

    return Array.from({ length: lastDay }, (_, i) => {
      const day = i + 1;
      return `${month}-${String(day).padStart(2, "0")}`;
    });
  }, [month]);

  const fetchData = async () => {
    const startDate = `${month}-01`;
    const endDate = days[days.length - 1];

    const { data: assignmentData, error } = await supabase
      .from("assignments")
      .select("id, assignment_date, site_name, contractor_name, shift_type, start_time, end_time")
      .gte("assignment_date", startDate)
      .lte("assignment_date", endDate)
      .order("assignment_date", { ascending: true });

    if (error) {
      alert("番割取得失敗: " + error.message);
      return;
    }

    setAssignments(assignmentData ?? []);

    const ids = (assignmentData ?? []).map((a) => a.id);

    if (ids.length === 0) {
      setMembers([]);
      return;
    }

    const { data: memberData, error: memberError } = await supabase
      .from("assignment_members")
      .select("id, assignment_id, employee_name, is_driver, is_operator, heavy_equipment")
      .in("assignment_id", ids);

    if (memberError) {
      alert("メンバー取得失敗: " + memberError.message);
      return;
    }

    setMembers(memberData ?? []);
  };

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: employee } = await supabase
        .from("employees")
        .select("role")
        .eq("auth_user_id", user.id)
        .single();

      if (!employee || employee.role !== "admin") {
        alert("管理者のみ閲覧できます");
        window.location.href = "/home";
        return;
      }

      fetchData();
    };

    checkAdmin();
  }, [month, days.length]);

  const rows = useMemo(() => {
    const map = new Map<string, Assignment[]>();

    assignments.forEach((a) => {
      const key = [
        a.contractor_name || "",
        a.site_name || "",
        a.shift_type || "",
        a.start_time || "",
        a.end_time || "",
      ].join("__");

      if (!map.has(key)) {
        map.set(key, []);
      }

      map.get(key)?.push(a);
    });

    return Array.from(map.entries()).map(([key, items]) => {
      const first = items[0];

      return {
        key,
        contractorName: first.contractor_name || "-",
        siteName: first.site_name || "-",
        shiftType: first.shift_type || "day",
        startTime: first.start_time || "-",
        endTime: first.end_time || "-",
        items,
      };
    });
  }, [assignments]);

  const getMembersText = (assignmentId: string) => {
    const targetMembers = members.filter((m) => m.assignment_id === assignmentId);

    if (targetMembers.length === 0) return "";

    return targetMembers
      .map((m) => {
        const marks = [
          m.is_driver ? "🚗" : "",
          m.is_operator ? "OP" : "",
          m.heavy_equipment || "",
        ]
          .filter(Boolean)
          .join(" ");

        return marks ? `${m.employee_name} ${marks}` : m.employee_name;
      })
      .join("\n");
  };

  return (
    <div style={{ padding: 16 }}>
      <BackButton />

      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <h1>月間番割表</h1>

        <div style={{ marginBottom: 16, display: "flex", gap: 10 }}>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
              fontSize: 16,
            }}
          />

          <a
            href="/assignments"
            style={{
              textDecoration: "none",
              backgroundColor: "#111",
              color: "#fff",
              padding: "10px 14px",
              borderRadius: 8,
              fontWeight: 700,
            }}
          >
            日別入力へ
          </a>
        </div>

        <div style={{ overflowX: "auto", border: "1px solid #ddd" }}>
          <table
            style={{
              borderCollapse: "collapse",
              minWidth: 1600,
              width: "100%",
              backgroundColor: "#fff",
              fontSize: 12,
            }}
          >
            <thead>
              <tr>
                <th style={th}>元請</th>
                <th style={th}>現場名</th>
                <th style={th}>昼/夜</th>
                <th style={th}>時間</th>

                {days.map((date) => (
                  <th key={date} style={th}>
                    {Number(date.slice(-2))}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td style={td} colSpan={days.length + 4}>
                    この月の番割はありません
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.key}>
                    <td style={td}>{row.contractorName}</td>
                    <td style={{ ...td, fontWeight: 700 }}>{row.siteName}</td>
                    <td style={td}>{row.shiftType === "night" ? "夜" : "昼"}</td>
                    <td style={td}>
                      {row.startTime}〜{row.endTime}
                    </td>

                    {days.map((date) => {
                      const assignment = row.items.find(
                        (item) => item.assignment_date === date
                      );

                      return (
                        <td
  key={date}
  onClick={() => {
    window.location.href = `/assignments?date=${date}`;
  }}
  style={{
    ...cellTd,
    cursor: "pointer",
    backgroundColor: assignment ? "#fff" : "#fafafa",
  }}
>
  {assignment ? getMembersText(assignment.id) : "＋"}
</td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const th = {
  border: "1px solid #ccc",
  padding: 8,
  backgroundColor: "#f2f2f2",
  whiteSpace: "nowrap" as const,
  textAlign: "center" as const,
};

const td = {
  border: "1px solid #ccc",
  padding: 8,
  whiteSpace: "nowrap" as const,
  verticalAlign: "top" as const,
};

const cellTd = {
  border: "1px solid #ccc",
  padding: 6,
  minWidth: 90,
  height: 60,
  whiteSpace: "pre-wrap" as const,
  verticalAlign: "top" as const,
};