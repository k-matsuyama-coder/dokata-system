"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import BackButton from "@/app/components/BackButton";
import EmployeeRosterHeaderFields from "../../_components/EmployeeRosterHeaderFields";
import EmployeeRosterMemberSelector from "../../_components/EmployeeRosterMemberSelector";
import {
    finalizeEmployeeRoster,
    loadEmployeeRosterEditor,
    saveEmployeeRosterDraft,
  } from "../../employee-roster-document-api";
import type {
  EmployeeRosterDraftInput,
  EmployeeRosterEditorData,
} from "../../employee-roster-types";

export default function EmployeeRosterEditorPage() {
  const params = useParams<{ id: string }>();
  const rosterId = params.id;

  const [data, setData] =
    useState<EmployeeRosterEditorData | null>(null);

  const [form, setForm] =
    useState<EmployeeRosterDraftInput | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const load = useCallback(async () => {
    if (!rosterId) {
      setMessage("名簿IDを取得できません");
      setIsError(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const result =
        await loadEmployeeRosterEditor(rosterId);

      setData(result);
      setForm(createInitialForm(result));
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "作業員名簿を取得できませんでした"
      );
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }, [rosterId]);

  useEffect(() => {
    load();
  }, [load]);

  const updateForm = (
    patch: Partial<EmployeeRosterDraftInput>
  ) => {
    setForm((previous) =>
      previous
        ? {
            ...previous,
            ...patch,
          }
        : previous
    );
  };

  const handleSave = async () => {
    if (!form || !rosterId) {
      return;
    }

    setSaving(true);
    setMessage("");
    setIsError(false);

    try {
      const result = await saveEmployeeRosterDraft(
        rosterId,
        form
      );

      setData(result);
      setForm(createInitialForm(result));
      setMessage("作業員名簿を保存しました");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "作業員名簿を保存できませんでした"
      );
      setIsError(true);
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!form || !rosterId) {
      return;
    }
  
    if (form.members.length === 0) {
      setMessage(
        "名簿を確定するには作業員を1人以上選択してください"
      );
      setIsError(true);
      return;
    }
  
    const confirmed = window.confirm(
      "名簿を確定しますか？\n\n" +
        "確定後は編集できません。" +
        "現在の作業員情報が印刷用データとして保存されます。"
    );
  
    if (!confirmed) {
      return;
    }
  
    setFinalizing(true);
    setMessage("");
    setIsError(false);
  
    try {
      await saveEmployeeRosterDraft(rosterId, form);
  
      const result =
        await finalizeEmployeeRoster(rosterId);
  
      setData(result);
      setForm(createInitialForm(result));
      setMessage("作業員名簿を確定しました");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "作業員名簿を確定できませんでした"
      );
      setIsError(true);
    } finally {
      setFinalizing(false);
    }
  };

  const finalized =
    data?.roster.status === "finalized";

  return (
    <main
      style={{
        maxWidth: 1300,
        margin: "0 auto",
        padding: 20,
      }}
    >
      <BackButton />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
          marginTop: 20,
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ margin: 0, marginBottom: 8 }}>
            作業員名簿編集
          </h1>

          <p style={{ margin: 0, color: "#6b7280" }}>
            見出し情報と掲載する作業員を設定します。
          </p>
        </div>

        {data && (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 10,
    }}
  >
    <span
      style={{
        padding: "6px 12px",
        borderRadius: 999,
        color: finalized
          ? "#166534"
          : "#92400e",
        backgroundColor: finalized
          ? "#dcfce7"
          : "#fef3c7",
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {finalized ? "確定済み" : "下書き"}
    </span>

    {finalized && (
      <Link
        href={`/admin/employee-roster/rosters/${rosterId}/print`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          padding: "10px 15px",
          borderRadius: 8,
          color: "#fff",
          backgroundColor: "#111827",
          textDecoration: "none",
          fontWeight: 700,
        }}
      >
        印刷・PDF
      </Link>
    )}
  </div>
)}
      </div>

      {loading && <p>読み込み中...</p>}

      {!loading && message && (
        <div
          role={isError ? "alert" : "status"}
          style={{
            padding: 14,
            marginBottom: 18,
            borderRadius: 10,
            color: isError ? "#991b1b" : "#166534",
            backgroundColor: isError
              ? "#fee2e2"
              : "#dcfce7",
          }}
        >
          {message}
        </div>
      )}

      {!loading && data && form && (
        <>
          {finalized && (
            <div
              style={{
                padding: 14,
                marginBottom: 20,
                color: "#166534",
                backgroundColor: "#ecfdf5",
                border: "1px solid #a7f3d0",
                borderRadius: 10,
              }}
            >
              この名簿は確定済みです。確定時点の内容を
              保持するため編集できません。
            </div>
          )}

          <EmployeeRosterHeaderFields
            value={form}
            disabled={finalized}
            onChange={updateForm}
          />

          <EmployeeRosterMemberSelector
            candidates={data.candidates}
            members={form.members}
            disabled={finalized}
            onChange={(members) =>
              updateForm({ members })
            }
          />

          {!finalized && (
            <div
              style={{
                position: "sticky",
                bottom: 12,
                zIndex: 10,
                padding: 12,
                backgroundColor:
                  "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                boxShadow:
                  "0 8px 24px rgba(0, 0, 0, 0.12)",
              }}
            >
              <div
  style={{
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  }}
>
  <button
    type="button"
    onClick={handleSave}
    disabled={saving || finalizing}
    style={{
      flex: "1 1 240px",
      padding: 14,
      border: "1px solid #d1d5db",
      borderRadius: 9,
      color: "#111827",
      backgroundColor: "#fff",
      fontSize: 16,
      fontWeight: 700,
      cursor:
        saving || finalizing
          ? "not-allowed"
          : "pointer",
    }}
  >
    {saving ? "保存中..." : "下書きを保存"}
  </button>

  <button
    type="button"
    onClick={handleFinalize}
    disabled={saving || finalizing}
    style={{
      flex: "1 1 240px",
      padding: 14,
      border: "none",
      borderRadius: 9,
      color: "#fff",
      backgroundColor: finalizing
        ? "#6b7280"
        : "#166534",
      fontSize: 16,
      fontWeight: 700,
      cursor:
        saving || finalizing
          ? "not-allowed"
          : "pointer",
    }}
  >
    {finalizing
      ? "確定処理中..."
      : "保存して名簿を確定"}
  </button>
</div>
            </div>
          )}
        </>
      )}
    </main>
  );
}

