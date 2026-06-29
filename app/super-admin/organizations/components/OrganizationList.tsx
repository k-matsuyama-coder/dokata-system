type Organization = {
    id: string;
    name: string;
    plan: string | null;
    status: string | null;
    contract_start_date: string | null;
    contract_end_date: string | null;
  };
  
  type Props = {
    organizations: Organization[];
  };
  
  export default function OrganizationList({ organizations }: Props) {
    return (
      <div style={{ display: "grid", gap: 10 }}>
        {organizations.map((org) => (
          <div
            key={org.id}
            style={{
              backgroundColor: "#fff",
              border: "1px solid #ddd",
              borderRadius: 10,
              padding: 12,
              display: "grid",
              gap: 6,
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 18 }}>{org.name}</div>
  
            <div style={{ fontSize: 14, color: "#555" }}>
              プラン：{org.plan ?? "未設定"} ／ 状態：{org.status ?? "未設定"}
            </div>
  
            <div style={{ fontSize: 14, color: "#555" }}>
              契約開始：{org.contract_start_date ?? "-"} ／ 契約終了：
              {org.contract_end_date ?? "-"}
            </div>
  
            <a
              href={`/super-admin/organizations/${org.id}`}
              style={{
                marginTop: 6,
                color: "#111",
                fontWeight: 800,
                textDecoration: "underline",
              }}
            >
              詳細を見る
            </a>
          </div>
        ))}
  
        {organizations.length === 0 && <p>会社がありません</p>}
      </div>
    );
  }