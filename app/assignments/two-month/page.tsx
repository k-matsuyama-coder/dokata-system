"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";

type DailyInfo = {
  id: string;
  assignment_id: string;
  work_date: string;
  planned_count: number | null;
  detail: string | null;
};

type Assignment = {
  id: string;
  site_name: string | null;
  contractor_name: string | null;
  construction_type: string | null;
  manager_name: string | null;
  shift_type: string | null;
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

export default function TwoMonthPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [dailyInfos, setDailyInfos] = useState<DailyInfo[]>([]);
  const [baseMonth, setBaseMonth] = useState(() => {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth() + 1;
  
    if (month % 2 !== 0) {
      month -= 1;
    }
  
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  
    return `${year}-${String(month).padStart(2, "0")}`;
  });
  const [siteName, setSiteName] = useState("");
const [contractorName, setContractorName] = useState("");
const [managerName, setManagerName] = useState("");
const [contactPhone, setContactPhone] = useState("");
const [address, setAddress] = useState("");
const [shiftType, setShiftType] = useState("day");
const [meetingTime, setMeetingTime] = useState("08:00");
const [showAddModal, setShowAddModal] = useState(false);
const [constructionType, setConstructionType] = useState("第一工事");
const [sortMode, setSortMode] = useState("manual");

const [contractors, setContractors] = useState<Contractor[]>([]);
const [contractorContacts, setContractorContacts] = useState<ContractorContact[]>([]);

const days = useMemo(() => {
    const [year, month] = baseMonth.split("-").map(Number);
    const start = new Date(year, month - 1, 1);
  
    return Array.from({ length: 62 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
  
      const y = d.getFullYear();
const m = String(d.getMonth() + 1).padStart(2, "0");
const day = String(d.getDate()).padStart(2, "0");

return `${y}-${m}-${day}`;
    });
  }, [baseMonth]);

  const fetchData = async () => {
    const startDate = days[0];
    const endDate = days[days.length - 1];
    const { data: contractorData } = await supabase
  .from("contractors")
  .select("id, name")
  .order("name", { ascending: true });

setContractors(contractorData ?? []);

const { data: contactData } = await supabase
  .from("contractor_contacts")
  .select("id, contractor_id, manager_name, contact_phone");

setContractorContacts(contactData ?? []);

    const { data: assignmentData, error: assignmentError } = await supabase
      .from("assignments")
      .select(`
  id,
  site_name,
  contractor_name,
  construction_type,
  manager_name,
  shift_type
`)
      .order("created_at", { ascending: true });

    if (assignmentError) {
      alert("現場取得失敗: " + assignmentError.message);
      return;
    }

    const assignmentIds = assignmentData?.map((a) => a.id) ?? [];

    if (assignmentIds.length === 0) {
      setAssignments([]);
      setDailyInfos([]);
      return;
    }

    const { data: dailyInfoData, error: dailyInfoError } = await supabase
      .from("assignment_site_daily_infos")
      .select(`
  id,
  assignment_id,
  work_date,
  planned_count,
  detail
`)
      .in("assignment_id", assignmentIds)
      .gte("work_date", startDate)
      .lte("work_date", endDate);

    if (dailyInfoError) {
      alert("工程表取得失敗: " + dailyInfoError.message);
      return;
    }

    setAssignments(assignmentData ?? []);
    setDailyInfos(dailyInfoData ?? []);
  };

  useEffect(() => {
    fetchData();
  }, [baseMonth]);

  useEffect(() => {
    const channel = supabase
      .channel("two-month-realtime")
  
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assignment_site_daily_infos",
        },
        () => {
          fetchData();
        }
      )
  
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assignments",
        },
        () => {
          fetchData();
        }
      )
  
      .subscribe();
  
    return () => {
      supabase.removeChannel(channel);
    };
  }, [baseMonth]);

  const getPlannedCount = (assignmentId: string, workDate: string) => {
    return (
      dailyInfos.find(
        (d) => d.assignment_id === assignmentId && d.work_date === workDate
      )?.planned_count ?? ""
    );
  };

  const getDetail = (
    assignmentId: string,
    workDate: string
  ) => {
    return (
      dailyInfos.find(
        (d) =>
          d.assignment_id === assignmentId &&
          d.work_date === workDate
      )?.detail ?? ""
    );
  };

  const getDailyTotal = (workDate: string) => {
    return dailyInfos
      .filter((d) => d.work_date === workDate)
      .reduce(
        (sum, d) => sum + (d.planned_count ?? 0),
        0
      );
  };

  const getWorkingEmployeeCount = (workDate: string) => {
    const names = siteMembers
      .filter((m) => m.work_date === workDate)
      .map((m) => m.employee_name);
  
    return new Set(names).size;
  };

  const getMonthlyTotal = (
    assignmentId: string,
    targetMonthIndex: 0 | 1
  ) => {

    const [baseYear, baseMonthNum] = baseMonth.split("-").map(Number);
  
    const targetDate = new Date(
      baseYear,
      baseMonthNum - 1 + targetMonthIndex,
      1
    );
  
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth() + 1;
  
    return dailyInfos
      .filter((d) => {
        const [year, month] = d.work_date.split("-").map(Number);
  
        return (
          d.assignment_id === assignmentId &&
          year === targetYear &&
          month === targetMonth
        );
      })
      .reduce((sum, d) => sum + (d.planned_count ?? 0), 0);
  };

  const getBandColor = (assignment: Assignment) => {
    if (assignment.construction_type === "第二工事") {
      return "#dbeafe";
    }
  
    return "#dcfce7";
  };

  const handleAddSite = async () => {
    if (!siteName || !contractorName) {
      alert("元請と現場名を入力してください");
      return;
    }
  
    const { error } = await supabase.from("assignments").insert({
      assignment_date: days[0],
      contractor_name: contractorName,
      site_name: siteName,
      shift_type: shiftType,
      manager_name: managerName,
      contact_phone: contactPhone,
      address,
      meeting_time: meetingTime,
      construction_type: constructionType,
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
    setShowAddModal(false);
  
    fetchData();
  };

  const updateDailyInfo = async (
    assignmentId: string,
    workDate: string,
    field: "planned_count" | "detail",
    value: string
  ) => {
    const existing = dailyInfos.find(
      (d) =>
        d.assignment_id === assignmentId &&
        d.work_date === workDate
    );
  
    const payload = {
      assignment_id: assignmentId,
      work_date: workDate,
      planned_count:
        field === "planned_count"
          ? value === ""
            ? null
            : Number(value)
          : existing?.planned_count ?? null,
      detail:
        field === "detail"
          ? value
          : existing?.detail ?? null,
    };
  
    const { data, error } = await supabase
      .from("assignment_site_daily_infos")
      .upsert(payload, {
        onConflict: "assignment_id,work_date",
      })
      .select("id, assignment_id, work_date, planned_count, detail")
      .single();
  
    if (error || !data) {
      alert("更新失敗: " + (error?.message || "取得失敗"));
      return;
    }
  
    setDailyInfos((prev) => {
      const exists = prev.some(
        (d) =>
          d.assignment_id === assignmentId &&
          d.work_date === workDate
      );
  
      if (exists) {
        return prev.map((d) =>
          d.assignment_id === assignmentId &&
          d.work_date === workDate
            ? data
            : d
        );
      }
  
      return [...prev, data];
    });
  };

  const sortedAssignments = [...assignments].sort((a, b) => {
    switch (sortMode) {
      case "site":
        return (a.site_name || "").localeCompare(
          b.site_name || "",
          "ja"
        );
  
      case "contractor":
        return (a.contractor_name || "").localeCompare(
          b.contractor_name || "",
          "ja"
        );
  
      case "manager":
        return (a.manager_name || "").localeCompare(
          b.manager_name || "",
          "ja"
        );
  
      case "construction":
        return (a.construction_type || "").localeCompare(
          b.construction_type || "",
          "ja"
        );
  
      case "shift":
        return (a.shift_type || "").localeCompare(
          b.shift_type || "",
          "ja"
        );
  
      default:
        return 0;
    }
  });

  return (
    <div style={{ padding: 16 }}>
      <BackButton />

      <h1>2ヶ月工程表</h1>

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
    onClick={() => {
      const [year, month] = baseMonth.split("-").map(Number);
      const d = new Date(year, month - 3, 1);
      setBaseMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }}
    style={smallButton}
  >
    前の2ヶ月
  </button>

  <strong>
    {baseMonth.replace("-", "年")}月〜
  </strong>

  <button
    type="button"
    onClick={() => {
      const [year, month] = baseMonth.split("-").map(Number);
      const d = new Date(year, month + 1, 1);
      setBaseMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }}
    style={smallButton}
  >
    次の2ヶ月
  </button>
</div>

<div
  style={{
    display: "flex",
    gap: 8,
    marginBottom: 16,
    flexWrap: "wrap",
  }}
>
  <select
    value={sortMode}
    onChange={(e) => setSortMode(e.target.value)}
    style={{
      padding: "8px 12px",
      borderRadius: 8,
      border: "1px solid #ccc",
      fontWeight: 700,
    }}
  >
    <option value="manual">標準</option>
    <option value="site">現場順</option>
    <option value="contractor">元請順</option>
    <option value="manager">担当者順</option>
    <option value="construction">工事区分順</option>
    <option value="shift">昼夜順</option>
  </select>
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
      }}
    >
      <h2 style={{ margin: 0 }}>現場追加</h2>

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
          <option key={contractor.id} value={contractor.name} />
        ))}
      </datalist>

      <input
        value={siteName}
        onChange={(e) => setSiteName(e.target.value)}
        placeholder="現場名"
        style={inputStyle}
      />

