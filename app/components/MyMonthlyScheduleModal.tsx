"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type SiteMember = {
  id: string;
  assignment_id: string;
  work_date: string;
  employee_name: string;
};

type DailyInfo = {
  id: string;
  assignment_id: string;
  work_date: string;
  detail: string | null;
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

type AssignmentFile = {
  id: string;
  assignment_id: string;
  file_name: string;
  file_url: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  employeeName: string;
  organizationId: string | null;
  role: string | null;
};

export default function MyMonthlyScheduleModal({
  open,
  onClose,
  employeeName,
  organizationId,
  role,
}: Props) {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const isAdmin = role === "admin";
const [employees, setEmployees] = useState<
  { id: string; name: string }[]
>([]);
const [selectedEmployee, setSelectedEmployee] = useState("");
  const [members, setMembers] = useState<SiteMember[]>([]);
  const [allMembers, setAllMembers] = useState<SiteMember[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentFiles, setAssignmentFiles] = useState<AssignmentFile[]>([]);
  const [dailyInfos, setDailyInfos] = useState<DailyInfo[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<{
    assignment: Assignment;
    workDate: string;
  } | null>(null);

  const days = useMemo(() => {
    const [year, monthNum] = month.split("-").map(Number);
  
    const firstDay = new Date(year, monthNum - 1, 1);
    const lastDayNumber = new Date(year, monthNum, 0).getDate();
    const lastDay = new Date(year, monthNum - 1, lastDayNumber);
  
    const previousMonthDays = firstDay.getDay();
    const nextMonthDays = 6 - lastDay.getDay();
    const totalDays =
      previousMonthDays + lastDayNumber + nextMonthDays;
  
    return Array.from({ length: totalDays }, (_, index) => {
      const date = new Date(
        year,
        monthNum - 1,
        1 - previousMonthDays + index
      );
  
      const dateYear = date.getFullYear();
      const dateMonth = String(date.getMonth() + 1).padStart(2, "0");
      const dateDay = String(date.getDate()).padStart(2, "0");
  
      return `${dateYear}-${dateMonth}-${dateDay}`;
    });
  }, [month]);

  useEffect(() => {
    if (!employeeName || !organizationId) return;

const fetchSchedule = async () => {

  const startDate = days[0];
const endDate = days[days.length - 1];
const targetEmployeeName = selectedEmployee || employeeName;

const employeeListPromise = isAdmin
  ? supabase
      .from("employees")
      .select("id, name")
      .eq("organization_id", organizationId)
      .order("name")
  : Promise.resolve({
      data: [] as { id: string; name: string }[],
      error: null,
    });

const memberPromise = supabase
  .from("assignment_site_members")
  .select("id, assignment_id, work_date, employee_name")
  .eq("organization_id", organizationId)
  .eq("employee_name", targetEmployeeName)
  .gte("work_date", startDate)
  .lte("work_date", endDate);

const [employeeListResult, memberResult] = await Promise.all([
  employeeListPromise,
  memberPromise,
]);

if (employeeListResult.error) {
  alert("社員一覧取得失敗: " + employeeListResult.error.message);
  return;
}

if (memberResult.error) {
  alert("予定取得失敗: " + memberResult.error.message);
  return;
}

if (isAdmin) {
  setEmployees(employeeListResult.data ?? []);
}

const ownMembers = memberResult.data ?? [];
      setMembers(ownMembers);

      const assignmentIds = Array.from(
        new Set(ownMembers.map((member) => member.assignment_id))
      );

      if (assignmentIds.length === 0) {
        setAssignments([]);
        setAllMembers([]);
        setSelectedSchedule(null);
        return;
      }

      const [
        assignmentResult,
        fileResult,
        dailyInfoResult,
        allMemberResult,
      ] = await Promise.all([
        supabase
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
          .eq("organization_id", organizationId)
          .in("id", assignmentIds),
      
        supabase
          .from("assignment_files")
          .select("id, assignment_id, file_name, file_url")
          .eq("organization_id", organizationId)
          .in("assignment_id", assignmentIds),
      
        supabase
          .from("assignment_site_daily_infos")
          .select("id, assignment_id, work_date, detail")
          .eq("organization_id", organizationId)
          .in("assignment_id", assignmentIds)
          .gte("work_date", startDate)
          .lte("work_date", endDate),
      
        supabase
          .from("assignment_site_members")
          .select("id, assignment_id, work_date, employee_name")
          .eq("organization_id", organizationId)
          .in("assignment_id", assignmentIds)
          .gte("work_date", startDate)
          .lte("work_date", endDate),
      ]);
      
      if (assignmentResult.error) {
        alert("現場取得失敗: " + assignmentResult.error.message);
        return;
      }
      
      if (fileResult.error) {
        alert("添付ファイル取得失敗: " + fileResult.error.message);
        return;
      }
      
      if (dailyInfoResult.error) {
        alert("日別詳細取得失敗: " + dailyInfoResult.error.message);
        return;
      }
      
      if (allMemberResult.error) {
        alert("配置メンバー取得失敗: " + allMemberResult.error.message);
        return;
      }
      
      setAssignments(assignmentResult.data ?? []);
      setAssignmentFiles(fileResult.data ?? []);
      setDailyInfos(dailyInfoResult.data ?? []);
      setAllMembers(allMemberResult.data ?? []);
    };

    void fetchSchedule();
  }, [
    month,
    days,
    selectedEmployee,
    employeeName,
    organizationId,
    isAdmin,
  ]);

  const selectedMembers = useMemo(() => {
    if (!selectedSchedule) return [];

    return allMembers.filter(
      (member) =>
        member.assignment_id === selectedSchedule.assignment.id &&
        member.work_date === selectedSchedule.workDate
    );
  }, [selectedSchedule, allMembers]);

  const selectedDailyInfo = useMemo(() => {
    if (!selectedSchedule) return null;
  
    return (
      dailyInfos.find(
        (dailyInfo) =>
          dailyInfo.assignment_id === selectedSchedule.assignment.id &&
          dailyInfo.work_date === selectedSchedule.workDate
      ) ?? null
    );
  }, [selectedSchedule, dailyInfos]);

  const selectedFiles = useMemo(() => {
    if (!selectedSchedule) return [];
  
    return assignmentFiles.filter(
      (file) => file.assignment_id === selectedSchedule.assignment.id
    );
  }, [selectedSchedule, assignmentFiles]);

  const today = new Date().toISOString().slice(0, 10);

  if (!open) return null;

  const getSchedulesByDate = (date: string) => {
    return members
      .filter((member) => member.work_date === date)
      .map((member) =>
        assignments.find((assignment) => assignment.id === member.assignment_id)
      )
      .filter((assignment): assignment is Assignment => Boolean(assignment))
      .sort((a, b) => {
        const aIsNight = a.shift_type === "night";
        const bIsNight = b.shift_type === "night";
  
        if (aIsNight === bIsNight) {
          return 0;
        }
  
        return aIsNight ? 1 : -1;
      });
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

{isAdmin && (
  <select
  value={selectedEmployee || employeeName}
    onChange={(e) => setSelectedEmployee(e.target.value)}
    style={{
      padding: 10,
      border: "1px solid #ccc",
      borderRadius: 8,
      marginBottom: 12,
      marginLeft: 12,
      fontSize: 16,
    }}
  >
    {employees.map((employee) => (
      <option key={employee.id} value={employee.name}>
        {employee.name}
      </option>
    ))}
  </select>
)}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            gap: 4,
            width: "100%",
          }}
        >
          {["日", "月", "火", "水", "木", "金", "土"].map((dayLabel) => (
            <div
              key={dayLabel}
              style={{
                fontWeight: 800,
                textAlign: "center",
                padding: 8,
                backgroundColor: "#f3f4f6",
                borderRadius: 8,
              }}
            >
              {dayLabel}
            </div>
          ))}

          {days.map((date) => {
            const schedules = getSchedulesByDate(date);
            const day = new Date(date).getDay();
            const isCurrentMonth = date.startsWith(month);

            return (
              <div
                key={date}
                style={{
                  minHeight: 90,
                  minWidth: 0,
                  border: date === today ? "3px solid #2563eb" : "1px solid #ddd",
                  borderRadius: 10,
                  padding: 6,
                  backgroundColor: !isCurrentMonth
  ? "#f3f4f6"
  : day === 0
  ? "#fff7f7"
  : day === 6
  ? "#f7fbff"
  : "#fff",
opacity: isCurrentMonth ? 1 : 0.7,
                }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: date === today ? 20 : 16,
                    marginBottom: 6,
                    color:
  date === today
    ? "#2563eb"
    : day === 0
    ? "#d11a2a"
    : day === 6
    ? "#2563eb"
    : "#111",
                  }}
                >
                  {isCurrentMonth
  ? Number(date.slice(-2))
  : `${Number(date.slice(5, 7))}/${Number(date.slice(-2))}`}
                </div>

                <div style={{ display: "grid", gap: 4 }}>
                  {schedules.map((assignment) => (
                    <div
                      key={`${date}-${assignment.id}`}
                      onClick={() =>
                        setSelectedSchedule({
                          assignment,
                          workDate: date,
                        })
                      }
                      style={{
                        padding: "4px 5px",
                        borderRadius: 8,
                        overflow: "hidden",
                        minWidth: 0,
                        backgroundColor:
                          assignment.shift_type === "night" ? "#374151" : "#dcfce7",
                        color:
                          assignment.shift_type === "night" ? "#fff" : "#166534",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          whiteSpace: "normal",
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          fontSize: 10,
                          lineHeight: 1.25,
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
                          marginTop: 2,
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

        {selectedSchedule && (
          <div
            onClick={() => setSelectedSchedule(null)}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.45)",
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              overflowY: "auto",
              zIndex: 100000,
              padding: 16,
            }}
          >
            <div
  onClick={(e) => e.stopPropagation()}
  style={{
    width: "100%",
    maxWidth: 520,
    maxHeight: "calc(100vh - 32px)",
    overflowY: "auto",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    display: "grid",
    gap: 10,
    boxSizing: "border-box",
  }}
>
              <h2 style={{ margin: 0 }}>{selectedSchedule.assignment.site_name}</h2>

              <div>
                <strong>日付：</strong>
                {selectedSchedule.workDate}
              </div>

              <div>
                <strong>元請：</strong>
                {selectedSchedule.assignment.contractor_name || "-"}
              </div>

              <div>
                <strong>担当者：</strong>
                {selectedSchedule.assignment.manager_name || "-"}
              </div>

              <div>
  <strong>連絡先：</strong>
  {selectedSchedule.assignment.contact_phone ? (
    <a
      href={`tel:${selectedSchedule.assignment.contact_phone.replace(/[^\d+]/g, "")}`}
      style={{
        color: "#2563eb",
        textDecoration: "underline",
        fontWeight: 700,
      }}
    >
      {selectedSchedule.assignment.contact_phone}
    </a>
  ) : (
    "-"
  )}
</div>

              <div>
                <strong>住所：</strong>
                {selectedSchedule.assignment.address ? (
                  <a
                    href={
                      selectedSchedule.assignment.address.startsWith("http")
                        ? selectedSchedule.assignment.address
                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            selectedSchedule.assignment.address
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
                    {selectedSchedule.assignment.address}
                  </a>
                ) : (
                  "-"
                )}
              </div>

              <div>
                <strong>集合：</strong>
                {selectedSchedule.assignment.meeting_time || "-"}
              </div>

              <div>
  <strong>現場詳細：</strong>
  <div
    style={{
      marginTop: 6,
      whiteSpace: "pre-wrap",
      lineHeight: 1.6,
      backgroundColor: "#f8fafc",
      border: "1px solid #e5e7eb",
      borderRadius: 10,
      padding: 10,
      fontSize: 14,
    }}
  >
    {selectedDailyInfo?.detail || "-"}
  </div>
</div>

<div>
  <strong>添付ファイル：</strong>

  {selectedFiles.length > 0 ? (
    <div
      style={{
        marginTop: 8,
        display: "grid",
        gap: 8,
      }}
    >
      {selectedFiles.map((file) => (
        <a
          key={file.id}
          href={file.file_url}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "block",
            padding: "10px 12px",
            borderRadius: 10,
            backgroundColor: "#f8fafc",
            border: "1px solid #e5e7eb",
            color: "#2563eb",
            textDecoration: "underline",
            fontWeight: 700,
            wordBreak: "break-word",
          }}
        >
          {file.file_name}
        </a>
      ))}
    </div>
  ) : (
    <div style={{ marginTop: 6 }}>-</div>
  )}
</div>

              <div>
                <strong>工事区分：</strong>
                {selectedSchedule.assignment.construction_type || "-"}
              </div>

              <div>
                <strong>工期：</strong>
                {selectedSchedule.assignment.start_date || "-"}
                {" ～ "}
                {selectedSchedule.assignment.end_date || "-"}
              </div>

              <div>
                <strong>昼夜：</strong>
                {selectedSchedule.assignment.shift_type === "night" ? "夜勤" : "日勤"}
              </div>

              {selectedMembers.length > 0 && (
                <div>
                  <strong>メンバー：</strong>
                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                    }}
                  >
                    {selectedMembers.map((member) => (
                      <div
                        key={member.id}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 999,
                          backgroundColor: "#f3f4f6",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {member.employee_name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setSelectedSchedule(null)}
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