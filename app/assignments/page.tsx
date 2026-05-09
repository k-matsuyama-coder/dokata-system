"use client";

import { useEffect, useState } from "react";
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

export default function AssignmentsPage() {
    const [date, setDate] = useState(() => {
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const dateParam = params.get("date");
      
          if (dateParam) return dateParam;
        }
      
        return new Date().toISOString().slice(0, 10);
      });
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const [siteName, setSiteName] = useState("");
  const [contractorName, setContractorName] = useState("");
  const [shiftType, setShiftType] = useState("day");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [employees, setEmployees] = useState<{ name: string }[]>([]);
  const [unassignedEmployees, setUnassignedEmployees] = useState<string[]>([]);

const [assignmentMembers, setAssignmentMembers] = useState<
  AssignmentMember[]
>([]);

const [memberInput, setMemberInput] = useState<{
  [key: string]: string;
}>({});

  const fetchAssignments = async () => {
    const { data, error } = await supabase
      .from("assignments")
      .select("id, assignment_date, site_name, contractor_name, shift_type, start_time, end_time")
      .eq("assignment_date", date)
      .order("sort_order", { ascending: true });

    if (error) {
      alert("番割取得失敗: " + error.message);
      return;
    }

    setAssignments(data ?? []);
  };

  const fetchEmployees = async () => {
    const { data } = await supabase
      .from("employees")
      .select("name")
      .order("name", { ascending: true });
  
    setEmployees(data ?? []);
  };

  const fetchAssignmentMembers = async () => {
    const { data } = await supabase
      .from("assignment_members")
      .select("*");
  
    setAssignmentMembers(data ?? []);
  };

  const fetchUnassignedEmployees = async () => {
  const { data: employeeData } = await supabase
    .from("employees")
    .select("name")
    .order("name", { ascending: true });

  const assignedNames = assignmentMembers.map(
    (m) => m.employee_name
  );

  const filtered =
    employeeData
      ?.map((e) => e.name)
      .filter((name) => !assignedNames.includes(name)) ?? [];

  setUnassignedEmployees(filtered);
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

      await fetchAssignments();
await fetchEmployees();
await fetchAssignmentMembers();
    };

    checkAdmin();
  }, [date]);

  useEffect(() => {
    fetchUnassignedEmployees();
  }, [assignmentMembers]);

  const handleAdd = async () => {
    if (!siteName || !contractorName) {
      alert("現場名と元請を入力してください");
      return;
    }

    const { error } = await supabase.from("assignments").insert({
      assignment_date: date,
      site_name: siteName,
      contractor_name: contractorName,
      shift_type: shiftType,
      start_time: startTime,
      end_time: endTime,
    });

    if (error) {
      alert("追加失敗: " + error.message);
      return;
    }

    setSiteName("");
    setContractorName("");
    setShiftType("day");
    setStartTime("08:00");
    setEndTime("17:00");

    fetchAssignments();
  };

  const handleDelete = async (id: string) => {
    const ok = window.confirm("この番割を削除しますか？");
    if (!ok) return;

    const { error } = await supabase.from("assignments").delete().eq("id", id);

    if (error) {
      alert("削除失敗: " + error.message);
      return;
    }

    fetchAssignments();
  };

  const handleMove = async (
    currentIndex: number,
    direction: "up" | "down"
  ) => {
    const newAssignments = [...assignments];
  
    const targetIndex =
      direction === "up"
        ? currentIndex - 1
        : currentIndex + 1;
  
    if (
      targetIndex < 0 ||
      targetIndex >= newAssignments.length
    ) {
      return;
    }
  
    const temp = newAssignments[currentIndex];
    newAssignments[currentIndex] =
      newAssignments[targetIndex];
    newAssignments[targetIndex] = temp;
  
    setAssignments(newAssignments);
  
    for (let i = 0; i < newAssignments.length; i++) {
      await supabase
        .from("assignments")
        .update({
          sort_order: i,
        })
        .eq("id", newAssignments[i].id);
    }
  
    fetchAssignments();
  };

  const handleAddMember = async (
    assignmentId: string,
    employeeName: string
  ) => {
    const exists = assignmentMembers.some(
      (m) =>
        m.assignment_id === assignmentId &&
        m.employee_name === employeeName
    );
  
    if (exists) return;
  
    const { error } = await supabase
      .from("assignment_members")
      .insert({
        assignment_id: assignmentId,
        employee_name: employeeName,
      });
  
    if (error) {
      alert("メンバー追加失敗: " + error.message);
      return;
    }
  
    setMemberInput((prev) => ({
      ...prev,
      [assignmentId]: "",
    }));
  
    fetchAssignmentMembers();
  };

  const inputStyle = {
    width: "100%",
    padding: 12,
    border: "1px solid #ccc",
    borderRadius: 8,
    fontSize: 16,
    boxSizing: "border-box" as const,
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
      <BackButton />

      <h1>番割</h1>

      <div style={{ marginBottom: 16 }}>
        <p>日付</p>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={inputStyle}
        />
      </div>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 16,
          backgroundColor: "#fff",
          marginBottom: 20,
          display: "grid",
          gap: 12,
        }}
      >
        <h2 style={{ margin: 0 }}>現場追加</h2>

        <div>
          <p>元請</p>
          <input
            value={contractorName}
            onChange={(e) => setContractorName(e.target.value)}
            placeholder="元請名"
            style={inputStyle}
          />
        </div>

        <div>
          <p>現場名</p>
          <input
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            placeholder="現場名"
            style={inputStyle}
          />
        </div>

        <div>
          <p>昼 / 夜</p>
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
                padding: 12,
                borderRadius: 8,
                border: shiftType === "day" ? "2px solid #111" : "1px solid #ccc",
                backgroundColor: shiftType === "day" ? "#f3f3f3" : "#fff",
                cursor: "pointer",
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
                padding: 12,
                borderRadius: 8,
                border: shiftType === "night" ? "2px solid #111" : "1px solid #ccc",
                backgroundColor: shiftType === "night" ? "#f3f3f3" : "#fff",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              夜
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <p>開始</p>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <p>終了</p>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          style={{
            width: "100%",
            padding: 14,
            backgroundColor: "#111",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          ＋ 現場を追加
        </button>
      </div>

      <h2>{date} の番割</h2>

      <div
  style={{
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#fff8e1",
    border: "1px solid #f0d98a",
    borderRadius: 12,
  }}
>
  <p
    style={{
      margin: 0,
      fontWeight: 800,
      marginBottom: 10,
    }}
  >
    未配置メンバー
  </p>

  {unassignedEmployees.length === 0 ? (
    <p style={{ margin: 0 }}>全員配置済み</p>
  ) : (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
      }}
    >
      {unassignedEmployees.map((name) => (
        <div
          key={name}
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            backgroundColor: "#fff",
            border: "1px solid #ddd",
            fontSize: 14,
          }}
        >
          {name}
        </div>
      ))}
    </div>
  )}
