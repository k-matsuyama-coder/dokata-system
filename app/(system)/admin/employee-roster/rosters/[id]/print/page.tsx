"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import EmployeeRosterPrintSheet from "../../../_components/EmployeeRosterPrintSheet";
import { loadEmployeeRosterEditor } from "../../../employee-roster-document-api";
import type {
  EmployeeRoster,
  EmployeeRosterSnapshot,
} from "../../../employee-roster-types";
import "../../../employee-roster-print.css";

export default function EmployeeRosterPrintPage() {
  const params = useParams<{ id: string }>();
  const rosterId = params.id;

  const [roster, setRoster] =
    useState<EmployeeRoster | null>(null);

  const [snapshots, setSnapshots] = useState<
    EmployeeRosterSnapshot[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!rosterId) {
        setErrorMessage("名簿IDを取得できません");
        setLoading(false);
        return;
      }

      try {
        const result =
          await loadEmployeeRosterEditor(rosterId);

        if (!active) {
          return;
        }

        if (result.roster.status !== "finalized") {
          throw new Error(
            "印刷するには作業員名簿を確定してください"
          );
        }

        const finalizedSnapshots =
          result.members
            .filter(
              (
                member
              ): member is typeof member & {
                snapshot_data: Record<string, unknown>;
              } => Boolean(member.snapshot_data)
            )
            .map(
              (member) =>
                member.snapshot_data as unknown as EmployeeRosterSnapshot
            );

        if (finalizedSnapshots.length === 0) {
          throw new Error(
            "確定済みの印刷データがありません"
          );
        }

        setRoster(result.roster);
        setSnapshots(finalizedSnapshots);
      } catch (error) {
        if (!active) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "印刷データを取得できませんでした"
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [rosterId]);

  if (loading) {
    return (
      <main style={{ padding: 30 }}>
        印刷データを読み込み中...
      </main>
    );
  }

  if (errorMessage || !roster) {
    return (
      <main style={{ padding: 30 }}>
        <div
          role="alert"
          style={{
            padding: 16,
            marginBottom: 16,
            color: "#991b1b",
            backgroundColor: "#fee2e2",
            borderRadius: 10,
          }}
        >
          {errorMessage ||
            "印刷データを取得できませんでした"}
        </div>

        <Link
          href={`/admin/employee-roster/rosters/${rosterId}`}
        >
          名簿編集へ戻る
        </Link>
      </main>
    );
  }

  return (
    <>
      <div className="employee-roster-print-toolbar">
        <Link
          href={`/admin/employee-roster/rosters/${rosterId}`}
          style={{
            color: "#111827",
            backgroundColor: "#fff",
            border: "1px solid #d1d5db",
          }}
        >
          編集画面へ戻る
        </Link>

        <button
          type="button"
          onClick={() => window.print()}
          style={{
            color: "#fff",
            backgroundColor: "#111827",
            border: "none",
          }}
        >
          印刷・PDF保存
        </button>
      </div>

      <EmployeeRosterPrintSheet
        roster={roster}
        snapshots={snapshots}
      />
    </>
  );
}