"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminUserDetailPage() {
  const params = useParams();
  const id = params.id as string;

  if (!id || id === "new") {
    return null;
  }

  const [employee, setEmployee] = useState<any | null>(null);
  const [license, setLicense] = useState<any | null>(null);
  const [certifications, setCertifications] = useState<any[]>([]);

  useEffect(() => {
    const fetchEmployeeDetail = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        alert("ログインしてください");
        window.location.href = "/login";
        return;
      }

      const { data: me } = await supabase
        .from("employees")
        .select("role")
        .eq("auth_user_id", user.id)
        .single();

      if (!me || me.role !== "admin") {
        alert("管理者のみ閲覧できます");
        window.location.href = "/reports";
        return;
      }

      const { data: employeeData, error: employeeError } = await supabase
        .from("employees")
        .select("id, name, role")
        .eq("id", id)
        .single();

      if (employeeError || !employeeData) {
        alert("社員情報が見つかりません: " + (employeeError?.message ?? "データなし"));
        return;
      }

      setEmployee(employeeData);

      const { data: licenseData } = await supabase
        .from("licenses")
        .select("license_name, issue_date, expiry_date, card_front_url, card_back_url")
        .eq("employee_id", employeeData.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (licenseData) {
        setLicense(licenseData);
      }

      const { data: certData } = await supabase
        .from("certifications")
        .select("id, qualification_name, issue_date, card_front_url, card_back_url")
        .eq("employee_id", employeeData.id)
        .order("created_at", { ascending: false });

      if (certData) {
        setCertifications(certData);
      }
    };

    fetchEmployeeDetail();
  }, [id]);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
      <h1>社員詳細</h1>

      {employee && (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 10,
            padding: 16,
            marginTop: 16,
            backgroundColor: "#fff",
          }}
        >
          <p>名前: {employee.name}</p>
          <p>権限: {employee.role}</p>
        </div>
      )}

      <h2 style={{ marginTop: 24 }}>免許</h2>
      {license ? (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 10,
            padding: 16,
            backgroundColor: "#fff",
          }}
        >
          <p>免許名: {license.license_name}</p>
          <p>取得日: {license.issue_date}</p>
          <p>期限: {license.expiry_date}</p>

          <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
            <img
              src={license.card_front_url}
              alt="免許証表"
              style={{ width: 140, borderRadius: 8, border: "1px solid #ccc" }}
            />
            <img
              src={license.card_back_url}
              alt="免許証裏"
              style={{ width: 140, borderRadius: 8, border: "1px solid #ccc" }}
            />
          </div>
        </div>
      ) : (
        <p>免許は登録されていません</p>
      )}

      <h2 style={{ marginTop: 24 }}>資格一覧</h2>
      {certifications.length === 0 ? (
        <p>資格は登録されていません</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {certifications.map((cert) => (
            <div
              key={cert.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 10,
                padding: 16,
                backgroundColor: "#fff",
              }}
            >
              <p>資格名: {cert.qualification_name}</p>
              <p>取得日: {cert.issue_date}</p>

              <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                <img
                  src={cert.card_front_url}
                  alt="資格証表"
                  style={{ width: 140, borderRadius: 8, border: "1px solid #ccc" }}
                />
                <img
                  src={cert.card_back_url}
                  alt="資格証裏"
                  style={{ width: 140, borderRadius: 8, border: "1px solid #ccc" }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}