<select
  value={constructionType}
  onChange={(e) => setConstructionType(e.target.value)}
  style={inputStyle}
>
  <option value="第一工事">第一工事</option>
  <option value="第二工事">第二工事</option>
</select>

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
            <option key={contact.id} value={contact.manager_name} />
          ))}
      </datalist>

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
          onClick={handleAddSite}
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
          border: "1px solid #ddd",
          borderRadius: 12,
          backgroundColor: "#fff",
        }}
      >
        <table
          style={{
            borderCollapse: "collapse",
            minWidth: 2200,
            width: "100%",
            fontSize: 12,
          }}
        >
          <thead>
  {/* 日付ヘッダー */}
  <tr>
    <th style={stickyTh}>現場名</th>

    <th style={th}>前月合計</th>
    <th style={th}>後月合計</th>

    {days.map((date) => {
  const day = new Date(date).getDay();

  const isSunday = day === 0;
  const isSaturday = day === 6;

  return (
    <th
      key={date}
      style={{
        ...th,
        backgroundColor: isSunday
          ? "#ffe5e5"
          : isSaturday
          ? "#e5f0ff"
          : "#f5f5f5",
        color: isSunday
          ? "#d11a2a"
          : isSaturday
          ? "#2563eb"
          : "#111",
      }}
    >
      {date.slice(5).replace("-", "/")}
    </th>
  );
})}
  </tr>

  {/* 日別合計 */}
  <tr>
    <th style={stickyTh}>
      日別合計
    </th>

    <th style={th}></th>
    <th style={th}></th>

    {days.map((date) => {
  const day = new Date(date).getDay();

  const isSunday = day === 0;
  const isSaturday = day === 6;

  return (
    <th
      key={date}
      style={{
        ...th,
        fontWeight: 800,
        backgroundColor: isSunday
          ? "#ffe5e5"
          : isSaturday
          ? "#e5f0ff"
          : "#f9fafb",
        color: isSunday
          ? "#d11a2a"
          : isSaturday
          ? "#2563eb"
          : "#111",
      }}
    >
      <div>
  {getWorkingEmployeeCount(date)} / {employees.length}
</div>
    </th>
  );
})}
  </tr>
