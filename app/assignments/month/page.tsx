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
  const [draggingMemberId, setDraggingMemberId] = useState<string | null>(null);
  const [draggingEmployeeName, setDraggingEmployeeName] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedDate, setSelectedDate] = useState(() =>
  new Date().toISOString().slice(0, 10)
);

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
    const { data: employeeData } = await supabase
  .from("employees")
  .select("name")
  .order("name", { ascending: true });

setEmployees(employeeData ?? []);

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

    useEffect(() => {
        setSelectedDate(`${month}-01`);
      }, [month]);

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

  const assignedNamesForSelectedDate = members
  .filter((member) => {
    const assignment = assignments.find(
      (a) => a.id === member.assignment_id
    );

    return assignment?.assignment_date === selectedDate;
  })
  .map((member) => member.employee_name);

const availableEmployees = employees.filter(
  (employee) => !assignedNamesForSelectedDate.includes(employee.name)
);

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

  const moveMemberToAssignment = async (
    memberId: string,
    targetAssignmentId: string
  ) => {
    const { error } = await supabase
      .from("assignment_members")
      .update({
        assignment_id: targetAssignmentId,
      })
      .eq("id", memberId);
  
    if (error) {
      alert("移動失敗: " + error.message);
      return;
    }
  
    setDraggingMemberId(null);
    fetchData();
  };

  const addEmployeeToAssignment = async (
    employeeName: string,
    targetAssignmentId: string
  ) => {
    const alreadyExists = members.some(
      (member) =>
        member.assignment_id === targetAssignmentId &&
        member.employee_name === employeeName
    );
  
    if (alreadyExists) return;
  
    const { error } = await supabase.from("assignment_members").insert({
      assignment_id: targetAssignmentId,
      employee_name: employeeName,
      is_driver: false,
      is_operator: false,
      heavy_equipment: "",
    });
  
    if (error) {
      alert("メンバー追加失敗: " + error.message);
      return;
    }
  
    fetchData();
  };

  const handleCreateSameSite = async (
    row: {
      contractorName: string;
      siteName: string;
      shiftType: string;
      startTime: string;
      endTime: string;
    },
    targetDate: string
  ) => {
    const { error } = await supabase.from("assignments").insert({
      assignment_date: targetDate,
      contractor_name: row.contractorName === "-" ? "" : row.contractorName,
      site_name: row.siteName === "-" ? "" : row.siteName,
      shift_type: row.shiftType,
      start_time: row.startTime === "-" ? "" : row.startTime,
      end_time: row.endTime === "-" ? "" : row.endTime,
    });
  
    if (error) {
      alert("番割作成失敗: " + error.message);
      return;
    }
  
    fetchData();
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
    setSelectedDate(date);
  }}
  onDragOver={(e) => {
    e.preventDefault();
  }}
  onDrop={() => {
    setSelectedDate(date);
  
    if (!assignment) return;
  
    if (draggingMemberId) {
      moveMemberToAssignment(draggingMemberId, assignment.id);
      return;
    }
  
    if (draggingEmployeeName) {
      addEmployeeToAssignment(draggingEmployeeName, assignment.id);
      setDraggingEmployeeName(null);
    }
  }}
  style={{
    ...cellTd,
    backgroundColor: assignment ? "#fff" : "#fafafa",
  }}
>
  {assignment ? (
    <div style={{ display: "grid", gap: 4 }}>
      {members
        .filter((member) => member.assignment_id === assignment.id)
        .map((member) => (
          <div
            key={member.id}
            draggable
            onDragStart={() => setDraggingMemberId(member.id)}
            onDragEnd={() => setDraggingMemberId(null)}
            style={{
              padding: "4px 6px",
              borderRadius: 6,
              backgroundColor: "#f1f1f1",
              border: "1px solid #ddd",
              cursor: "grab",
              fontSize: 12,
              whiteSpace: "nowrap",
            }}
          >
            {member.employee_name}
            {member.is_driver ? " 🚗" : ""}
            {member.is_operator ? " OP" : ""}
            {member.heavy_equipment ? ` ${member.heavy_equipment}` : ""}
          </div>
        ))}
    </div>
  ) : (
    ""
  )}
</td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div
  style={{
    marginTop: 20,
    padding: 16,
    border: "1px solid #ddd",
    borderRadius: 12,
    backgroundColor: "#fff",
  }}
>
<h2 style={{ marginTop: 0 }}>
  未配置メンバー（{selectedDate}）
</h2>

  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
    }}
  >
    {availableEmployees.map((employee) => (
      <div
        key={employee.name}
        draggable
        onDragStart={() => setDraggingEmployeeName(employee.name)}
        onDragEnd={() => setDraggingEmployeeName(null)}
        style={{
          padding: "8px 12px",
          borderRadius: 999,
          backgroundColor: "#f1f1f1",
          border: "1px solid #ccc",
          cursor: "grab",
          fontWeight: 600,
        }}
      >
        {employee.name}
      </div>
    ))}
  </div>
</div>
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