"use client";

import { useEffect, useRef, useState } from "react";
import { useAssignmentAI } from "./useAssignmentAI";

export default function AssignmentAIChat() {
  const ai = useAssignmentAI();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [ai.messages, ai.busy]);

  function close() {
    ai.disconnect();
    setInput("");
    setOpen(false);
  }

  function send() {
    if (ai.sendText(input)) setInput("");
  }

  const connected = ai.status === "connected";
  const connecting = ai.status === "connecting";

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          void ai.connect();
        }}
        style={{
          margin: "8px 0 12px",
          padding: "10px 20px",
          border: "none",
          borderRadius: 10,
          background: "#4f46e5",
          color: "#fff",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        ✨ AI
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="assignment-ai-title"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClose={() => {
          if (open) close();
        }}
        style={{
          padding: 0,
          border: "none",
          borderRadius: 16,
          width: "min(720px, calc(100vw - 24px))",
          maxWidth: "100%",
          maxHeight: "90dvh",
          background: "#fff",
          color: "#111827",
          boxShadow: "0 24px 80px #0004",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "min(720px, 85dvh)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: 16,
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <div>
              <strong id="assignment-ai-title">番割AIアシスタント</strong>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                {connecting
                  ? "接続中…"
                  : connected
                    ? micOnLabel(ai.micOn)
                    : "未接続"}
              </div>
            </div>

            <button type="button" onClick={close} style={buttonStyle}>
              閉じる
            </button>
          </div>

          <div
            style={{
              padding: "10px 16px",
              background: "#fffbeb",
              color: "#92400e",
              fontSize: 12,
            }}
          >
            現在は会話の動作確認用です。番割への反映機能はまだ接続していません。
          </div>

          <div
            ref={listRef}
            role="log"
            aria-label="AIとの会話"
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              padding: 16,
              background: "#f8fafc",
            }}
          >
            {ai.messages.length === 0 && (
              <div style={{ color: "#64748b", lineHeight: 1.8 }}>
                作りたい番割を、文字か音声で伝えてください。
                <br />
                例：「明日の横田は5人。そのうちBHのオペレーターを2人」
              </div>
            )}

            {ai.messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: "flex",
                  justifyContent:
                    message.role === "user" ? "flex-end" : "flex-start",
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    maxWidth: "88%",
                    padding: "12px 14px",
                    borderRadius: 14,
                    background:
                      message.role === "user" ? "#4f46e5" : "#fff",
                    color: message.role === "user" ? "#fff" : "#111827",
                    border: "1px solid #e5e7eb",
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                    lineHeight: 1.7,
                    fontSize: 14,
                  }}
                >
                  <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>
                    {message.role === "user" ? "あなた" : "AI"}
                  </div>
                  {message.text}
                </div>
              </div>
            ))}

            {ai.busy && (
              <div style={{ fontSize: 13, color: "#64748b" }}>
                応答中…
              </div>
            )}
          </div>

          {ai.error && (
            <div
              role="alert"
              style={{
                padding: "10px 16px",
                background: "#fef2f2",
                color: "#b91c1c",
                fontSize: 13,
                overflowWrap: "anywhere",
              }}
            >
              {ai.error}
            </div>
          )}

          <div style={{ padding: 16, borderTop: "1px solid #e5e7eb" }}>
            {!connected ? (
              <button
                type="button"
                disabled={connecting}
                onClick={() => void ai.connect()}
                style={buttonStyle}
              >
                {connecting ? "接続中…" : "新しい会話を開始"}
              </button>
            ) : (
              <>
                <textarea
                  aria-label="AIへの指示"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="番割の指示を入力してください"
                  rows={3}
                  style={{
                    display: "block",
                    width: "100%",
                    boxSizing: "border-box",
                    border: "1px solid #cbd5e1",
                    borderRadius: 10,
                    padding: 12,
                    fontSize: 16,
                    resize: "none",
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    marginTop: 10,
                  }}
                >
                  <button
                    type="button"
                    aria-pressed={ai.micOn}
                    onClick={() => void ai.toggleMic()}
                    style={{
                      ...buttonStyle,
                      background: ai.micOn ? "#fee2e2" : "#f1f5f9",
                      color: ai.micOn ? "#b91c1c" : "#334155",
                    }}
                  >
                    {ai.micOn ? "■ マイクを停止" : "🎤 音声で話す"}
                  </button>

                  <button
                    type="button"
                    disabled={!input.trim() || ai.busy}
                    onClick={send}
                    style={{
                      ...buttonStyle,
                      background: "#4f46e5",
                      color: "#fff",
                      opacity: !input.trim() || ai.busy ? 0.5 : 1,
                    }}
                  >
                    送信
                  </button>
                </div>
              </>
            )}

            <div style={{ fontSize: 11, color: "#64748b", marginTop: 10 }}>
              音声の返答はAIが生成します。閉じると会話とマイク接続が終了します。
              次に開くと新しい会話になります。
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}

function micOnLabel(micOn: boolean) {
  return micOn ? "● マイク使用中・音声会話できます" : "接続済み・文字入力できます";
}

const buttonStyle = {
  padding: "10px 14px",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#f8fafc",
  color: "#334155",
  cursor: "pointer",
  fontSize: 14,
};