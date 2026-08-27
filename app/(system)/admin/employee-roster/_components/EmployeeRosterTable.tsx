import Link from "next/link";
import type { EmployeeRosterRow } from "../employee-roster-types";

type Props = {
  rows: EmployeeRosterRow[];
};

export default function EmployeeRosterTable({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div
        style={{
          padding: 32,
          textAlign: "center",
          backgroundColor: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
        }}
      >
        該当する社員はいません
      </div>
    );
  }

  return (
    <div
      style={{
        overflowX: "auto",
        backgroundColor: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
      }}
    >
      <table
        style={{
          width: "100%",
          minWidth: 700,
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f3f4f6" }}>
            <th style={headerStyle}>社員名</th>
            <th style={headerStyle}>所属会社</th>
            <th style={headerStyle}>登録状態</th>
            <th style={headerStyle}>最終更新</th>
            <th style={headerStyle}>操作</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td style={cellStyle}>{row.name}</td>
              <td style={cellStyle}>{row.company_name || "未設定"}</td>
              <td style={cellStyle}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 10px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                    color: row.privateProfile ? "#166534" : "#92400e",
                    backgroundColor: row.privateProfile
                      ? "#dcfce7"
                      : "#fef3c7",
                  }}
                >
                  {row.privateProfile ? "登録済み" : "未登録"}
                </span>
              </td>
              <td style={cellStyle}>
                {row.privateProfile
                  ? new Date(row.privateProfile.updated_at).toLocaleString(
                      "ja-JP"
                    )
                  : "-"}
              </td>
              <td style={cellStyle}>
                <Link
                  href={`/admin/employee-roster/workers/${row.id}`}
                  style={{
                    display: "inline-block",
                    padding: "8px 12px",
                    borderRadius: 8,
                    color: "#fff",
                    backgroundColor: "#111827",
                    textDecoration: "none",
                    fontWeight: 700,
                  }}
                >
                  {row.privateProfile ? "確認・編集" : "新規登録"}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  padding: 12,
  borderBottom: "1px solid #d1d5db",
  textAlign: "left",
  whiteSpace: "nowrap",
};

const cellStyle: React.CSSProperties = {
  padding: 12,
  borderBottom: "1px solid #e5e7eb",
  whiteSpace: "nowrap",
};