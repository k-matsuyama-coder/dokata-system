"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";


export default function CertificationsPage() {
  const [qualificationName, setQualificationName] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const handleSave = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
  
    if (!user) {
      alert("ログインしてください");
      return;
    }
  
    if (!qualificationName || !issueDate || !frontFile || !backFile) {
      alert("未入力の項目があります");
      return;
    }
  
    const frontExt = frontFile.name.split(".").pop();
const backExt = backFile.name.split(".").pop();

const frontPath = `${user.id}/${Date.now()}_front.${frontExt}`;
const backPath = `${user.id}/${Date.now()}_back.${backExt}`;
  
    const { error: frontError } = await supabase.storage
      .from("certifications")
      .upload(frontPath, frontFile);
  
    if (frontError) {
      alert("表写真のアップロード失敗: " + frontError.message);
      return;
    }
  
    const { error: backError } = await supabase.storage
      .from("certifications")
      .upload(backPath, backFile);
  
    if (backError) {
      alert("裏写真のアップロード失敗: " + backError.message);
      return;
    }
  
    const { data: employee } = await supabase
  .from("employees")
  .select("id")
  .eq("auth_user_id", user.id)
  .single();

if (!employee) {
  alert("社員情報が見つかりません");
  return;
}

const {
  data: { publicUrl: frontUrl },
} = supabase.storage.from("certifications").getPublicUrl(frontPath);

const {
  data: { publicUrl: backUrl },
} = supabase.storage.from("certifications").getPublicUrl(backPath);

const { error: insertError } = await supabase.from("certifications").insert([
  {
    employee_id: employee.id,
    qualification_name: qualificationName,
    issue_date: issueDate,
    card_front_url: frontUrl,
    card_back_url: backUrl,
  },
]);

if (insertError) {
  alert("DB保存失敗: " + insertError.message);
  return;
}

alert("保存成功");
  };

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "0 auto",
        padding: 16,
      }}
    >
      <h1>資格登録</h1>

      <p>資格名</p>
      <input
        type="text"
        value={qualificationName}
        onChange={(e) => setQualificationName(e.target.value)}
        style={{
          width: "100%",
          padding: 12,
          fontSize: 16,
          boxSizing: "border-box",
        }}
      />

      <p>取得日</p>
      <input
        type="date"
        value={issueDate}
        onChange={(e) => setIssueDate(e.target.value)}
        style={{
          width: "100%",
          padding: 12,
          fontSize: 16,
          boxSizing: "border-box",
        }}
      />

      <p>資格証 表写真</p>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFrontFile(e.target.files?.[0] ?? null)}
        style={{
          width: "100%",
          padding: 12,
          fontSize: 16,
          boxSizing: "border-box",
        }}
      />

      <p>資格証 裏写真</p>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setBackFile(e.target.files?.[0] ?? null)}
        style={{
          width: "100%",
          padding: 12,
          fontSize: 16,
          boxSizing: "border-box",
        }}
      />

<button
  onClick={handleSave}
  style={{
    width: "100%",
    padding: 14,
    fontSize: 16,
    marginTop: 20,
    border: "none",
    borderRadius: 8,
    backgroundColor: "#111",
    color: "#fff",
  }}
>
  資格を登録
</button>
    </div>
  );
}