"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Props = {
  admin?: boolean;
};

export default function ExpenseMenuLink({ admin = false }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function check() {
      try {
        const { data } = await supabase.auth.getSession();

        if (!data.session || controller.signal.aborted) return;

        const response = await fetch("/api/expenses/settings", {
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
          },
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) return;

        const settings = await response.json();

        if (controller.signal.aborted) return;

        // 管理者は初期設定のため、利用開始前も表示する
        setVisible(
          admin
            ? settings.isAdmin === true
            : settings.needsSetup === false
        );
      } catch {
        // 権限を確認できない場合は表示しない
      }
    }

    void check();
    return () => controller.abort();
  }, [admin]);

  if (!visible) return null;

  return (
    <Link
      href={admin ? "/admin/expenses" : "/expenses"}
      style={
        admin
          ? {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 12,
              borderRadius: 9,
              color: "#475569",
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
            }
          : {
              display: "block",
              padding: 16,
              borderRadius: 14,
              border: "1px solid #c7d2fe",
              backgroundColor: "#eef2ff",
              color: "#4338ca",
              fontWeight: 700,
              textAlign: "center",
              textDecoration: "none",
            }
      }
    >
      <span>{admin ? "経費精算" : "経費申請・精算状況"}</span>
      {admin && <span aria-hidden="true">↗</span>}
    </Link>
  );
}