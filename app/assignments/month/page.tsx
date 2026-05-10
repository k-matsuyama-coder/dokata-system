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
planned_count: number | null;
detail: string | null;
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
const [plannedCount, setPlannedCount] = useState("");
const [detail, setDetail] = useState("");

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
      manager_name: managerName,
contact_phone: contactPhone,
address,
meeting_time: meetingTime,
planned_count: Number(plannedCount || 0),
detail,
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
setPlannedCount("");
setDetail("");

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

  const updateAssignmentField = async (
    assignmentId: string,
    field: string,
    value: string | number
  ) => {
    const { error } = await supabase
      .from("assignments")
      .update({
        [field]: value,
      })
      .eq("id", assignmentId);
  
    if (error) {
      alert("更新失敗: " + error.message);
      return;
    }
  
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === assignmentId
          ? {
              ...a,
              [field]: value,
            }
          : a
      )
    );
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
<th style={th}>担当者</th>
<th style={th}>連絡先</th>
<th style={th}>住所</th>
<th style={th}>昼/夜</th>
<th style={th}>集合時間</th>
<th style={th}>予定人数</th>
<th style={th}>詳細</th>

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

    <td style={{ ...td, fontWeight: 800 }}>
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

    <td style={td}>{assignment.manager_name || "-"}</td>

    <td style={td}>{assignment.contact_phone || "-"}</td>

    <td style={td}>
      {assignment.address ? (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            assignment.address
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#0a66c2", fontWeight: 700 }}
        >
          地図
        </a>
      ) : (
        "-"
      )}
    </td>

    <td style={td}>{assignment.shift_type === "night" ? "夜" : "昼"}</td>

    <td style={td}>{assignment.meeting_time || "-"}</td>

    <td style={td}>
  <input
    type="number"
    value={assignment.planned_count ?? ""}
    onChange={(e) =>
      updateAssignmentField(
        assignment.id,
        "planned_count",
        Number(e.target.value)
      )
    }
    style={{
      width: 60,
      padding: 4,
      border: "1px solid #ccc",
      borderRadius: 4,
    }}
  />
</td>

<td style={td}>
  <textarea
    value={assignment.detail || ""}
    onChange={(e) =>
      updateAssignmentField(
        assignment.id,
        "detail",
        e.target.value
      )
    }
    style={{
      width: 180,
      minHeight: 60,
      padding: 6,
      border: "1px solid #ccc",
      borderRadius: 4,
      resize: "vertical",
    }}
  />
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
                <td style={{ ...td, fontWeight: 800 }} colSpan={9}>
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