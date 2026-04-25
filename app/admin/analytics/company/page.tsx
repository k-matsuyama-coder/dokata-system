"use client";

import BackButton from "@/app/components/BackButton";

export default function CompanyAnalyticsPage() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <BackButton />
      <h1>会社別集計</h1>
      <p>所属会社ごとの内訳を表示します。</p>
    </div>
  );
}