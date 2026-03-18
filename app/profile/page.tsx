"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Certification = {
  id: string;
  qualification_name: string | null;
  issue_date: string | null;
  card_front_url: string | null;
  card_back_url: string | null;
};

const qualificationOptions = [
  "安全管理者","防火管理者","衛生管理者","安全衛生推進者","安全運転管理者",
  "統括安全衛生責任者","安全衛生責任者","安全衛生責任者（能力向上）☆",
  "職長教育修了者","職長教育修了者（能力向上）☆",
  "土木施工管理技士１級","土木施工管理技士２級",
  "舗装施工管理技術者１級","舗装施工管理技術者２級",
  "建設機械施工管理技士１級","建設機械施工管理技士２級",
  "造園施工管理技士１級","造園施工管理技士２級",
  "測量士","測量士補",
  "車両系建設機械（整地等）３ｔ以上","車両系建設機械（整地等）３ｔ未満",
  "車両系建設機械（解体）３ｔ以上","車両系建設機械（解体）３ｔ未満",
  "小型移動式クレーン５ｔ未満","小型移動式クレーン１ｔ未満",
  "玉掛作業者１ｔ以上","玉掛作業者１ｔ未満",
  "締固め用機械（ローラ）運転",
  "フォークリフト運転者１ｔ以上","フォークリフト運転者１ｔ未満",
  "不整地運搬車運転者１ｔ以上","不整地運搬車運転者１ｔ未満",
  "高所作業車運転者10ｍ以上","高所作業車運転者10ｍ未満",
  "地山の掘削作業主任者","土止め支保工作業主任者","型枠支保工作業主任者",
  "振動工具取扱い作業者","研削といし取替試運転作業者",
  "刈払機取扱作業者","丸のこ等取扱い作業従事者",
  "アーク溶接作業者","ガス溶接技能者",
  "登録解体工事講習","石綿作業主任者","石綿取扱い作業従事者",
  "酸素欠乏危険作業主任者","足場の組立て等作業主任者",
  "フルハーネス安全帯使用従事者",
  "主任技術者（10年以上）","主任技術者（3・5年）",
  "会社の専任技術者",
  "外国人技能実習生","外国人建設就労者",
  "外国人特定技能","外国人技術・国際業務等",
  "高齢者健康診断1回目","高齢者健康診断2回目",
  "年少者就労報告書","年少者親権者同意書",
  "ＪＲ工事管理者","保全安全管理者（ネクスコ）",
  "全豊田作業主任者","全豊田高所作業","全豊田感電防止",
  "アスファルトフィニッシャ運転",
  "規制内誘導員教育","ＱＭＳ検査員（受入検査）",
  "テールゲートリフター操作","低圧電気","伐木"
];

type License = {
  license_name: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  card_front_url: string | null;
  card_back_url: string | null;
};

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [license, setLicense] = useState<License | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setEmail(user.email ?? "");

      const { data: employee } = await supabase
        .from("employees")
        .select("id, name, role")
        .eq("auth_user_id", user.id)
        .single();

      if (employee) {
        setName(employee.name ?? "");
        setRole(employee.role ?? "");

        const { data: certs } = await supabase
          .from("certifications")
          .select("id, qualification_name, issue_date, card_front_url, card_back_url")
          .eq("employee_id", employee.id)
          .order("issue_date", { ascending: false });

        if (certs) {
          setCertifications(certs);
        }

        const { data: licenseData } = await supabase
          .from("licenses")
          .select("license_name, issue_date, expiry_date, card_front_url, card_back_url")
          .eq("employee_id", employee.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (licenseData) {
          setLicense(licenseData);
        }
      }
    };

    fetchProfile();
  }, []);

  const filteredCertifications = useMemo(() => {
    return certifications.filter((cert) =>
      (cert.qualification_name ?? "")
        .toLowerCase()
        .includes(searchKeyword.toLowerCase())
    );
  }, [certifications, searchKeyword]);

  const filteredQualificationOptions = qualificationOptions.filter((q) =>
  q.toLowerCase().includes(searchKeyword.toLowerCase())
);

