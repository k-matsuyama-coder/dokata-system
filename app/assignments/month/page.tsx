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
  manager_name: string | null;
contact_phone: string | null;
address: string | null;
meeting_time: string | null;
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

type Employee = {
  name: string;
};

type Contractor = {
    id: string;
    name: string;
  };

type ContractorContact = {
    id: string;
    contractor_id: string;
    manager_name: string;
    contact_phone: string | null;
  };

export default function MonthlyAssignmentsPage() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [siteMembers, setSiteMembers] = useState<SiteMember[]>([]);
  const [dailyInfos, setDailyInfos] = useState<DailyInfo[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [siteName, setSiteName] = useState("");
  const [contractorName, setContractorName] = useState("");
  const [shiftType, setShiftType] = useState("day");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [managerName, setManagerName] = useState("");
const [contactPhone, setContactPhone] = useState("");
const [address, setAddress] = useState("");
const [meetingTime, setMeetingTime] = useState("08:00");
const [contractors, setContractors] = useState<Contractor[]>([]);
const [contractorContacts, setContractorContacts] = useState<ContractorContact[]>([]);
const [showAddModal, setShowAddModal] = useState(false);

  const [draggingEmployeeName, setDraggingEmployeeName] = useState<string | null>(null);
  const [draggingSiteMemberId, setDraggingSiteMemberId] = useState<string | null>(null);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string | null>(null);
const [selectedSiteMemberId, setSelectedSiteMemberId] = useState<string | null>(null);
const [selectedDate, setSelectedDate] = useState<string | null>(null);
const [vehicles, setVehicles] = useState<
  {
    id: string;
    vehicle_name: string;
    vehicle_type: string | null;
  }[]
>([]);

const [showVehicleModal, setShowVehicleModal] = useState(false);

const [vehicleTarget, setVehicleTarget] = useState<{
  assignmentId: string;
  workDate: string;
} | null>(null);

  const days = useMemo(() => {
    const [year, monthNum] = month.split("-").map(Number);
    const lastDay = new Date(year, monthNum, 0).getDate();

    return Array.from({ length: lastDay }, (_, i) => {
      const day = i + 1;
      return `${month}-${String(day).padStart(2, "0")}`;
    });
  }, [month]);

  const todayString = new Date().toISOString().slice(0, 10);

const getDayType = (date: string) => {
  const day = new Date(date).getDay();

  if (day === 0) return "sunday";
  if (day === 6) return "saturday";
  return "weekday";
};

const getDateHeaderStyle = (date: string) => {
  const dayType = getDayType(date);
  const isToday = date === todayString;

  return {
    ...th,
    boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
    backgroundColor: isToday
      ? "#fff3cd"
      : dayType === "sunday"
      ? "#ffe5e5"
      : dayType === "saturday"
      ? "#e5f0ff"
      : "#f5f5f5",
    color:
      dayType === "sunday"
        ? "#d11a2a"
        : dayType === "saturday"
        ? "#0a66c2"
        : "#111",
    fontWeight: 800,
  };
};

const getCellStyle = (
  date: string,
  plannedCount: number | null | undefined,
  memberCount: number
) => {
  const dayType = getDayType(date);
  const isToday = date === todayString;

  const isShort =
    plannedCount !== null &&
    plannedCount !== undefined &&
    plannedCount > 0 &&
    memberCount < plannedCount;

  const isPerfect =
    plannedCount !== null &&
    plannedCount !== undefined &&
    plannedCount > 0 &&
    memberCount === plannedCount;

  return {
    ...cellTd,
    backgroundColor: isShort
      ? "#ffe5e5"
      : isPerfect
      ? "#e8f7e8"
      : isToday
      ? "#fffdf0"
      : dayType === "sunday"
      ? "#fff7f7"
      : dayType === "saturday"
      ? "#f7fbff"
      : "#fcfcfc",
    border: isShort
      ? "2px solid #d11a2a"
      : isPerfect
      ? "2px solid #22c55e"
      : cellTd.border,
  };
};

  const fetchData = async () => {
    const startDate = `${month}-01`;
    const endDate = days[days.length - 1];

    const { data: employeeData } = await supabase
      .from("employees")
      .select("name")
      .order("name", { ascending: true });

    setEmployees(employeeData ?? []);

    const { data: vehicleData, error: vehicleError } = await supabase
  .from("vehicles")
  .select("id, vehicle_name, vehicle_type")
  .order("vehicle_name", { ascending: true });

if (vehicleError) {
  alert("車両取得失敗: " + vehicleError.message);
  return;
}

setVehicles(vehicleData ?? []);

    const { data: contractorData } = await supabase
  .from("contractors")
  .select("id, name")
  .order("name", { ascending: true });

setContractors(contractorData ?? []);

const { data: contactData } = await supabase
  .from("contractor_contacts")
  .select("id, contractor_id, manager_name, contact_phone");

setContractorContacts(contactData ?? []);

    const { data: assignmentData, error } = await supabase
      .from("assignments")
      .select("id, assignment_date, site_name, contractor_name, shift_type, start_time, end_time, manager_name, contact_phone, address, meeting_time, planned_count, detail")
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

    const { data: dailyInfoData, error: dailyInfoError } = await supabase
  .from("assignment_site_daily_infos")
  .select("id, assignment_id, work_date, planned_count, detail, vehicle_names")
  .in("assignment_id", assignmentIds)
  .gte("work_date", startDate)
  .lte("work_date", endDate);

  if (dailyInfoError) {
    alert("日別情報取得失敗: " + dailyInfoError.message);
    return;
  }

    setSiteMembers(memberData ?? []);
    setDailyInfos(dailyInfoData ?? []);
    
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
      manager_name: managerName,
contact_phone: contactPhone,
address,
meeting_time: meetingTime,
    });

    if (error) {
      alert("現場追加失敗: " + error.message);
      return;
    }

    setSiteName("");
