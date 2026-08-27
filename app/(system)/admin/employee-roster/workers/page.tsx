"use client";

import { useEffect, useMemo, useState } from "react";
import BackButton from "@/app/components/BackButton";
import EmployeeRosterTable from "../_components/EmployeeRosterTable";
import { loadEmployeeRoster } from "../employee-roster-api";
import type { EmployeeRosterRow } from "../employee-roster-types";

export default function EmployeeRosterPage() {
  const [rows, setRows] = useState<EmployeeRosterRow[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const result = await loadEmployeeRoster();

        if (active) {
          setRows(result);
        }
      } catch (error) {
        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "作業員名簿を取得できませんでした"
          );
        }
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
  }, []);

  const filteredRows = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    if (!normalizedKeyword) {
      return rows;
    }

    return rows.filter((row) => {
      const target =
        `${row.name} ${row.company_name ?? ""}`.toLowerCase();

      return target.includes(normalizedKeyword);
    });
  }, [keyword, rows]);

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: 20,
      }}
    >
      <BackButton />

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ marginBottom: 8 }}>作業員名簿</h1>

        <p style={{ margin: 0, color: "#6b7280" }}>
          住所・連絡先などの個人情報を管理します。
        </p>
      </div>

      <input
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
        placeholder="社員名・所属会社で検索"
        autoComplete="off"
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: 12,
          marginBottom: 20,
          border: "1px solid #d1d5db",
          borderRadius: 10,
          fontSize: 16,
        }}
      />

      {loading && <p>読み込み中...</p>}

      {!loading && errorMessage && (
        <div
          role="alert"
          style={{
            padding: 16,
            color: "#991b1b",
            backgroundColor: "#fee2e2",
            borderRadius: 10,
          }}
        >
          {errorMessage}
        </div>
      )}

      {!loading && !errorMessage && (
        <EmployeeRosterTable rows={filteredRows} />
      )}
    </main>
  );
}