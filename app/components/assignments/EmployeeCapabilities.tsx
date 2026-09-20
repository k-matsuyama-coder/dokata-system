"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  EQUIPMENT,
  type Equipment,
  type Capability,
  type PlannerEmployee,
} from "@/lib/assignmentPlanner";

type Props = {
  organizationId: string | null;
};

async function callApi(body?: unknown, signal?: AbortSignal) {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    throw new Error("再ログインしてください。");
  }

  const response = await fetch("/api/admin/assignment-planner", {
    method: body ? "POST" : "GET",
    signal,
    headers: {
      Authorization: `Bearer ${data.session.access_token}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error ?? "処理に失敗しました。");
  }

  return result;
}

export default function EmployeeCapabilities({
  organizationId,
}: Props) {
  const [open, setOpen] = useState(false);
  const [employees, setEmployees] = useState<PlannerEmployee[]>([]);
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [canDrive, setCanDrive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const savingRef = useRef(false);

  useEffect(() => {
    if (!open || !organizationId) return;

    const controller = new AbortController();

    setLoading(true);
    setMessage("");
    setEmployees([]);
    setCapabilities([]);
    setEmployeeId("");
    setEquipment([]);
    setCanDrive(false);

    callApi(undefined, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;

        setEmployees(result.employees);
        setCapabilities(result.capabilities);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;

        setMessage(
          error instanceof Error
            ? error.message
            : "読み込みに失敗しました。"
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [open, organizationId]);

  const selectEmployee = (id: string) => {
    const saved = capabilities.find(
      (item) => item.employee_id === id
    );

    setEmployeeId(id);
    setEquipment(saved?.equipment ?? []);
    setCanDrive(saved?.can_drive ?? false);
    setMessage("");
  };

  const save = async () => {
    if (!employeeId || savingRef.current) return;

    savingRef.current = true;
    setSaving(true);
    setMessage("");

    try {
      await callApi({
        action: "capability",
        employeeId,
        equipment,
        canDrive,
      });

      const saved: Capability = {
        employee_id: employeeId,
        equipment: [...equipment],
        can_drive: canDrive,
      };

      setCapabilities((current) => [
        ...current.filter(
          (item) => item.employee_id !== employeeId
        ),
        saved,
      ]);

      setMessage("対応設定を保存しました。");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "保存に失敗しました。"
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const companyName = (employee: PlannerEmployee) =>
    employee.company_name?.trim() || "所属会社未設定";

  const sortedEmployees = [...employees].sort(
    (a, b) =>
      companyName(a).localeCompare(companyName(b), "ja") ||
      a.name.localeCompare(b.name, "ja")
  );

  const companies = Array.from(
    new Set(sortedEmployees.map(companyName))
  );

  return (
    <div style={{ marginBottom: 16 }}>
      <button
        type="button"
        disabled={!organizationId || saving}
        onClick={() => setOpen((current) => !current)}
        style={{
          padding: "10px 14px",
          border: "1px solid #cbd5e1",
          borderRadius: 8,
          backgroundColor: "#fff",
          cursor: "pointer",
          fontWeight: 700,
        }}
      >
        {open ? "対応設定を閉じる" : "社員の重機・運転手設定"}
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
          <h3 style={{ marginTop: 0 }}>社員の対応設定</h3>

          <p>
            管理者が対応可能と確認した重機を選択してください。
            複数選択できます。
          </p>

          <p style={{ fontSize: 13, color: "#475569" }}>
            重機の種類・能力や必要資格は、現場へ配置する前に
            確認してください。
          </p>

          {loading && <p role="status">読み込み中…</p>}
          {message && <p role="status">{message}</p>}

          <fieldset
            disabled={loading || saving}
            style={{ border: "none", padding: 0, margin: 0 }}
          >
            <label>
              社員：
              <select
                value={employeeId}
                onChange={(event) =>
                  selectEmployee(event.target.value)
                }
                style={{
                  padding: 10,
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  maxWidth: "100%",
                  fontSize: 16,
                }}
              >
                <option value="">社員を選択してください</option>

                {companies.map((company) => (
                  <optgroup key={company} label={company}>
                    {sortedEmployees
                      .filter(
                        (employee) =>
                          companyName(employee) === company
                      )
                      .map((employee) => (
                        <option
                          key={employee.id}
                          value={employee.id}
                        >
                          {employee.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </label>

            {employeeId && (
              <>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 18,
                    margin: "20px 0",
                  }}
                >
                  {EQUIPMENT.map((type) => (
                    <label key={type}>
                      <input
                        type="checkbox"
                        checked={equipment.includes(type)}
                        onChange={(event) => {
                          const checked = event.target.checked;

                          setEquipment((current) =>
                            checked
                              ? [...current, type]
                              : current.filter(
                                  (item) => item !== type
                                )
                          );
                        }}
                      />
                      {" "}{type}
                    </label>
                  ))}
                </div>

                <label>
                  <input
                    type="checkbox"
                    checked={canDrive}
                    onChange={(event) =>
                      setCanDrive(event.target.checked)
                    }
                  />
                  {" "}運転手として配置可能
                </label>

                <div style={{ marginTop: 20 }}>
                  <button
                    type="button"
                    onClick={() => void save()}
                    style={{
                      padding: "10px 18px",
                      border: "none",
                      borderRadius: 8,
                      backgroundColor: "#2563eb",
                      color: "#fff",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {saving ? "保存中…" : "対応設定を保存"}
                  </button>
                </div>
              </>
            )}
          </fieldset>
        </div>
      )}
    </div>
  );
}