function createInitialForm(
  data: EmployeeRosterEditorData
): EmployeeRosterDraftInput {
  const { roster, members } = data;

  return {
    title: roster.title,

    business_office_name:
      roster.business_office_name ?? "",

    site_manager_name:
      roster.site_manager_name ?? "",

    primary_company_name:
      roster.primary_company_name ?? "",

    primary_representative_name:
      roster.primary_representative_name ?? "",

    primary_is_related_member:
      roster.primary_is_related_member,

    secondary_company_name:
      roster.secondary_company_name ?? "",

    secondary_representative_name:
      roster.secondary_representative_name ?? "",

    secondary_is_related_member:
      roster.secondary_is_related_member,

    prime_contractor_confirmation:
      roster.prime_contractor_confirmation ?? "",

    confirmation_date:
      roster.confirmation_date ?? "",

    members: members
      .filter(
        (
          member
        ): member is typeof member & {
          employee_id: string;
        } => Boolean(member.employee_id)
      )
      .map((member, index) => ({
        employee_id: member.employee_id,
        display_order: index,
        roster_number:
          member.roster_number ?? String(index + 1),
        role_marks: member.role_marks ?? [],
        site_entry_date:
          member.site_entry_date ?? "",
        acceptance_training_date:
          member.acceptance_training_date ?? "",
      })),
  };
}