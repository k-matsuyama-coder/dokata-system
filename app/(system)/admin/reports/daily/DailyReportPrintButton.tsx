"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type PrintReport = {
  id: string;
  organization_id: string;
  content_revision: number;
  has_update: boolean;
};

type Props = {
  canPrint: boolean;
  reports: PrintReport[];
  onCleared: (reports: PrintReport[]) => void;
};

export default function DailyReportPrintButton({ canPrint, reports, onCleared }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [finished, setFinished] = useState(false);
  const snapshot = useRef<PrintReport[] | null>(null);
  const saveLock = useRef(false);

  useEffect(() => {
    const handleAfterPrint = () => {
      if (snapshot.current !== null) setShowConfirm(true);
    };
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  const startPrint = () => {
    if (!canPrint || snapshot.current !== null) return;
    snapshot.current = reports
      .filter((report) => report.has_update)
      .map(({ id, organization_id, content_revision, has_update }) => ({
        id, organization_id, content_revision, has_update,
      }));
    setMessage("");
    setFinished(false);
    try {
      window.print();
      // afterprintが通知されないブラウザでも確認できるようにする
      setShowConfirm(true);
    } catch {
      snapshot.current = null;
      setMessage("印刷画面を開けませんでした。閉じて再度お試しください。");
      setFinished(true);
      setShowConfirm(true);
    }
  };

  const closeConfirm = () => {
    if (saveLock.current) return;
    snapshot.current = null;
    setShowConfirm(false);
    setMessage("");
  };

  const markPrinted = async () => {
    if (saveLock.current || snapshot.current === null) return;
    saveLock.current = true;
    setSaving(true);
    setMessage("");
    const cleared: PrintReport[] = [];
    const retry: PrintReport[] = [];
    let changed = 0;

    try {
      for (const report of snapshot.current) {
        try {
          const { data, error } = await supabase
            .from("daily_reports")
            .update({ has_update: false })
            .eq("organization_id", report.organization_id)
            .eq("id", report.id)
            .eq("content_revision", report.content_revision)
            .select("id, organization_id, content_revision, has_update")
            .maybeSingle();

          if (error || (data && data.has_update !== false)) {
            retry.push(report);
          } else if (!data) {
            changed += 1;
          } else {
            cleared.push(data);
          }
        } catch {
          retry.push(report);
        }
      }

      onCleared(cleared);
      snapshot.current = retry;
      setFinished(retry.length === 0);
      setMessage([
        `${cleared.length}件の「更新あり」を解除しました。`,
        changed > 0
          ? `${changed}件は内容の再変更・削除・権限変更などにより解除していません。最新の日報を再確認してください。`
          : "",
        retry.length > 0
          ? `${retry.length}件は保存できませんでした。再試行するか、閉じて後で印刷済みにしてください。`
          : "",
      ].filter(Boolean).join("\n"));
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  };

  const buttonStyle = {
    padding: "10px 14px", borderRadius: 8,
    border: "1px solid #ccc", fontWeight: 600,
  };

  return (
    <>
      <button
        disabled={!canPrint || showConfirm || saving}
        onClick={startPrint}
        style={{ ...buttonStyle, background: canPrint ? "#111" : "#aaa", color: "white" }}
      >
        印刷
      </button>

      {showConfirm && (
        <div className="no-print" style={{
          position: "fixed", inset: 0, zIndex: 10000,
          background: "rgba(0,0,0,0.45)", display: "flex",
          alignItems: "center", justifyContent: "center", padding: 16,
        }}>
          <div role="dialog" aria-modal="true" aria-labelledby="print-confirm-title"
            style={{ background: "white", color: "#111", borderRadius: 12, padding: 24, width: "100%", maxWidth: 440 }}>
            <h2 id="print-confirm-title" style={{ fontSize: 20, fontWeight: 700 }}>
              {finished ? "印刷済みの確認" : "印刷できましたか？"}
            </h2>
            <p style={{ margin: "16px 0", whiteSpace: "pre-wrap" }}>
              {message || "印刷できた場合だけ「印刷済みにする」を押してください。印刷をキャンセルした場合は、ここでもキャンセルしてください。"}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button disabled={saving} onClick={closeConfirm} style={buttonStyle}>
                {finished ? "閉じる" : "キャンセル"}
              </button>
              {!finished && (
                <button disabled={saving} onClick={markPrinted}
                  style={{ ...buttonStyle, background: "#111", color: "white" }}>
                  {saving ? "保存中…" : "印刷済みにする"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
