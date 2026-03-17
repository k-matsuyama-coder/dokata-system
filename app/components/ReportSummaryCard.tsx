"use client";

import { reportDisplayFields } from "@/lib/reportFields";
import { formatReportValue } from "@/lib/reportHelpers";

type ReportSummaryCardProps = {
  report: Record<string, unknown>;
};

export default function ReportSummaryCard({
  report,
}: ReportSummaryCardProps) {
  const cardStyle = {
    border: "1px solid #ddd",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#fff",
  };

  const labelStyle = {
    margin: "0 0 6px 0",
    fontSize: 14,
    color: "#666",
  };

  const valueStyle = {
    margin: 0,
    fontSize: 15,
    color: "#111",
  };

  return (
    <div style={cardStyle}>
      {reportDisplayFields.map((field) => (
        <div key={field.key} style={{ marginBottom: 12 }}>
          <p style={labelStyle}>{field.label}</p>
          <p style={valueStyle}>
            {formatReportValue(field.key, report[field.key])}
          </p>
        </div>
      ))}
    </div>
  );
}