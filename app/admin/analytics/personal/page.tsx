"use client";

import BackButton from "@/app/components/BackButton";

export default function PersonalAnalyticsPage() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <BackButton />
      <h1>個人別集計</h1>
      <p>自分の集計を表示します。</p>
    </div>
  );
}