</thead>

          <tbody>
          {sortedAssignments.map((assignment) => (
    <tr key={assignment.id}>
      <td style={stickyTd}>
  <div style={{ fontWeight: 800 }}>
    {assignment.site_name || "-"}
  </div>

  <div
    style={{
      fontSize: 11,
      color: "#555",
      fontWeight: 700,
    }}
  >
    {assignment.construction_type || "第一工事"}
  </div>

  <div style={{ fontSize: 11, color: "#666" }}>
    {assignment.contractor_name || "-"}
  </div>
</td>

<td style={totalTd}>
  {getMonthlyTotal(assignment.id, 0)}
</td>

<td style={totalTd}>
  {getMonthlyTotal(assignment.id, 1)}
</td>

{days.map((date) => {
        const count = getPlannedCount(
          assignment.id,
          date
        );

        return (
            <td
  key={date}
  style={{
    ...td,
    backgroundColor:
      count !== ""
        ? getBandColor(assignment)
        : new Date(date).getDay() === 0
        ? "#fff7f7"
        : new Date(date).getDay() === 6
        ? "#f7fbff"
        : "#fff",
    borderTop:
      count !== ""
        ? "5px solid #22c55e"
        : td.border,
  }}
>
<div
  style={{
    display: "grid",
    gap: 4,
    justifyItems: "center",
  }}
>



  <input
    defaultValue={getDetail(
      assignment.id,
      date
    )}
    onBlur={(e) =>
      updateDailyInfo(
        assignment.id,
        date,
        "detail",
        e.target.value
      )
    }
    placeholder=""
    style={{
      width: 52,
      padding: "2px 4px",
      border: "none",
      background: "transparent",
      textAlign: "center",
      fontSize: 10,
      fontWeight: 700,
      color: "#166534",
    }}
  />

  <input
    type="number"
    inputMode="numeric"
    defaultValue={count}
    onBlur={(e) =>
      updateDailyInfo(
        assignment.id,
        date,
        "planned_count",
        e.target.value
      )
    }
    style={{
      width: 44,
      padding: 4,
      border: "1px solid #ccc",
      borderRadius: 4,
      textAlign: "center",
      fontSize: 12,
      backgroundColor: "#fff",
      appearance: "textfield",
      MozAppearance: "textfield",
    }}
  />
</div>
            </td>
          );
      })}
    </tr>
  ))}
