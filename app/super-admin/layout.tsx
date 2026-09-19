"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

type Props = {
  children: ReactNode;
};

export default function SuperAdminLayout({ children }: Props) {
  const [isMobile, setIsMobile] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;

      if (!user) {
        window.location.replace("/login");
        return;
      }
      
      const verifiedUserId = sessionStorage.getItem(
        "verified_super_admin_user_id"
      );
      
      // 一度使ったら必ず削除する
      sessionStorage.removeItem(
        "verified_super_admin_user_id"
      );
      
      if (verifiedUserId === user.id) {
        setAuthorized(true);
        return;
      }
      
      const { data, error } = await supabase
        .from("super_admin_users")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (error || !data) {
        window.location.replace("/home");
        return;
      }

      setAuthorized(true);
    };

    checkAccess();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  if (!authorized) {
    return (
      <div style={{ padding: 24 }}>
        認証情報を確認しています...
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        minHeight: "100vh",
        background: "#f7f7f7",
        width: "100%",
        overflowX: "hidden",
      }}
    >
      <Sidebar />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          width: "100%",
          overflowX: "hidden",
        }}
      >
        <Header />

        <main
          style={{
            flex: 1,
            minWidth: 0,
            width: "100%",
            overflowX: "hidden",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}