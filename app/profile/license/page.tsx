"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";

export default function LicensePage() {
  const [licenseName, setLicenseName] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);

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

  const handleSubmit = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      alert("ログインしてください");
      return;
    }

    const { data: employee } = await supabase
      .from("employees")
      .select("id")
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
  };

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