setContractorName("");
setManagerName("");
setContactPhone("");
setAddress("");
setShiftType("day");
setMeetingTime("08:00");

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
    const { error } = await supabase
      .from("assignment_site_members")
      .update({
        assignment_id: assignmentId,
        work_date: workDate,
      })
      .eq("id", siteMemberId);
  
    if (error) {
      alert("移動失敗: " + error.message);
      return;
    }
  
    setDraggingSiteMemberId(null);
    setSelectedSiteMemberId(null);
  
    fetchData();
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

  const deleteAssignment = async (id: string) => {
    const ok = window.confirm("この現場を削除しますか？");
    if (!ok) return;
  
    const { error } = await supabase
      .from("assignments")
      .delete()
      .eq("id", id);
  
    if (error) {
      alert("現場削除失敗: " + error.message);
      return;
    }
  
    setAssignments((prev) => prev.filter((a) => a.id !== id));
    setSiteMembers((prev) => prev.filter((m) => m.assignment_id !== id));
  };

  const getCellMembers = (assignmentId: string, workDate: string) => {
    return siteMembers.filter(
      (m) => m.assignment_id === assignmentId && m.work_date === workDate
    );
  };

  const getDailyInfo = (assignmentId: string, workDate: string) => {
    return dailyInfos.find(
      (info) =>
        info.assignment_id === assignmentId &&
        info.work_date === workDate
    );
  };
  
  const updateDailyInfo = async (
    assignmentId: string,
    workDate: string,
    field: "planned_count" | "detail" | "vehicle_names",
    value: string
  ) => {
    const existing = getDailyInfo(assignmentId, workDate);
  
    const payload = {
      assignment_id: assignmentId,
      work_date: workDate,
      planned_count:
        field === "planned_count"
          ? Number(value || 0)
          : existing?.planned_count ?? null,
      detail:
        field === "detail"
          ? value
          : existing?.detail ?? null,
          vehicle_names:
  field === "vehicle_names"
    ? value ? value.split(",").filter(Boolean) : []
    : existing?.vehicle_names ?? [],
    };
  
    const { data, error } = await supabase
      .from("assignment_site_daily_infos")
      .upsert(payload, {
        onConflict: "assignment_id,work_date",
      })
      .select("id, assignment_id, work_date, planned_count, detail, vehicle_names")
      .single();
  
    if (error || !data) {
      alert("更新失敗: " + (error?.message || "取得失敗"));
      return;
    }
  
    setDailyInfos((prev) => {
      const exists = prev.some((info) => info.id === data.id);
  
      if (exists) {
        return prev.map((info) => (info.id === data.id ? data : info));
      }
  
      return [...prev, data];
    });
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

        <div style={{ marginBottom: 16 }}>
  <button
    type="button"
    onClick={() => setShowAddModal(true)}
    style={{
      padding: "10px 16px",
      borderRadius: 8,
      border: "none",
      backgroundColor: "#111",
      color: "#fff",
      fontWeight: 700,
      cursor: "pointer",
    }}
  >
    ＋ 現場追加
  </button>
</div>

        {showAddModal && (
  <div
    onClick={() => setShowAddModal(false)}
    style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.45)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
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
        maxHeight: "90vh",
        overflowY: "auto",
      }}
    >
      <h2 style={{ margin: 0 }}>現場追加</h2>

      <div>
        <input
          list="contractors"
          value={contractorName}
          onChange={(e) => {
            setContractorName(e.target.value);
            setManagerName("");
            setContactPhone("");
          }}
          placeholder="元請"
          style={inputStyle}
        />

        <datalist id="contractors">
          {contractors.map((contractor) => (
            <option
              key={contractor.id}
              value={contractor.name}
            />
          ))}
        </datalist>
      </div>

      <input
        value={siteName}
        onChange={(e) => setSiteName(e.target.value)}
        placeholder="現場名"
        style={inputStyle}
      />

      <div>
        <input
          list="manager-list"
          value={managerName}
          onChange={(e) => {
            const value = e.target.value;

            setManagerName(value);

            const contractor = contractors.find(
              (c) => c.name === contractorName
            );

            if (!contractor) return;

            const contact = contractorContacts.find(
              (c) =>
                c.contractor_id === contractor.id &&
                c.manager_name === value
            );

            if (contact) {
              setContactPhone(contact.contact_phone ?? "");
            }
          }}
          placeholder="担当者"
          style={inputStyle}
        />

        <datalist id="manager-list">
          {contractorContacts
            .filter((contact) => {
              const contractor = contractors.find(
                (c) => c.id === contact.contractor_id
              );

              return contractor?.name === contractorName;
            })
            .map((contact) => (
              <option
                key={contact.id}
                value={contact.manager_name}
              />
            ))}
        </datalist>
      </div>

      <input
        value={contactPhone}
        onChange={(e) => setContactPhone(e.target.value)}
        placeholder="連絡先"
        style={inputStyle}
      />

      <input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="住所"
        style={inputStyle}
      />

