"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CertificationsPage() {
  const [qualificationName, setQualificationName] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [qualificationInput, setQualificationInput] = useState("");

  const [errors, setErrors] = useState<{
    qualificationName?: string;
    issueDate?: string;
    frontFile?: string;
    backFile?: string;
  }>({});

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

  const inputStyle = {
    width: "100%",
    padding: 12,
    fontSize: 16,
    boxSizing: "border-box" as const,
    border: "1px solid #ccc",
    borderRadius: 8,
    backgroundColor: "#fff",
  };

  const filteredQualifications = qualificationOptions.filter((q) =>
  q.includes(qualificationInput)
);

  const validate = () => {
    const newErrors: {
      qualificationName?: string;
      issueDate?: string;
      frontFile?: string;
      backFile?: string;
    } = {};

    if (!qualificationName) {
      newErrors.qualificationName = "候補から資格名を選択してください";
    }

    if (!issueDate) {
      newErrors.issueDate = "取得日を入力してください";
    }

    if (!frontFile) {
      newErrors.frontFile = "表写真を選択してください";
    }

    if (!backFile) {
      newErrors.backFile = "裏写真を選択してください";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      alert("ログインしてください");
      return;
    }

    if (!validate()) return;

    const finalQualificationName = qualificationName;

    const frontExt = frontFile?.name.split(".").pop();
    const backExt = backFile?.name.split(".").pop();

    const frontPath = `${user.id}/${Date.now()}_front.${frontExt}`;
    const backPath = `${user.id}/${Date.now()}_back.${backExt}`;

    const { error: frontError } = await supabase.storage
      .from("certifications")
      .upload(frontPath, frontFile as File);

    if (frontError) {
      alert("表写真のアップロード失敗: " + frontError.message);
      return;
    }

    const { error: backError } = await supabase.storage
      .from("certifications")
      .upload(backPath, backFile as File);

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
        qualification_name: finalQualificationName,
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

    setQualificationName("");
setQualificationInput("");
setIssueDate("");
    setFrontFile(null);
    setBackFile(null);
    setErrors({});
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
  placeholder="資格名を入力して検索"
  value={qualificationInput}
  onChange={(e) => {
    setQualificationInput(e.target.value);
setQualificationName("");
  }}
  style={inputStyle}
/>

{qualificationInput && filteredQualifications.length > 0 && (
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
    {filteredQualifications.slice(0, 10).map((q) => (
      <div
        key={q}
        onClick={() => {
          setQualificationName(q);
setQualificationInput(q);
        }}
        style={{ padding: 8, cursor: "pointer" }}
      >
        {q}
      </div>
    ))}
  </div>
)}
      

      {errors.qualificationName && (
        <p style={{ color: "red", marginTop: 6, marginBottom: 0 }}>
          {errors.qualificationName}
        </p>
      )}

      <p>取得日</p>
      <input
        type="date"
        value={issueDate}
        onChange={(e) => setIssueDate(e.target.value)}
        style={inputStyle}
      />

      {errors.issueDate && (
        <p style={{ color: "red", marginTop: 6, marginBottom: 0 }}>
          {errors.issueDate}
        </p>
      )}

      <p>資格証 表写真</p>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFrontFile(e.target.files?.[0] ?? null)}
        style={inputStyle}
      />

      {errors.frontFile && (
        <p style={{ color: "red", marginTop: 6, marginBottom: 0 }}>
          {errors.frontFile}
        </p>
      )}

      <p>資格証 裏写真</p>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setBackFile(e.target.files?.[0] ?? null)}
        style={inputStyle}
      />

      {errors.backFile && (
        <p style={{ color: "red", marginTop: 6, marginBottom: 0 }}>
          {errors.backFile}
        </p>
      )}

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