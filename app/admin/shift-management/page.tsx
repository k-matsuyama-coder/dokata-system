"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";

type Employee = {
  name: string;
  role: string | null;
  company_name: string | null;
};

type ShiftRequest = {
  id: string;
  employee_name: string;
  request_date: string;
  request_type: string;
  memo: string | null;
  status: string;
};

export default function ShiftManagementPage() {
  const [month, setMonth] = useState(() =>
    new Date().toISOString().slice(0, 7)
  );

  const [loginEmployee, setLoginEmployee] = useState<Employee | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [requests, setRequests] = useState<ShiftRequest[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [memo, setMemo] = useState("");

  const isAdmin = loginEmployee?.role === "admin";

  const days = useMemo(() => {
    const [year, monthNum] = month.split("-").map(Number);
    const lastDay = new Date(year, monthNum, 0).getDate();

    return Array.from({ length: lastDay }, (_, i) => {
      const day = i + 1;
      return `${month}-${String(day).padStart(2, "0")}`;
    });
  }, [month]);

  const fetchData = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data: employeeData, error: employeeError } = await supabase
      .from("employees")
      .select("name, role, company_name")
      .eq("auth_user_id", user.id)
      .single();

    if (employeeError || !employeeData) {
      alert("社員情報を取得できませんでした");
      return;
    }

    setLoginEmployee(employeeData);

    const { data: allEmployees } = await supabase
      .from("employees")
      .select("name, role, company_name")
      .order("company_name", { ascending: true })
      .order("name", { ascending: true });

      if (employeeData.role === "admin") {
        setEmployees(allEmployees ?? []);
      } else {
        setEmployees([employeeData]);
      }

    const startDate = `${month}-01`;
    const endDate = days[days.length - 1];

    let query = supabase
      .from("shift_requests")
      .select("id, employee_name, request_date, request_type, memo, status")
      .gte("request_date", startDate)
      .lte("request_date", endDate)
      .order("request_date", { ascending: true });

    if (employeeData.role !== "admin") {
      query = query.eq("employee_name", employeeData.name);
    }

    const { data: requestData, error: requestError } = await query;

    if (requestError) {
      alert("シフト取得失敗: " + requestError.message);
      return;
    }

    setRequests(requestData ?? []);
  };

  useEffect(() => {
    fetchData();
  }, [month, days.length]);

  const addRequest = async () => {
    if (!loginEmployee) return;

    if (!selectedDate) {
      alert("日付を選択してください");
      return;
    }

    const exists = requests.some(
      (request) =>
        request.employee_name === loginEmployee.name &&
        request.request_date === selectedDate
    );

    if (exists) {
      alert("この日はすでに休み希望を出しています");
      return;
    }

    const { error } = await supabase.from("shift_requests").insert({
      employee_name: loginEmployee.name,
      request_date: selectedDate,
      request_type: "休み希望",
      memo: memo || null,
      status: "希望",
    });

    if (error) {
      alert("登録失敗: " + error.message);
      return;
    }

    setSelectedDate("");
    setMemo("");
    fetchData();
  };

  const deleteRequest = async (id: string) => {
    const ok = window.confirm("この休み希望を削除しますか？");
    if (!ok) return;

    const { error } = await supabase
      .from("shift_requests")
      .delete()
      .eq("id", id);

    if (error) {
      alert("削除失敗: " + error.message);
      return;
    }

    fetchData();
  };

  const addRequestForAdmin = async (
    employeeName: string,
    requestDate: string
  ) => {
    if (!isAdmin) return;
  
    const exists = requests.some(
      (request) =>
        request.employee_name === employeeName &&
        request.request_date === requestDate
    );
  
    if (exists) {
      alert("すでに休み希望があります");
      return;
    }
  
    const { error } = await supabase.from("shift_requests").insert({
      employee_name: employeeName,
      request_date: requestDate,
      request_type: "休み希望",
      memo: null,
      status: "希望",
    });
  
    if (error) {
      alert("登録失敗: " + error.message);
      return;
    }
  
    fetchData();
  };

  const getRequestsByEmployeeAndDate = (employeeName: string, date: string) => {
    return requests.filter(
      (request) =>
        request.employee_name === employeeName &&
        request.request_date === date
    );
  };

  const getMyRequestsByDate = (date: string) => {
    if (!loginEmployee) return [];

    return requests.filter(
      (request) =>
        request.employee_name === loginEmployee.name &&
        request.request_date === date
    );
  };

  return (
    <div style={{ padding: 16, backgroundColor: "#f5f6f8", minHeight: "100vh" }}>
      <BackButton />

      <h1>シフト管理表</h1>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={inputStyle}
        />

        <div style={{ fontWeight: 800 }}>
          {isAdmin ? "管理者表示" : "自分の休み希望"}
        </div>
      </div>

      {!isAdmin && (
        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            display: "grid",
            gap: 10,
          }}
        >
          <h2 style={{ margin: 0 }}>休み希望を追加</h2>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={inputStyle}
          />

          <input
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="メモ 任意"
            style={inputStyle}
          />

          <button type="button" onClick={addRequest} style={blackButton}>
            休み希望を登録
          </button>
        </div>
      )}

      {isAdmin ? (
        <div
          style={{
            overflowX: "auto",
            border: "1px solid #ddd",
            borderRadius: 12,
            backgroundColor: "#fff",
            maxHeight: "78vh",
          }}
        >
          <table
            style={{
              borderCollapse: "separate",
              borderSpacing: 0,
              minWidth: 1600,
              width: "100%",
              fontSize: 12,
            }}
          >
            <thead>
              <tr>
                <th style={{ ...th, ...stickyNameTh }}>名前</th>
                <th style={th}>会社</th>

                {days.map((date) => {
                  const day = new Date(date).getDay();

                  return (
                    <th
                      key={date}
                      style={{
                        ...th,
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
                            : "#111",
                      }}
                    >
                      {Number(date.slice(-2))}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {employees.map((employee) => (
                <tr key={employee.name}>
                  <td style={{ ...td, ...stickyNameTd }}>
                    {employee.name}
                  </td>

                  <td style={td}>
                    {employee.company_name || "-"}
                  </td>

                  {days.map((date) => {
                    const dayRequests = getRequestsByEmployeeAndDate(
                      employee.name,
                      date
                    );

                    return (
                      <td
  key={date}
  onClick={() => {
    if (dayRequests.length === 0) {
      addRequestForAdmin(employee.name, date);
    }
  }}
  style={{
    ...td,
    textAlign: "center",
    backgroundColor:
      dayRequests.length > 0 ? "#fef3c7" : "#fff",
    cursor: "pointer",
  }}
>
                        {dayRequests.map((request) => (
                          <div
                          key={request.id}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            deleteRequest(request.id);
                          }}
                          title="ダブルタップで削除"
                          style={{
                            display: "grid",
                            gap: 4,
                            justifyItems: "center",
                            cursor: "pointer",
                          }}
                        >
                            <div
                              style={{
                                fontWeight: 900,
                                color: "#b45309",
                              }}
                            >
                              休
                            </div>

                            {request.memo && (
                              <div style={{ fontSize: 10 }}>
                                {request.memo}
                              </div>
                            )}
                          </div>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 6,
          }}
        >
          {["日", "月", "火", "水", "木", "金", "土"].map((day) => (
            <div
              key={day}
              style={{
                textAlign: "center",
                fontWeight: 800,
                backgroundColor: "#e5e7eb",
                borderRadius: 8,
                padding: 8,
              }}
            >
              {day}
            </div>
          ))}

          {Array.from({
            length: new Date(`${month}-01`).getDay(),
          }).map((_, index) => (
            <div key={`empty-${index}`} />
          ))}

          {days.map((date) => {
            const day = new Date(date).getDay();
            const myRequests = getMyRequestsByDate(date);

            return (
              <div
                key={date}
                style={{
                  minHeight: 90,
                  backgroundColor:
                    myRequests.length > 0
                      ? "#fef3c7"
                      : day === 0
                      ? "#fff7f7"
                      : day === 6
                      ? "#f7fbff"
                      : "#fff",
                  border: "1px solid #ddd",
                  borderRadius: 10,
                  padding: 8,
                }}
              >
                <div
                  style={{
                    fontWeight: 900,
                    color:
                      day === 0
                        ? "#dc2626"
                        : day === 6
                        ? "#2563eb"
                        : "#111",
                    marginBottom: 6,
                  }}
                >
                  {Number(date.slice(-2))}
                </div>

                {myRequests.map((request) => (
                  <div
                  key={request.id}
                  onDoubleClick={() => deleteRequest(request.id)}
                  title="ダブルタップで削除"
                  style={{
                    fontWeight: 800,
                    color: "#b45309",
                    cursor: "pointer",
                  }}
                >
                    休み希望
                    {request.memo && (
                      <div style={{ fontSize: 12, color: "#555" }}>
                        {request.memo}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ccc",
  fontSize: 16,
  backgroundColor: "#fff",
};

const blackButton = {
  padding: 12,
  border: "none",
  borderRadius: 8,
  backgroundColor: "#111",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};

const th = {
  border: "1px solid #ddd",
  padding: 6,
  backgroundColor: "#f3f4f6",
  position: "sticky" as const,
  top: 0,
  zIndex: 20,
  whiteSpace: "nowrap" as const,
  textAlign: "center" as const,
};

const td = {
  border: "1px solid #e5e7eb",
  padding: 6,
  backgroundColor: "#fff",
  whiteSpace: "nowrap" as const,
  verticalAlign: "top" as const,
};

const stickyNameTh = {
  left: 0,
  zIndex: 40,
  minWidth: 120,
};

const stickyNameTd = {
  position: "sticky" as const,
  left: 0,
  zIndex: 10,
  minWidth: 120,
  fontWeight: 800,
};