<div style={{ display: "flex", gap: 8 }}>
  <button
    type="button"
    onClick={() => {
      setShiftType("day");
      setMeetingTime("08:00");
    }}
    style={{
      flex: 1,
      padding: 10,
      borderRadius: 8,
      border: shiftType === "day" ? "2px solid #111" : "1px solid #ccc",
      backgroundColor: shiftType === "day" ? "#f3f3f3" : "#fff",
      fontWeight: 700,
      cursor: "pointer",
    }}
  >
    昼
  </button>

  <button
    type="button"
    onClick={() => {
      setShiftType("night");
      setMeetingTime("20:00");
    }}
    style={{
      flex: 1,
      padding: 10,
      borderRadius: 8,
      border: shiftType === "night" ? "2px solid #111" : "1px solid #ccc",
      backgroundColor: shiftType === "night" ? "#f3f3f3" : "#fff",
      fontWeight: 700,
      cursor: "pointer",
    }}
  >
    夜
  </button>
</div>

      <input
        type="time"
        value={meetingTime}
        onChange={(e) => setMeetingTime(e.target.value)}
        style={inputStyle}
      />

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() => setShowAddModal(false)}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 8,
            border: "1px solid #ccc",
            backgroundColor: "#fff",
          }}
        >
          キャンセル
        </button>

        <button
          type="button"
          onClick={async () => {
            await handleAddSite();
            setShowAddModal(false);
          }}
          style={{
            flex: 1,
            padding: 12,
            border: "none",
            borderRadius: 8,
            backgroundColor: "#111",
            color: "#fff",
            fontWeight: 700,
          }}
        >
          追加
        </button>
      </div>
    </div>
  </div>
)}

<div
  style={{
    overflowX: "auto",
    overflowY: "auto",
    border: "1px solid #ddd",
    borderRadius: 12,
    backgroundColor: "#fff",
    maxHeight: "78vh",
    position: "relative",
  }}