</tbody>
        </table>
      </div>
    </div>
  );
}

const inputStyle = {
    width: "100%",
    padding: 10,
    border: "1px solid #ccc",
    borderRadius: 8,
    fontSize: 15,
    boxSizing: "border-box" as const,
  };

const th = {
  border: "1px solid #ddd",
  padding: 6,
  backgroundColor: "#f5f5f5",
  whiteSpace: "nowrap" as const,
  textAlign: "center" as const,
  minWidth: 48,
};

const td = {
  border: "1px solid #ddd",
  padding: 6,
  textAlign: "center" as const,
  minWidth: 48,
  height: 36,
};

const stickyTh = {
  ...th,
  position: "sticky" as const,
  left: 0,
  zIndex: 2,
  minWidth: 180,
};

const stickyTd = {
  border: "1px solid #ddd",
  padding: 8,
  position: "sticky" as const,
  left: 0,
  backgroundColor: "#fff",
  zIndex: 1,
  minWidth: 180,
};

const smallButton = {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #ccc",
    backgroundColor: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  };

  const totalTh = {
    border: "1px solid #ddd",
    padding: 6,
    backgroundColor: "#eef2ff",
    whiteSpace: "nowrap" as const,
    textAlign: "center" as const,
    minWidth: 70,
    fontWeight: 800,
  };
  
  const totalTd = {
    border: "1px solid #ddd",
    padding: 6,
    textAlign: "center" as const,
    minWidth: 70,
    fontWeight: 800,
    backgroundColor: "#f8fafc",
  };