</div>

      {assignments.length === 0 ? (
        <p>番割がありません</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {assignments.map((assignment, index) => (
            <div
              key={assignment.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 12,
                padding: 16,
                backgroundColor: "#fff",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 18 }}>
                    {assignment.site_name}
                  </p>
                  <p style={{ margin: "6px 0 0 0", color: "#555" }}>
                    元請: {assignment.contractor_name || "-"}
                  </p>
                  <p style={{ margin: "6px 0 0 0", color: "#555" }}>
                    {assignment.shift_type === "night" ? "夜" : "昼"}　
                    {assignment.start_time}〜{assignment.end_time}
                  </p>
                </div>

                <div
  style={{
    display: "flex",
    gap: 6,
  }}
>
  <button
    type="button"
    onClick={() => handleMove(index, "up")}
    style={{
      border: "none",
      borderRadius: 8,
      padding: "6px 10px",
      cursor: "pointer",
    }}
  >
    ↑
  </button>

  <button
    type="button"
    onClick={() => handleMove(index, "down")}
    style={{
      border: "none",
      borderRadius: 8,
      padding: "6px 10px",
      cursor: "pointer",
    }}
  >
    ↓
  </button>
</div>

                <button
                  type="button"
                  onClick={() => handleDelete(assignment.id)}
                  style={{
                    backgroundColor: "#d11a2a",
                    color: "#fff",
                    border: "none",
                    padding: "8px 12px",
                    borderRadius: 8,
                    cursor: "pointer",
                    height: 36,
                  }}
                >
                  削除
                </button>
              </div>

              <div
  style={{
    marginTop: 12,
    padding: 12,
    backgroundColor: "#fafafa",
    borderRadius: 8,
  }}
>
  <input
    value={memberInput[assignment.id] || ""}
    onChange={(e) =>
      setMemberInput((prev) => ({
        ...prev,
        [assignment.id]: e.target.value,
      }))
    }
    placeholder="メンバー追加"
    style={inputStyle}
  />

  {(memberInput[assignment.id] || "") && (
    <div
      style={{
        marginTop: 8,
        border: "1px solid #ddd",
        borderRadius: 8,
        backgroundColor: "#fff",
      }}
    >
      {employees
        .filter((employee) =>
          employee.name.includes(memberInput[assignment.id] || "")
        )
        .slice(0, 5)
        .map((employee) => (
          <div
            key={employee.name}
            onMouseDown={(e) => {
              e.preventDefault();
              handleAddMember(assignment.id, employee.name);
            }}
            style={{
              padding: 10,
              cursor: "pointer",
              borderBottom: "1px solid #eee",
            }}
          >
            {employee.name}
          </div>
        ))}
    </div>
  )}

  <div
    style={{
      display: "grid",
      gap: 8,
      marginTop: 12,
    }}
  >
    {assignmentMembers
      .filter((m) => m.assignment_id === assignment.id)
      .map((member) => (
        <div
          key={member.id}
          style={{
            padding: 10,
            borderRadius: 8,
            backgroundColor: "#fff",
            border: "1px solid #ddd",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
  style={{
    display: "flex",
    flexDirection: "column",
    gap: 8,
    width: "100%",
  }}
>
  <div style={{ fontWeight: 700 }}>
    {member.employee_name}
  </div>

  <div
    style={{
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
    }}
  >
    <button
      type="button"
      onClick={async () => {
        await supabase
          .from("assignment_members")
          .update({
            is_driver: !member.is_driver,
          })
          .eq("id", member.id);

        fetchAssignmentMembers();
      }}
      style={{
        padding: "6px 10px",
        borderRadius: 8,
        border: "none",
        cursor: "pointer",
        backgroundColor: member.is_driver
          ? "#111"
          : "#ddd",
        color: member.is_driver
          ? "#fff"
          : "#111",
      }}
    >
      🚗 運転
    </button>

    <button
      type="button"
      onClick={async () => {
        await supabase
          .from("assignment_members")
          .update({
            is_operator: !member.is_operator,
          })
          .eq("id", member.id);

        fetchAssignmentMembers();
      }}
      style={{
        padding: "6px 10px",
        borderRadius: 8,
        border: "none",
        cursor: "pointer",
        backgroundColor: member.is_operator
          ? "#0a66c2"
          : "#ddd",
        color: member.is_operator
          ? "#fff"
          : "#111",
      }}
    >
      OP
    </button>

    <select
      value={member.heavy_equipment || ""}
      onChange={async (e) => {
        await supabase
          .from("assignment_members")
          .update({
            heavy_equipment: e.target.value,
          })
          .eq("id", member.id);

        fetchAssignmentMembers();
      }}
      style={{
        padding: 6,
        borderRadius: 8,
      }}
    >
      <option value="">重機なし</option>
      <option value="ブル">ブル</option>
      <option value="グレーダー">グレーダー</option>
      <option value="AF">AF</option>
    </select>
  </div>

  <button
  type="button"
  onClick={async () => {
    const ok = window.confirm("削除しますか？");
    if (!ok) return;

    await supabase
      .from("assignment_members")
      .delete()
      .eq("id", member.id);

    fetchAssignmentMembers();
  }}
  style={{
    marginTop: 8,
    backgroundColor: "#d11a2a",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "6px 10px",
    cursor: "pointer",
  }}
>
  削除
</button>

</div>
        </div>
      ))}
  </div>
</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}