"use client";

import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      style={{
        padding: "8px 12px",
        borderRadius: 8,
        border: "1px solid #ddd",
        backgroundColor: "#fff",
        cursor: "pointer",
        marginBottom: 12,
      }}
    >
      ← 戻る
    </button>
  );
}