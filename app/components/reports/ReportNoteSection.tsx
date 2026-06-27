import React from "react";

type Props = {
  sectionStyle: React.CSSProperties;
  inputStyle: React.CSSProperties;

  note: string;
  setNote: (value: string) => void;

  submitLabel: string;
  isSubmitting: boolean;

  handleValidatedSubmit: () => void;
};

export default function ReportNoteSection({
  sectionStyle,
  inputStyle,
  note,
  setNote,
  submitLabel,
  isSubmitting,
  handleValidatedSubmit,
}: Props) {
  return (
    <>
      <div style={sectionStyle}>
        <p>備考</p>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{ ...inputStyle, minHeight: 100 }}
        />
      </div>

      <button
        type="button"
        onClick={handleValidatedSubmit}
        disabled={isSubmitting}
        style={{
          width: "100%",
          padding: 14,
          fontSize: 16,
          marginTop: 12,
          border: "none",
          borderRadius: 8,
          backgroundColor: isSubmitting ? "#777" : "#111",
          color: "#fff",
          cursor: isSubmitting ? "not-allowed" : "pointer",
        }}
      >
        {isSubmitting ? "送信中..." : submitLabel}
      </button>
    </>
  );
}