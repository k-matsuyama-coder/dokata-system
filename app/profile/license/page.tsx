"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LicensePage() {
  const [licenseName, setLicenseName] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);

  const uploadFile = async (file: File, label: string) => {
    const filePath = `${Date.now()}_${label}_${file.name}`;

    const { error } = await supabase.storage
      .from("licenses")
      .upload(filePath, file);

    if (error) {
      alert("アップロード失敗");
      throw error;
    }

    const { data } = supabase.storage
      .from("licenses")
      .getPublicUrl(filePath);

    return data.publicUrl;
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

    let frontUrl = null;
    let backUrl = null;

    if (frontFile) {
      frontUrl = await uploadFile(frontFile, "front");
    }

    if (backFile) {
      backUrl = await uploadFile(backFile, "back");
    }

    const { error } = await supabase.from("licenses").insert([
      {
        employee_id: employee.id,
        license_name: licenseName,
        issue_date: issueDate,
        expiry_date: expiryDate,
        card_front_url: frontUrl,
        card_back_url: backUrl,
      },
    ]);

    if (error) {
      alert("保存失敗");
      return;
    }

    alert("保存成功");
  };

  return (
    <div style={{ padding: 20, maxWidth: 500, margin: "0 auto" }}>
      <h1>免許登録</h1>

      <p>免許名</p>
      <input value={licenseName} onChange={(e)=>setLicenseName(e.target.value)} />

      <p>取得日</p>
      <input type="date" value={issueDate} onChange={(e)=>setIssueDate(e.target.value)} />

      <p>有効期限</p>
      <input type="date" value={expiryDate} onChange={(e)=>setExpiryDate(e.target.value)} />

      <p>表写真</p>
      <input type="file" onChange={(e)=>setFrontFile(e.target.files?.[0] ?? null)} />

      <p>裏写真</p>
      <input type="file" onChange={(e)=>setBackFile(e.target.files?.[0] ?? null)} />

      <br /><br />

      <button onClick={handleSubmit}>保存</button>
    </div>
  );
}