>
<table
  style={{
    borderCollapse: "separate",
    borderSpacing: 0,
              width: "100%",
              backgroundColor: "#fff",
              fontSize: 12,
            }}
          >
            <thead>
              <tr>
              <th style={{ ...th, ...stickyTh1 }}>元請</th>
<th style={{ ...th, ...stickyTh2 }}>現場名</th>
<th style={{ ...th, ...stickyTh3 }}>担当者</th>
<th style={th}>昼/夜</th>

                {days.map((date) => (
                  <th key={date} style={getDateHeaderStyle(date)}>
                  {Number(date.slice(-2))}
                </th>
                ))}
              </tr>
            </thead>

            <tbody>
            {assignments.map((assignment) => (
  <tr
  key={assignment.id}
  style={{
    backgroundColor:
      assignment.shift_type === "night"
        ? "#f3f4f6"
        : "#fff",
  }}
>
    <td style={{ ...td, ...stickyTd1 }}>
  {assignment.contractor_name || "-"}
</td>

<td style={{ ...td, ...stickyTd2, fontWeight: 800 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span>{assignment.site_name || "-"}</span>

        <button
          type="button"
          onClick={() => deleteAssignment(assignment.id)}
          style={{
            backgroundColor: "#d11a2a",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "4px 8px",
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          削除
        </button>
      </div>
    </td>

    <td style={{ ...td, ...stickyTd3 }}>
  {assignment.manager_name || "-"}
</td>

<td
  style={{
    ...td,
    fontWeight: 800,
    color:
      assignment.shift_type === "night"
        ? "#fff"
        : "#111",
    backgroundColor:
      assignment.shift_type === "night"
        ? "#374151"
        : "#f3f4f6",
    textAlign: "center",
  }}
>
  {assignment.shift_type === "night" ? "夜" : "昼"}
</td>

                  {days.map((date) => {
                    const cellMembers = getCellMembers(assignment.id, date);
                    const dailyInfo = getDailyInfo(assignment.id, date);
                    const plannedCount = dailyInfo?.planned_count ?? null;
const memberCount = cellMembers.length;
const isShort =
  plannedCount !== null &&
  plannedCount > 0 &&
  memberCount < plannedCount;

  const isPerfect =
  plannedCount !== null &&
  plannedCount > 0 &&
  memberCount === plannedCount;

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
                        onClick={() => {
                          setSelectedDate(date);
                        
                          if (selectedSiteMemberId) {
                              moveSiteMember(selectedSiteMemberId, assignment.id, date);
                              setSelectedSiteMemberId(null);
                              return;
                            }
                          
                            if (selectedEmployeeName) {
                              addEmployeeToCell(selectedEmployeeName, assignment.id, date);
                              setSelectedEmployeeName(null);
                            }
                          }}
                          style={getCellStyle(date, plannedCount, memberCount)}
                      >
                        <div style={{ display: "grid", gap: 4 }}>
                        <div
  style={{
    fontSize: 11,
    fontWeight: 800,
    color: isShort
      ? "#d11a2a"
      : isPerfect
      ? "#16a34a"
      : "#555",
    display: "grid",
    gap: 2,
    lineHeight: 1.4,
  }}
>
<div>
    予定人数：{plannedCount ?? "-"}
  </div>
  <div>
    人数：{plannedCount ? `${memberCount}/${plannedCount}` : memberCount}
  </div>  
</div>

                        　　　　　　　　　　　　　　　　<input
  type="number"
  value={dailyInfo?.planned_count ?? ""}
  onChange={(e) =>
    updateDailyInfo(
      assignment.id,
      date,
      "planned_count",
      e.target.value
    )
  }
  placeholder="人"
  style={{
    width: "100%",
    padding: "4px 6px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
    backgroundColor: "#fff",
  }}
/>

<input
  value={dailyInfo?.detail ?? ""}
  onChange={(e) =>
    updateDailyInfo(
      assignment.id,
      date,
      "detail",
      e.target.value
    )
  }
  placeholder="詳細"
  style={{
    width: "100%",
    padding: "4px 6px",
    border: "1px solid #e5e7eb",
    borderRadius: 6,
    fontSize: 11,
    backgroundColor: "#fff",
  }}
/>

<div
  style={{
    marginTop: 4,
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#f9fafb",
    fontSize: 11,
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    }}
  >
    <div
      style={{
        fontWeight: 700,
        color: "#555",
      }}
    >
      車両
    </div>

    <button
      type="button"
      onClick={() => {
        setVehicleTarget({
          assignmentId: assignment.id,
          workDate: date,
        });

        setShowVehicleModal(true);
      }}
      style={{
        border: "none",
        backgroundColor: "#111",
        color: "#fff",
        borderRadius: 6,
        padding: "2px 8px",
        fontSize: 10,
        cursor: "pointer",
      }}
    >
      ＋選択
    </button>
  </div>

  {dailyInfo?.vehicle_names?.length ? (
    <div style={{ display: "grid", gap: 2 }}>
      {dailyInfo.vehicle_names.map((name) => (
        <div
          key={name}
          style={{
            padding: "2px 6px",
            borderRadius: 6,
            backgroundColor: "#e0f2fe",
            color: "#0369a1",
            fontWeight: 700,
            width: "fit-content",
          }}
        >
          {name}
        </div>
      ))}
    </div>
  ) : (
    <div style={{ color: "#999" }}>未選択</div>
  )}
</div>

{cellMembers.map((member) => (
  <div
    key={member.id}
    draggable
    onDragStart={() => setDraggingSiteMemberId(member.id)}
    onDragEnd={() => setDraggingSiteMemberId(null)}
    onClick={() => {
      setSelectedSiteMemberId(member.id);
      setSelectedEmployeeName(null);
    }}
    onDoubleClick={() => deleteSiteMember(member.id)}
    style={{
      padding: "4px 8px",
      borderRadius: 10,
      backgroundColor:
        selectedSiteMemberId === member.id ? "#dbeafe" : "#eef2ff",
      border: "1px solid #c7d2fe",
      cursor: "grab",
      fontWeight: 700,
      fontSize: 11,
    }}
  >
    <div style={{ display: "grid", gap: 2 }}>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {member.is_driver && (
          <span style={tagBlue}>運転</span>
        )}

        {member.is_operator && (
          <span style={tagPurple}>OP</span>
        )}

        {member.heavy_equipment && (
          <span style={tagYellow}>{member.heavy_equipment}</span>
        )}
      </div>

      <div>{member.employee_name}</div>
    </div>
  </div>
))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
  style={{
    position: "fixed",
    right: 16,
    top: 90,
    width: 240,
    maxHeight: "75vh",
    overflowY: "auto",
    border: "1px solid #ddd",
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: 12,
    zIndex: 1000,
    boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
  }}
>
  <div style={{ fontWeight: 800, marginBottom: 6 }}>
    {selectedDate ? "未配置メンバー" : "全メンバー"}
  </div>

  <div style={{ fontSize: 12, color: "#666", marginBottom: 10 }}>
    {selectedDate || "日付未選択"}
  </div>

  {selectedDate && (
  <button
    type="button"
    onClick={() => {
      setSelectedDate(null);
      setSelectedEmployeeName(null);
    }}
    style={{
      marginBottom: 10,
      width: "100%",
      padding: "8px 10px",
      borderRadius: 8,
      border: "1px solid #ccc",
      backgroundColor: "#fff",
      cursor: "pointer",
      fontWeight: 700,
    }}
  >
    全員表示
  </button>
)}

  <div style={{ display: "grid", gap: 6 }}>
    {(selectedDate
      ? getUnassignedEmployeesByDate(selectedDate)
      : employees.map((employee) => employee.name)
    ).map((name) => (
      <div
        key={name}
        draggable
        onDragStart={() => setDraggingEmployeeName(name)}
        onDragEnd={() => setDraggingEmployeeName(null)}
        onClick={() => {
          setSelectedEmployeeName(name);
          setSelectedSiteMemberId(null);
        }}
        style={{
          padding: "8px 10px",
          borderRadius: 999,
          backgroundColor:
            selectedEmployeeName === name ? "#dbeafe" : "#fff7ed",
          border: "1px solid #fed7aa",
          cursor: "grab",
          fontWeight: 700,
          fontSize: 13,
        }}
      >
        {name}
      </div>
    ))}
  </div>
</div>

        {showVehicleModal && vehicleTarget && (
  <div
    onClick={() => setShowVehicleModal(false)}
    style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.4)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 99999,
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: 320,
        maxHeight: "70vh",
        overflowY: "auto",
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        display: "grid",
        gap: 8,
      }}
    >
      <h3 style={{ margin: 0 }}>車両選択</h3>

      {vehicles.map((vehicle) => {
        const info = getDailyInfo(
          vehicleTarget.assignmentId,
          vehicleTarget.workDate
        );

        const current = info?.vehicle_names ?? [];

        const checked = current.includes(
          vehicle.vehicle_name
        );

        return (
          <label
            key={vehicle.id}
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              fontSize: 14,
            }}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => {
                const next = e.target.checked
                  ? [...current, vehicle.vehicle_name]
                  : current.filter(
                      (v) =>
                        v !== vehicle.vehicle_name
                    );

                    updateDailyInfo(
                      vehicleTarget.assignmentId,
                      vehicleTarget.workDate,
                      "vehicle_names",
                      next.join(",")
                    );
                    
                    fetchData();
              }}
            />

            {vehicle.vehicle_name}
          </label>
        );
      })}

      <button
        type="button"
        onClick={() => setShowVehicleModal(false)}
        style={{
          marginTop: 8,
          border: "none",
          backgroundColor: "#111",
          color: "#fff",
          borderRadius: 8,
          padding: 10,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        閉じる
      </button>
    </div>
  </div>
)}

        <p style={{ color: "#666", fontSize: 13 }}>
          ※ メンバーを外す場合は、配置済みの名前をダブルクリックしてください。
        </p>
      </div>
    </div>
  );
}

const th = {
  border: "1px solid #ddd",
  padding: 4,
  backgroundColor: "#f5f5f5",
  whiteSpace: "nowrap" as const,
  textAlign: "center" as const,
  position: "sticky" as const,
  top: 0,
  zIndex: 50,
  fontSize: 12,
};

  const td = {
    border: "1px solid #ccc",
    padding: 4,
    whiteSpace: "nowrap" as const,
    verticalAlign: "top" as const,
    backgroundColor: "#fff",
  };

const cellTd = {
    border: "1px solid #e5e7eb",
    padding: 6,
    minWidth: 95,
    height: 140,
    whiteSpace: "pre-wrap" as const,
    verticalAlign: "top" as const,
    backgroundColor: "#fcfcfc",
  };

  const stickyTd1 = {
    position: "sticky" as const,
    left: 0,
    zIndex: 20,
    backgroundColor: "#fff",
    minWidth: 70,
    width: 70,
  };
  
  const stickyTd2 = {
    position: "sticky" as const,
    left: 70,
    zIndex: 20,
    backgroundColor: "#fff",
    minWidth: 140,
    width: 140,
  };
  
  const stickyTd3 = {
    position: "sticky" as const,
    left: 210,
    zIndex: 20,
    backgroundColor: "#fff",
    minWidth: 100,
    width: 100,
  };
  
  const stickyTh1 = {
    position: "sticky" as const,
    left: 0,
    top: 0,
    zIndex: 20,
    backgroundColor: "#f5f5f5",
    minWidth: 70,
    width: 70,
  };
  
  const stickyTh2 = {
    position: "sticky" as const,
    left: 70,
    top: 0,
    zIndex: 20,
    backgroundColor: "#f5f5f5",
    minWidth: 140,
    width: 140,
  };
  
  const stickyTh3 = {
    position: "sticky" as const,
    left: 210,
    top: 0,
    zIndex: 20,
    backgroundColor: "#f5f5f5",
    minWidth: 100,
    width: 100,
  };

  const tagBlue = {
    fontSize: 10,
    padding: "1px 6px",
    borderRadius: 999,
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
    fontWeight: 700,
  };
  
  const tagPurple = {
    fontSize: 10,
    padding: "1px 6px",
    borderRadius: 999,
    backgroundColor: "#ede9fe",
    color: "#6d28d9",
    fontWeight: 700,
  };
  
  const tagYellow = {
    fontSize: 10,
    padding: "1px 6px",
    borderRadius: 999,
    backgroundColor: "#fef3c7",
    color: "#b45309",
    fontWeight: 700,
  };