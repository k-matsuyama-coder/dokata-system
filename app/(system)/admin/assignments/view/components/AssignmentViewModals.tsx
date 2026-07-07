// app/(system)/admin/assignments/view/components/AssignmentViewModals.tsx
"use client";

import React from "react";

type AssignmentFile = {
  id: string;
  assignment_id: string;
  file_name: string;
  file_url: string;
};

type DetailModalAssignment = {
  site_name: string | null;
  contractor_name: string | null;
  manager_name: string | null;
  contact_phone: string | null;
  address: string | null;
  shift_type: string | null;
  files: AssignmentFile[];
};

type DetailTextModal = {
  title: string;
  text: string;
};

type Props = {
  detailModalAssignment: DetailModalAssignment | null;
  setDetailModalAssignment: React.Dispatch<
    React.SetStateAction<DetailModalAssignment | null>
  >;
  detailTextModal: DetailTextModal | null;
  setDetailTextModal: React.Dispatch<
    React.SetStateAction<DetailTextModal | null>
  >;
  toTelHref: (phone: string) => string;
};

export default function AssignmentViewModals({
  detailModalAssignment,
  setDetailModalAssignment,
  detailTextModal,
  setDetailTextModal,
  toTelHref,
}: Props) {
  return (
    <>
      {detailModalAssignment && (
        <div
          onClick={() => setDetailModalAssignment(null)}
          style={detailModalOverlayStyle}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={detailModalCardStyle}
          >
            <div style={detailModalHeaderStyle}>
              <div>
                <div style={detailModalTitleStyle}>
                  {detailModalAssignment.site_name || "現場名未設定"}
                </div>
                <div style={detailModalSubTitleStyle}>
                  {detailModalAssignment.contractor_name || "-"}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDetailModalAssignment(null)}
                style={detailModalCloseButtonStyle}
              >
                ×
              </button>
            </div>

            <div style={detailModalBodyStyle}>
              <div style={detailModalItemStyle}>
                <div style={detailModalLabelStyle}>区分</div>
                <div style={detailModalValueStyle}>
                  {detailModalAssignment.shift_type === "night" ? "夜勤" : "日勤"}
                </div>
              </div>

              <div style={detailModalItemStyle}>
                <div style={detailModalLabelStyle}>担当者</div>
                <div style={detailModalValueStyle}>
                  {detailModalAssignment.manager_name || "-"}
                </div>
              </div>

              <div style={detailModalItemStyle}>
                <div style={detailModalLabelStyle}>連絡先</div>
                <div style={detailModalValueStyle}>
                  {detailModalAssignment.contact_phone ? (
                    <a
                      href={toTelHref(detailModalAssignment.contact_phone)}
                      style={inlineLinkStyle}
                    >
                      {detailModalAssignment.contact_phone}
                    </a>
                  ) : (
                    "-"
                  )}
                </div>
              </div>

              <div style={detailModalItemStyle}>
                <div style={detailModalLabelStyle}>住所</div>
                <div style={detailModalValueStyle}>
                  {detailModalAssignment.address ? (
                    <a
                      href={
                        detailModalAssignment.address.startsWith("http")
                          ? detailModalAssignment.address
                          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              detailModalAssignment.address
                            )}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      style={inlineLinkStyle}
                    >
                      {detailModalAssignment.address}
                    </a>
                  ) : (
                    "-"
                  )}
                </div>
              </div>

              <div style={detailModalItemStyle}>
                <div style={detailModalLabelStyle}>添付ファイル</div>

                {detailModalAssignment.files.length > 0 ? (
                  <div style={detailFileListStyle}>
                    {detailModalAssignment.files.map((file) => (
                      <a
                        key={file.id}
                        href={file.file_url}
                        target="_blank"
                        rel="noreferrer"
                        style={detailFileLinkStyle}
                      >
                        {file.file_name}
                      </a>
                    ))}
                  </div>
                ) : (
                  <div style={detailModalValueStyle}>なし</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {detailTextModal && (
        <div
          onClick={() => setDetailTextModal(null)}
          style={detailModalOverlayStyle}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={detailModalCardStyle}
          >
            <div style={detailModalHeaderStyle}>
              <div>
                <div style={detailModalTitleStyle}>{detailTextModal.title}</div>
                <div style={detailModalSubTitleStyle}>現場詳細</div>
              </div>

              <button
                type="button"
                onClick={() => setDetailTextModal(null)}
                style={detailModalCloseButtonStyle}
              >
                ×
              </button>
            </div>

            <div style={detailModalBodyStyle}>
              <div
                style={{
                  ...detailModalValueStyle,
                  whiteSpace: "pre-wrap",
                }}
              >
                {detailTextModal.text}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const inlineLinkStyle: React.CSSProperties = {
  color: "#2563eb",
  textDecoration: "underline",
  marginLeft: 2,
  fontWeight: 700,
};

const detailModalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(15,23,42,0.48)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  zIndex: 9999,
};

const detailModalCardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 420,
  backgroundColor: "#ffffff",
  borderRadius: 18,
  boxShadow: "0 16px 40px rgba(15,23,42,0.18)",
  border: "1px solid #e5e7eb",
  overflow: "hidden",
};

const detailModalHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  padding: "16px 16px 12px",
  borderBottom: "1px solid #e5e7eb",
};

const detailModalTitleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 900,
  color: "#111827",
  lineHeight: 1.3,
};

const detailModalSubTitleStyle: React.CSSProperties = {
  marginTop: 4,
  fontSize: 13,
  fontWeight: 700,
  color: "#64748b",
};

const detailModalCloseButtonStyle: React.CSSProperties = {
  border: "none",
  backgroundColor: "#f3f4f6",
  color: "#111827",
  borderRadius: 999,
  width: 36,
  height: 36,
  fontSize: 22,
  fontWeight: 900,
  cursor: "pointer",
  flexShrink: 0,
};

const detailModalBodyStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
  padding: 16,
};

const detailModalItemStyle: React.CSSProperties = {
  display: "grid",
  gap: 4,
};

const detailModalLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: "#64748b",
};

const detailModalValueStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "#111827",
  lineHeight: 1.5,
  wordBreak: "break-word",
};

const detailFileListStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
};

const detailFileLinkStyle: React.CSSProperties = {
  display: "block",
  padding: "10px 12px",
  borderRadius: 12,
  backgroundColor: "#f8fafc",
  border: "1px solid #dbe2ea",
  color: "#2563eb",
  textDecoration: "underline",
  fontSize: 14,
  fontWeight: 700,
  wordBreak: "break-word",
};