const showQualificationSuggestions =
  searchKeyword.length > 0 &&
  !qualificationOptions.includes(searchKeyword) &&
  filteredQualificationOptions.length > 0;

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>個人詳細</h1>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
          backgroundColor: "#fff",
        }}
      >
        <p style={{ margin: "0 0 8px 0" }}>名前: {name}</p>
        <p style={{ margin: "0 0 8px 0" }}>メールアドレス: {email}</p>
        <p style={{ margin: 0 }}>権限: {role}</p>

        <div style={{ marginTop: 16 }}>
          <a
            href="/profile/password"
            style={{
              display: "inline-block",
              textDecoration: "none",
              backgroundColor: "#111",
              color: "#fff",
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            パスワード変更
          </a>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginTop: 20,
          marginBottom: 8,
        }}
      >
        <h2 style={{ margin: 0 }}>免許</h2>

        <a
          href="/profile/license"
          style={{
            textDecoration: "none",
            backgroundColor: "#111",
            color: "#fff",
            padding: "10px 14px",
            borderRadius: 8,
            fontSize: 14,
          }}
        >
          免許を追加
        </a>
      </div>

      {license ? (
        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: 8,
            padding: 12,
            marginTop: 8,
            marginBottom: 20,
            backgroundColor: "#fff",
          }}
        >
          <p>免許名: {license.license_name}</p>
          <p>取得日: {license.issue_date}</p>
          <p>期限: {license.expiry_date}</p>

          <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
            {license.card_front_url ? (
              <img
                src={license.card_front_url}
                alt="免許証表"
                style={{ width: 120, borderRadius: 8, border: "1px solid #ccc" }}
              />
            ) : null}

            {license.card_back_url ? (
              <img
                src={license.card_back_url}
                alt="免許証裏"
                style={{ width: 120, borderRadius: 8, border: "1px solid #ccc" }}
              />
            ) : null}
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 20 }}>
          <p>免許は登録されていません</p>
          <a
            href="/profile/license"
            style={{
              display: "inline-block",
              textDecoration: "none",
              backgroundColor: "#111",
              color: "#fff",
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: 14,
            }}
          >
            免許を登録する
          </a>
        </div>
      )}

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 16,
          backgroundColor: "#fff",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 22 }}>資格一覧</h2>
          <a
            href="/profile/certifications"
            style={{
              textDecoration: "none",
              backgroundColor: "#111",
              color: "#fff",
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: 14,
            }}
          >
            資格を追加
          </a>
        </div>

        <p style={{ marginTop: 0, color: "#555" }}>
          登録件数: {certifications.length}件
        </p>

        <div style={{ position: "relative", marginBottom: 16 }}>
  <input
    type="text"
    placeholder="資格名で検索"
    value={searchKeyword}
    onChange={(e) => setSearchKeyword(e.target.value)}
    style={{
      width: "100%",
      padding: 12,
      fontSize: 16,
      boxSizing: "border-box",
      border: "1px solid #ccc",
      borderRadius: 8,
    }}
  />

{searchKeyword && (
    <button
      onClick={() => setSearchKeyword("")}
      style={{
        position: "absolute",
        right: 8,
        top: 8,
        border: "none",
        background: "none",
        fontSize: 18,
        cursor: "pointer",
      }}
    >
      ×
    </button>
  )}

{showQualificationSuggestions && (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: 8,
        padding: 8,
        marginTop: 8,
        backgroundColor: "#fff",
        maxHeight: 220,
        overflowY: "auto",
      }}
    >
      {filteredQualificationOptions.slice(0, 10).map((q) => (
        <div
          key={q}
          onClick={() => {
            setSearchKeyword(q);
          }}
          style={{ padding: 8, cursor: "pointer" }}
        >
          {q}
        </div>
      ))}
    </div>
  )}
</div>

{certifications.length === 0 ? (
  <p style={{ margin: 0 }}>資格は登録されていません</p>
) : filteredCertifications.length === 0 ? (
  <p style={{ margin: 0 }}>検索条件に一致する資格がありません</p>
) : (
          <div style={{ display: "grid", gap: 12 }}>
            {filteredCertifications.map((cert) => (
              <details
              key={cert.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 10,
                padding: 12,
                backgroundColor: "#fff",
                boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
              }}
            >
                <summary
                  style={{
                    cursor: "pointer",
                    listStyle: "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: 16 }}>
                        {cert.qualification_name || "資格名未登録"}
                      </div>
                      <div style={{ color: "#666", fontSize: 14, marginTop: 4 }}>
                        取得日: {cert.issue_date || "-"}
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        color: "#444",
                        backgroundColor: "#eee",
                        padding: "6px 10px",
                        borderRadius: 999,
                      }}
                    >
                      詳細を開く
                    </div>
                  </div>
                </summary>

                <div style={{ marginTop: 16 }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                      gap: 12,
                    }}
                  >
                    <div>
                      <p style={{ marginTop: 0, marginBottom: 8 }}>資格証 表</p>
                      {cert.card_front_url ? (
                        <a href={cert.card_front_url} target="_blank" rel="noreferrer">
                          <img
                            src={cert.card_front_url}
                            alt="資格証表"
                            style={{
                              width: "100%",
                              borderRadius: 8,
                              border: "1px solid #ccc",
                            }}
                          />
                        </a>
                      ) : (
                        <p>画像なし</p>
                      )}
                    </div>

                    <div>
                      <p style={{ marginTop: 0, marginBottom: 8 }}>資格証 裏</p>
                      {cert.card_back_url ? (
                        <a href={cert.card_back_url} target="_blank" rel="noreferrer">
                          <img
                            src={cert.card_back_url}
                            alt="資格証裏"
                            style={{
                              width: "100%",
                              borderRadius: 8,
                              border: "1px solid #ccc",
                            }}
                          />
                        </a>
                      ) : (
                        <p>画像なし</p>
                      )}
                    </div>
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}