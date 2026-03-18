"use client";

import BackButton from "@/app/components/BackButton";

export default function MonthlyAnalyticsPage() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <BackButton />
      <h1 style={{ marginBottom: 16 }}>月次集計</h1>
      <p>ここに月次集計を表示します。</p>
    </div>
  );
}