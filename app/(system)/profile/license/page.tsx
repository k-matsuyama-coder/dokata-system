"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";

export default function LicensePage() {
  const [licenseName, setLicenseName] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [impersonating, setImpersonating] = useState(false);
const [checkingImpersonation, setCheckingImpersonation] = useState(true);

  const uploadFile = async (
    file: File,
    label: "front" | "back",
    userId: string
  ) => {
    const ext = file.name.split(".").pop();
    const safeExt = ext ? `.${ext}` : "";
    const filePath = `${userId}/${Date.now()}_${label}${safeExt}`;

    const { error } = await supabase.storage
      .from("licenses")
      .upload(filePath, file);

    if (error) {
      alert("アップロード失敗: " + error.message);
      throw error;
    }

    // 公開URLではなく、storage path を返す
    return filePath;
  };

  useEffect(() => {
    const checkImpersonation = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
  
      if (!token) {
        setCheckingImpersonation(false);
        return;
      }
  
      const res = await fetch("/api/current-organization", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      const result = await res.json();

if (!res.ok) {
  alert("会社情報が取得できません");
  setCheckingImpersonation(false);
  return;
}

setImpersonating(Boolean(result.impersonating));
setCheckingImpersonation(false);
    };
  
    checkImpersonation();
  }, []);

  const handleSubmit = async () => {
    if (impersonating) {
      alert("代理ログイン中は免許情報を登録できません");
      return;
    }
  
    const { data: userData } = await supabase.auth.getUser();
const user = userData.user;

if (!user) {
  alert("ログインしてください");
  return;
}

const { data: sessionData } = await supabase.auth.getSession();
const token = sessionData.session?.access_token;

if (!token) {
  alert("ログイン情報が取得できません");
  return;
}

const res = await fetch("/api/current-organization", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const result = await res.json();

if (!res.ok || !result.organizationId) {
  alert("会社情報が取得できません");
  return;
}

const currentOrganizationId = result.organizationId as string;

    if (!licenseName || !issueDate || !expiryDate) {
      alert("免許名・取得日・有効期限を入力してください");
      return;
    }

    const { data: employee } = await supabase
      .from("employees")
      .select("id")
      .eq("organization_id", currentOrganizationId)
      .eq("auth_user_id", user.id)
      .single();

    if (!employee) {
      alert("社員情報がありません");
      return;
    }

    let frontPath: string | null = null;
    let backPath: string | null = null;

    if (frontFile) {
      frontPath = await uploadFile(frontFile, "front", user.id);
    }

    if (backFile) {
      backPath = await uploadFile(backFile, "back", user.id);
    }

    const { error } = await supabase.from("licenses").insert([
      {
        employee_id: employee.id,
        license_name: licenseName,
        issue_date: issueDate,
        expiry_date: expiryDate,
        card_front_url: frontPath,
        card_back_url: backPath,
      },
    ]);

    if (error) {
      alert("保存失敗: " + error.message);
      return;
    }

    alert("保存成功");

    setLicenseName("");
setIssueDate("");
setExpiryDate("");
setFrontFile(null);
setBackFile(null);
  };

  if (checkingImpersonation) {
    return (
      <div style={{ padding: 20, maxWidth: 500, margin: "0 auto" }}>
        <BackButton />
        <p>確認中...</p>
      </div>
    );
  }
  
  if (impersonating) {
    return (
      <div style={{ padding: 20, maxWidth: 500, margin: "0 auto" }}>
        <BackButton />
        <h1>免許登録</h1>
  
        <div
          style={{
            backgroundColor: "#fff3cd",
            border: "1px solid #ffe08a",
            borderRadius: 12,
            padding: 16,
            color: "#7a5200",
            fontWeight: 800,
          }}
        >
          代理ログイン中のため、個人の免許情報は表示・登録できません。
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 500, margin: "0 auto" }}>
      <BackButton />
      <h1>免許登録</h1>

      <p>免許名</p>
      <input
        value={licenseName}
        onChange={(e) => setLicenseName(e.target.value)}
      />

      <p>取得日</p>
      <input
        type="date"
        value={issueDate}
        onChange={(e) => setIssueDate(e.target.value)}
      />

      <p>有効期限</p>
      <input
        type="date"
        value={expiryDate}
        onChange={(e) => setExpiryDate(e.target.value)}
      />

      <p>表写真</p>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFrontFile(e.target.files?.[0] ?? null)}
      />

      <p>裏写真</p>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setBackFile(e.target.files?.[0] ?? null)}
      />

      <br />
      <br />

      <button onClick={handleSubmit}>保存</button>
    </div>
  );
}