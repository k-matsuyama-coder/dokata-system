"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import { fetchAllRows } from "@/lib/fetchAllRows";
import { useAppRefresh } from "@/app/hooks/useAppRefresh";

type Props = {
  days: string[];
  leadingColumns?: number;
  layout?: "table" | "cards";
};

export default function AssignmentEvents({
  days,
  leadingColumns = 1,
  layout = "table",
}: Props) {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const refreshVersion = useAppRefresh();
  const [events, setEvents] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retry, setRetry] = useState(0);
  const [editor, setEditor] = useState<{ date: string; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const savingRef = useRef(false);
  const firstDate = days[0] ?? "";
  const lastDate = days[days.length - 1] ?? "";
  const scope = `${organizationId}:${firstDate}:${lastDate}`;
  const scopeRef = useRef(scope);
  scopeRef.current = scope;

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setLoadError("");
    setEditor(null);
    setSaveError("");

    const load = async () => {
      try {
        if (!firstDate || !lastDate) throw new Error("日付を取得できません。");
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw new Error(sessionError.message);
        const token = sessionData.session?.access_token;
        if (!token) throw new Error("ログインし直してください。");
        const response = await fetch("/api/current-organization", {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const context = await response.json();
        if (!response.ok || typeof context.organizationId !== "string") {
          throw new Error("会社情報を取得できません。");
        }
        const organizationId = context.organizationId as string;
        const { data, error } = await fetchAllRows((from, to) =>
          supabase
            .from("assignment_date_memos")
            .select("work_date, event_text")
            .eq("organization_id", organizationId)
            .gte("work_date", firstDate)
            .lte("work_date", lastDate)
            .order("work_date", { ascending: true })
            .range(from, to)
            .abortSignal(controller.signal)
        );
        if (error) throw new Error(error.message);
        if (!active) return;
        setOrganizationId(organizationId);
        setEvents(Object.fromEntries(
          (data ?? []).map((row) => [row.work_date, row.event_text ?? ""])
        ));
      } catch (error) {
        if (active) setLoadError(
          error instanceof Error ? error.message : "行事の取得に失敗しました。"
        );
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [firstDate, lastDate, refreshVersion, retry]);

  const save = async () => {
    if (!editor || !organizationId || savingRef.current) return;
    const saveScope = scope;
    const { date, text } = editor;
    savingRef.current = true;
    setSaving(true);
    setSaveError("");
    try {
      // memoを送信しないことで、既存の日付メモを保持する。
      const { data, error } = await supabase
        .from("assignment_date_memos")
        .upsert(
          { organization_id: organizationId, work_date: date, event_text: text },
          { onConflict: "organization_id,work_date" }
        )
        .select("work_date, event_text")
        .single();
      if (error) throw new Error(error.message);
      if (!data || data.work_date !== date || data.event_text !== text) {
        throw new Error("保存内容を確認できませんでした。入力内容は残しています。");
      }
      if (scopeRef.current !== saveScope) return;
      setEvents((previous) => ({ ...previous, [date]: text }));
      setEditor(null);
    } catch (error) {
      if (scopeRef.current === saveScope) setSaveError(
        error instanceof Error ? error.message : "行事の保存に失敗しました。"
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const eventButton = (date: string) => (
    <button
      type="button"
      disabled={loading || Boolean(loadError) || saving}
      aria-label={`${date}の行事を編集`}
      onClick={() => {
        setSaveError("");
        setEditor({ date, text: events[date] ?? "" });
      }}
      style={{
        width: "100%", minHeight: 44, padding: "6px 3px",
        border: 0, background: "transparent", color: "#713f12",
        font: "inherit", cursor: "pointer", whiteSpace: "pre-wrap",
        overflowWrap: "anywhere", textAlign: "center",
      }}
    >
      {loading ? "…" : loadError ? "—" : events[date] || "＋"}
    </button>
  );

  const label = (
    <>
      <strong>行事</strong>
      {loadError && (
        <div role="alert" style={{ color: "#b91c1c", fontSize: 11 }}>
          取得失敗：{loadError}
          <button type="button" onClick={() => setRetry((value) => value + 1)}>
            再取得
          </button>
        </div>
      )}
    </>
  );

  const editorDialog = editor && typeof document !== "undefined"
    ? createPortal(
      <div style={{
        position: "fixed", inset: 0, zIndex: 10000,
        background: "rgba(0,0,0,0.4)", display: "flex",
        alignItems: "center", justifyContent: "center", padding: 16,
      }}>
        <div role="dialog" aria-modal="true" aria-label="行事の編集" style={{
          width: "100%", maxWidth: 400, maxHeight: "85dvh", overflowY: "auto",
          background: "#fff", borderRadius: 12, padding: 20,
          boxSizing: "border-box", color: "#111",
        }}>
          <h3 style={{ marginTop: 0 }}>{editor.date} の行事</h3>
          <textarea
            autoFocus
            aria-label="行事の内容"
            rows={4}
            value={editor.text}
            disabled={saving}
            onChange={(event) => setEditor({ ...editor, text: event.target.value })}
            placeholder="安全大会、健康診断など"
            style={{ width: "100%", boxSizing: "border-box", padding: 10, fontSize: 16 }}
          />
          <p style={{ fontSize: 12, color: "#666" }}>空欄にして保存すると削除できます。</p>
          {saveError && <p role="alert" style={{ color: "#b91c1c" }}>{saveError}</p>}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button type="button" disabled={saving} onClick={() => setEditor(null)} style={{ padding: 10 }}>
              キャンセル
            </button>
            <button type="button" disabled={saving} onClick={() => void save()} style={{ padding: 10 }}>
              {saving ? "保存中…" : "保存"}
            </button>
          </div>
        </div>
      </div>, document.body
    ) : null;

  if (layout === "cards") {
    return (
      <section style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: 10 }}>
        {label}
        <div style={{ display: "flex", overflowX: "auto", gap: 4, marginTop: 8 }}>
          {days.map((date) => (
            <div key={date} style={{ flex: "0 0 80px", border: "1px solid #fde68a", borderRadius: 6 }}>
              <div style={{ textAlign: "center", fontSize: 12 }}>{date.slice(5).replace("-", "/")}</div>
              {eventButton(date)}
            </div>
          ))}
        </div>
        {editorDialog}
      </section>
    );
  }

  return (
    <tr>
      <td colSpan={leadingColumns} style={{
        position: "sticky", left: 0, zIndex: 30, background: "#fef3c7",
        border: "1px solid #fde68a", padding: 6, textAlign: "center",
      }}>
        {label}
        {editorDialog}
      </td>
      {days.map((date) => (
        <td key={date} style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: 0, verticalAlign: "top" }}>
          {eventButton(date)}
        </td>
      ))}
    </tr>
  );
}
