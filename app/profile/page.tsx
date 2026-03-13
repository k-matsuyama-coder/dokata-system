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

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [license, setLicense] = useState<any | null>(null);

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
      </div>

      <h2 style={{ marginTop: 20 }}>免許</h2>
      {license ? (
  <div
    style={{
      border: "1px solid #ccc",
      borderRadius: 8,
      padding: 12,
      marginTop: 8,
      marginBottom: 20,
    }}
  >
    <p>免許名: {license.license_name}</p>
    <p>取得日: {license.issue_date}</p>
    <p>期限: {license.expiry_date}</p>

    <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
      <img
        src={license.card_front_url}
        alt="免許証表"
        style={{ width: 120, borderRadius: 8, border: "1px solid #ccc" }}
      />
      <img
        src={license.card_back_url}
        alt="免許証裏"
        style={{ width: 120, borderRadius: 8, border: "1px solid #ccc" }}
      />
    </div>
  </div>
) : (
  <p>免許は登録されていません</p>
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
            marginBottom: 16,
          }}
        />

        {filteredCertifications.length === 0 ? (
          <p style={{ margin: 0 }}>資格は登録されていません</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {filteredCertifications.map((cert) => (
              <details
                key={cert.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 10,
                  padding: 12,
                  backgroundColor: "#fafafa",
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