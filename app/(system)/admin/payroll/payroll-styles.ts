import type { CSSProperties } from "react";

export const inputStyle: CSSProperties = {
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    backgroundColor: "#fff",
    fontSize: 14,
  };
  
  export const buttonStyle: CSSProperties = {
    border: "1px solid #d1d5db",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: "10px 12px",
    fontWeight: 700,
    cursor: "pointer",
  };
  
  export const summaryCardStyle: CSSProperties = {
    backgroundColor: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 16,
  };
  
  export const summaryLabelStyle: CSSProperties = {
    color: "#6b7280",
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 8,
  };
  
  export const summaryValueStyle: CSSProperties = {
    color: "#111827",
    fontSize: 28,
    fontWeight: 900,
    lineHeight: 1,
  };
  
  export const errorBoxStyle: CSSProperties = {
    marginBottom: 16,
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    borderRadius: 12,
    padding: 14,
    fontWeight: 700,
  };
  
  export const warningBoxStyle: CSSProperties = {
    marginBottom: 16,
    backgroundColor: "#fffbeb",
    border: "1px solid #fde68a",
    color: "#92400e",
    borderRadius: 12,
    padding: 14,
    fontWeight: 700,
  };
  
  export const tableWrapStyle: CSSProperties = {
    overflowX: "auto",
    backgroundColor: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
  };
  
  export const tableStyle: CSSProperties = {
    width: "100%",
    minWidth: 1700,
    borderCollapse: "separate",
    borderSpacing: 0,
  };
  
  export const thStyle: CSSProperties = {
    position: "sticky",
    top: 0,
    backgroundColor: "#f9fafb",
    color: "#111827",
    fontSize: 13,
    fontWeight: 800,
    padding: "12px 10px",
    borderBottom: "1px solid #e5e7eb",
    borderRight: "1px solid #f3f4f6",
    textAlign: "center",
    whiteSpace: "nowrap",
    zIndex: 2,
  };
  
  export const tdStyle: CSSProperties = {
    padding: "10px 8px",
    borderBottom: "1px solid #f3f4f6",
    borderRight: "1px solid #f9fafb",
    textAlign: "center",
    whiteSpace: "nowrap",
    backgroundColor: "#fff",
  };
  
  export const stickyNameTdStyle: CSSProperties = {
    ...tdStyle,
    position: "sticky",
    left: 0,
    backgroundColor: "#fff",
    zIndex: 1,
    fontWeight: 800,
    textAlign: "left",
    minWidth: 140,
  };
  
  export const cellInputStyle: CSSProperties = {
    width: 90,
    padding: "8px 6px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 13,
    textAlign: "right",
    boxSizing: "border-box",
  };
  
  export const employeeSummaryLabelStyle: CSSProperties = {
    color: "#6b7280",
    fontSize: 12,
    marginBottom: 4,
  };
  
  export const employeeSummaryValueStyle: CSSProperties = {
    color: "#111827",
    fontSize: 15,
    fontWeight: 900,
    whiteSpace: "nowrap",
  };
  
  export const payrollSectionStyle: CSSProperties = {
    padding: 14,
    backgroundColor: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
  };
  
  export const payrollSectionTitleStyle: CSSProperties = {
    margin: "0 0 12px",
    fontSize: 16,
  };
  
  export const payrollValueRowStyle: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: "7px 0",
    borderBottom: "1px solid #f3f4f6",
    fontSize: 14,
  };
  
  export const payrollTotalRowStyle: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 8,
    padding: "10px 0 0",
    borderTop: "2px solid #111827",
    fontSize: 15,
    fontWeight: 900,
  };
  
  export const payrollInputLabelStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    color: "#374151",
    fontSize: 13,
    fontWeight: 700,
  };
  
  export const payrollInputStyle: CSSProperties = {
    width: "100%",
    minHeight: 40,
    padding: "8px 10px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    backgroundColor: "#fff",
    color: "#111827",
    fontSize: 14,
    boxSizing: "border-box",
  };
  
  export const payrollBreakdownTableStyle: CSSProperties = {
    width: "100%",
    minWidth: 1700,
    borderCollapse: "collapse",
    backgroundColor: "#ffffff",
    fontSize: 12,
  };
  
  export const payrollBreakdownThStyle: CSSProperties = {
    padding: "7px 6px",
    border: "1px solid #4b5563",
    backgroundColor: "#f3f4f6",
    color: "#111827",
    fontWeight: 800,
    textAlign: "center",
    whiteSpace: "nowrap",
  };
  
  export const payrollBreakdownTdStyle: CSSProperties = {
    padding: "6px",
    border: "1px solid #9ca3af",
    color: "#111827",
    textAlign: "center",
    whiteSpace: "nowrap",
  };