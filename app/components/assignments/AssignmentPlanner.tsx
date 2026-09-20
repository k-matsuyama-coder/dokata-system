"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  EQUIPMENT,
  type Equipment,
  type Requirements,
  type PlannerAssignment,
  type Plan,
} from "@/lib/assignmentPlanner";

type Props = {
  organizationId: string | null;
  assignments: PlannerAssignment[];
};

function today() {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export default function AssignmentPlanner({
  organizationId,
  assignments,
}: Props) {
  const [open, setOpen] = useState(false);
  const [assignmentId, setAssignmentId] = useState("");
  const [date, setDate] = useState(today);
  const [requirements, setRequirements] = useState<Requirements>({
    total: 5,
    drivers: 0,
    equipment: Object.fromEntries(
      EQUIPMENT.map((type) => [type, 0])
    ) as Record<Equipment, number>,
  });

  const [plan, setPlan] = useState<Plan | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const busyRef = useRef(false);

  const clearPlan = () => {
    setPlan(null);
    setMessage("");
  };

  const createPlan = async () => {
    if (busyRef.current) return;

    busyRef.current = true;
    setBusy(true);
    clearPlan();

    try {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        throw new Error("再ログインしてください。");
      }

      const response = await fetch(
        "/api/admin/assignment-planner",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "preview",
            assignmentId,
            date,
            requirements,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "配置案を作成できませんでした。"
        );
      }

      setPlan(result.plan);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "配置案を作成できませんでした。"
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <button
        type="button"
        disabled={!organizationId || busy}
        onClick={() => setOpen((current) => !current)}
        style={{
          padding: "10px 14px",
          border: "none",
          borderRadius: 8,
          backgroundColor: "#2563eb",
          color: "#fff",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {open ? "配置案を閉じる" : "配置案を作成"}
      </button>

      {open && (
        <div
          style={{
            marginTop: 12,
            padding: 16,
            border: "1px solid #cbd5e1",
            borderRadius: 12,
            backgroundColor: "#fff",
          }}
        >
          <h3 style={{ marginTop: 0 }}>配置条件</h3>

          <p>
            未配置の現場・日付を選んでください。
            候補を作成しただけでは番割に保存されません。
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void createPlan();
            }}
          >
            <fieldset
              disabled={busy}
              style={{ border: "none", padding: 0, margin: 0 }}
            >
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 14,
                  alignItems: "center",
                }}
              >
                <label>
                  現場：
                  <select
                    required
                    value={assignmentId}
                    onChange={(event) => {
                      setAssignmentId(event.target.value);
                      clearPlan();
                    }}
                    style={{
                      padding: 8,
                      maxWidth: "100%",
                      fontSize: 16,
                    }}
                  >
                    <option value="">現場を選択</option>

                    {assignments.map((assignment) => (
                      <option
                        key={assignment.id}
                        value={assignment.id}
                      >
                        {assignment.site_name || "現場名未設定"}
                        {" "}
                        （
                        {assignment.shift_type === "night"
                          ? "夜"
                          : "昼"}
                        ）
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  日付：
                  <input
                    required
                    type="date"
                    value={date}
                    onChange={(event) => {
                      setDate(event.target.value);
                      clearPlan();
                    }}
                    style={{ padding: 8, fontSize: 16 }}
                  />
                </label>

                <label>
                  合計人数：
                  <input
                    required
                    type="number"
                    min={1}
                    max={50}
                    step={1}
                    value={requirements.total}
                    onChange={(event) => {
                      const value = Number(event.target.value);

                      setRequirements((current) => ({
                        ...current,
                        total: value,
                      }));
                      clearPlan();
                    }}
                    style={{ width: 70, padding: 8 }}
                  />
                </label>
              </div>

              <p>
                合計人数のうち、必要なOP・運転手の人数を
                指定してください。初版は1人1役割です。
              </p>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 14,
                }}
              >
                {EQUIPMENT.map((type) => (
                  <label key={type}>
                    {type}：
                    <input
                      required
                      type="number"
                      min={0}
                      max={50}
                      step={1}
                      value={requirements.equipment[type]}
                      onChange={(event) => {
                        const value = Number(event.target.value);

                        setRequirements((current) => ({
                          ...current,
                          equipment: {
                            ...current.equipment,
                            [type]: value,
                          },
                        }));
                        clearPlan();
                      }}
                      style={{ width: 60, padding: 8 }}
                    />
                  </label>
                ))}

                <label>
                  運転手：
                  <input
                    required
                    type="number"
                    min={0}
                    max={50}
                    step={1}
                    value={requirements.drivers}
                    onChange={(event) => {
                      const value = Number(event.target.value);

                      setRequirements((current) => ({
                        ...current,
                        drivers: value,
                      }));
                      clearPlan();
                    }}
                    style={{ width: 60, padding: 8 }}
                  />
                </label>
              </div>

              <button
                type="submit"
                style={{
                  marginTop: 18,
                  padding: "10px 18px",
                  border: "none",
                  borderRadius: 8,
                  backgroundColor: "#2563eb",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {busy ? "候補を確認中…" : "この条件で候補を表示"}
              </button>
            </fieldset>
          </form>

          {message && <p role="alert">{message}</p>}

          {plan && (
            <section style={{ marginTop: 20 }}>
              <h3>配置候補：{plan.members.length}人</h3>

              {plan.shortages.length > 0 && (
                <div role="status" style={{ color: "#b91c1c" }}>
                  {plan.shortages.map((shortage, index) => (
                    <p key={index}>{shortage}</p>
                  ))}
                </div>
              )}

              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    minWidth: 480,
                    borderCollapse: "collapse",
                    textAlign: "left",
                  }}
                >
                  <thead>
                    <tr>
                      <th>氏名</th>
                      <th>会社</th>
                      <th>役割</th>
                      <th>同じ現場の経験</th>
                    </tr>
                  </thead>

                  <tbody>
                    {plan.members.map((member) => (
                      <tr key={member.employee_id}>
                        <td
                          style={{
                            padding: "10px 4px",
                            borderBottom: "1px solid #ddd",
                          }}
                        >
                          {member.name}
                        </td>
                        <td>{member.company}</td>
                        <td>
                          {member.equipment
                            ? `${member.equipment} OP`
                            : member.driver
                              ? "運転手"
                              : "一般作業"}
                        </td>
                        <td>{member.experience}日</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p style={{ color: "#475569", fontSize: 13 }}>
                経験は直近90日間の配置実績です。
                重機の種類・能力と資格の適合は別途確認してください。
              </p>

              {plan.excluded.length > 0 && (
                <details>
                  <summary>
                    候補から除外した人
                    （{plan.excluded.length}人）
                  </summary>

                  <ul>
                    {plan.excluded.map((employee, index) => (
                      <li key={index}>
                        {employee.name}：{employee.reason}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}