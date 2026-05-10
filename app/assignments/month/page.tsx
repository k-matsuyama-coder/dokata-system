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

type SiteMember = {
  id: string;
  assignment_id: string;
  work_date: string;
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
  const [siteMembers, setSiteMembers] = useState<SiteMember[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [siteName, setSiteName] = useState("");
  const [contractorName, setContractorName] = useState("");
  const [shiftType, setShiftType] = useState("day");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");

  const [draggingEmployeeName, setDraggingEmployeeName] = useState<string | null>(null);
  const [draggingSiteMemberId, setDraggingSiteMemberId] = useState<string | null>(null);

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
      .order("created_at", { ascending: true });

    if (error) {
      alert("現場取得失敗: " + error.message);
      return;
    }

    setAssignments(assignmentData ?? []);

    const assignmentIds = (assignmentData ?? []).map((a) => a.id);

    if (assignmentIds.length === 0) {
      setSiteMembers([]);
      return;
    }

    const { data: memberData, error: memberError } = await supabase
      .from("assignment_site_members")
      .select("id, assignment_id, work_date, employee_name, is_driver, is_operator, heavy_equipment")
      .in("assignment_id", assignmentIds)
      .gte("work_date", startDate)
      .lte("work_date", endDate);

    if (memberError) {
      alert("メンバー取得失敗: " + memberError.message);
      return;
    }

    setSiteMembers(memberData ?? []);
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

  const handleAddSite = async () => {
    if (!siteName || !contractorName) {
      alert("元請と現場名を入力してください");
      return;
    }

    const { error } = await supabase.from("assignments").insert({
      assignment_date: `${month}-01`,
      contractor_name: contractorName,
      site_name: siteName,
      shift_type: shiftType,
      start_time: startTime,
      end_time: endTime,
    });

    if (error) {
      alert("現場追加失敗: " + error.message);
      return;
    }

    setSiteName("");
    setContractorName("");
    setShiftType("day");
    setStartTime("08:00");
    setEndTime("17:00");

    fetchData();
  };

  const addEmployeeToCell = async (
    employeeName: string,
    assignmentId: string,
    workDate: string
  ) => {
    const exists = siteMembers.some(
      (m) =>
        m.assignment_id === assignmentId &&
        m.work_date === workDate &&
        m.employee_name === employeeName
    );

    if (exists) return;

    const { data, error } = await supabase
      .from("assignment_site_members")
      .insert({
        assignment_id: assignmentId,
        work_date: workDate,
        employee_name: employeeName,
        is_driver: false,
        is_operator: false,
        heavy_equipment: "",
      })
      .select("id, assignment_id, work_date, employee_name, is_driver, is_operator, heavy_equipment")
      .single();

    if (error || !data) {
      alert("メンバー追加失敗: " + (error?.message || "取得失敗"));
      return;
    }

    setSiteMembers((prev) => [...prev, data]);
    setDraggingEmployeeName(null);
  };

  const moveSiteMember = async (
    siteMemberId: string,
    assignmentId: string,
    workDate: string
  ) => {
    const { data, error } = await supabase
      .from("assignment_site_members")
      .update({
        assignment_id: assignmentId,
        work_date: workDate,
      })
      .eq("id", siteMemberId)
      .select("id, assignment_id, work_date, employee_name, is_driver, is_operator, heavy_equipment")
      .single();

    if (error || !data) {
      alert("移動失敗: " + (error?.message || "取得失敗"));
      return;
    }

    setSiteMembers((prev) =>
      prev.map((m) => (m.id === siteMemberId ? data : m))
    );
    setDraggingSiteMemberId(null);
  };

  const deleteSiteMember = async (id: string) => {
    const ok = window.confirm("このメンバーを外しますか？");
    if (!ok) return;

    const { error } = await supabase
      .from("assignment_site_members")
      .delete()
      .eq("id", id);

    if (error) {
      alert("削除失敗: " + error.message);
      return;
    }

    setSiteMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const getCellMembers = (assignmentId: string, workDate: string) => {
    return siteMembers.filter(
      (m) => m.assignment_id === assignmentId && m.work_date === workDate
    );
  };

  const getUnassignedEmployeesByDate = (workDate: string) => {
    const assignedNames = siteMembers
      .filter((m) => m.work_date === workDate)
      .map((m) => m.employee_name);

    return employees
      .filter((employee) => !assignedNames.includes(employee.name))
      .map((employee) => employee.name);
  };

  const inputStyle = {
    width: "100%",
    padding: 10,
    border: "1px solid #ccc",
    borderRadius: 8,
    fontSize: 15,
    boxSizing: "border-box" as const,
  };

  return (
    <div style={{ padding: 16 }}>
      <BackButton />

      <div style={{ maxWidth: 1500, margin: "0 auto" }}>
        <h1>月間番割表</h1>

        <div style={{ marginBottom: 16 }}>
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
        </div>

        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: 14,
            marginBottom: 16,
            backgroundColor: "#fff",
            display: "grid",
            gap: 10,
          }}
        >
          <h2 style={{ margin: 0 }}>現場追加</h2>

          <input
            value={contractorName}
            onChange={(e) => setContractorName(e.target.value)}
            placeholder="元請"
            style={inputStyle}
          />

          <input
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            placeholder="現場名"
            style={inputStyle}
          />

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => {
                setShiftType("day");
                setStartTime("08:00");
                setEndTime("17:00");
              }}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 8,
                border: shiftType === "day" ? "2px solid #111" : "1px solid #ccc",
                backgroundColor: shiftType === "day" ? "#f3f3f3" : "#fff",
                fontWeight: 700,
              }}
            >
              昼
            </button>

            <button
              type="button"
              onClick={() => {
                setShiftType("night");
                setStartTime("20:00");
                setEndTime("05:00");
              }}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 8,
                border: shiftType === "night" ? "2px solid #111" : "1px solid #ccc",
                backgroundColor: shiftType === "night" ? "#f3f3f3" : "#fff",
                fontWeight: 700,
              }}
            >
              夜
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              style={inputStyle}
            />
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              style={inputStyle}
            />
          </div>

          <button
            type="button"
            onClick={handleAddSite}
            style={{
              padding: 12,
              border: "none",
              borderRadius: 8,
              backgroundColor: "#111",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ＋ 現場を追加
          </button>
        </div>

        <div style={{ overflowX: "auto", border: "1px solid #ddd" }}>
          <table
            style={{
              borderCollapse: "collapse",
              minWidth: 1700,
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
              {assignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td style={td}>{assignment.contractor_name || "-"}</td>
                  <td style={{ ...td, fontWeight: 800 }}>{assignment.site_name || "-"}</td>
                  <td style={td}>{assignment.shift_type === "night" ? "夜" : "昼"}</td>
                  <td style={td}>
                    {assignment.start_time || "-"}〜{assignment.end_time || "-"}
                  </td>

                  {days.map((date) => {
                    const cellMembers = getCellMembers(assignment.id, date);

                    return (
                      <td
                        key={date}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (draggingSiteMemberId) {
                            moveSiteMember(draggingSiteMemberId, assignment.id, date);
                            return;
                          }

                          if (draggingEmployeeName) {
                            addEmployeeToCell(draggingEmployeeName, assignment.id, date);
                          }
                        }}
                        style={cellTd}
                      >
                        <div style={{ display: "grid", gap: 4 }}>
                          {cellMembers.map((member) => (
                            <div
                              key={member.id}
                              draggable
                              onDragStart={() => setDraggingSiteMemberId(member.id)}
                              onDragEnd={() => setDraggingSiteMemberId(null)}
                              onDoubleClick={() => deleteSiteMember(member.id)}
                              style={{
                                padding: "4px 6px",
                                borderRadius: 6,
                                backgroundColor: "#f1f1f1",
                                border: "1px solid #ddd",
                                cursor: "grab",
                                whiteSpace: "nowrap",
                                fontWeight: 700,
                              }}
                            >
                              {member.employee_name}
                              {member.is_driver ? " 🚗" : ""}
                              {member.is_operator ? " OP" : ""}
                              {member.heavy_equipment ? ` ${member.heavy_equipment}` : ""}
                            </div>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}

              <tr>
                <td style={{ ...td, fontWeight: 800 }} colSpan={4}>
                  未配置メンバー
                </td>

                {days.map((date) => {
                  const unassigned = getUnassignedEmployeesByDate(date);

                  return (
                    <td key={date} style={cellTd}>
                      {unassigned.length === 0 ? (
                        "-"
                      ) : (
                        <div style={{ display: "grid", gap: 4 }}>
                          {unassigned.map((name) => (
                            <div
                              key={name}
                              draggable
                              onDragStart={() => setDraggingEmployeeName(name)}
                              onDragEnd={() => setDraggingEmployeeName(null)}
                              style={{
                                padding: "4px 6px",
                                borderRadius: 6,
                                backgroundColor: "#fff8e1",
                                border: "1px solid #e0c96a",
                                cursor: "grab",
                                whiteSpace: "nowrap",
                                fontWeight: 700,
                              }}
                            >
                              {name}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        <p style={{ color: "#666", fontSize: 13 }}>
          ※ メンバーを外す場合は、配置済みの名前をダブルクリックしてください。
        </p>
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
  minWidth: 95,
  height: 62,
  whiteSpace: "pre-wrap" as const,
  verticalAlign: "top" as const,
};