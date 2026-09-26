"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { hasRole } from "@/app/types/auth";

type AccessInfo = {
  role: string | null;
  mustChangePassword: boolean;
};

export default function SystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [accessInfo, setAccessInfo] =
    useState<AccessInfo | null>(null);

  useEffect(() => {
    const checkAccount = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;

      if (!user) {
        window.location.replace("/login");
        return;
      }

      const { data: employee, error } = await supabase
        .from("employees")
        .select("role, must_change_password")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("社員権限確認失敗:", error);
        window.location.replace("/login");
        return;
      }

      if (!employee) {
        const {
          data: superAdminUser,
          error: superAdminError,
        } = await supabase
          .from("super_admin_users")
          .select("id")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (superAdminError || !superAdminUser) {
          await supabase.auth.signOut();
          window.location.replace("/login");
          return;
        }

        window.location.replace("/super-admin");
        return;
      }

      setAccessInfo({
        role: employee.role ?? null,
        mustChangePassword:
          employee.must_change_password === true,
      });
    };

    checkAccount();
  }, []);

  const mustChangePassword =
    accessInfo?.mustChangePassword === true &&
    pathname !== "/change-password";

    // workerにも許可する番割の閲覧画面
    const canViewAssignments =
    pathname === "/admin/assignments/view" &&
    hasRole(accessInfo?.role, "worker");

  const adminAccessDenied =
    accessInfo !== null &&
    pathname.startsWith("/admin") &&
    !hasRole(accessInfo.role, "admin") &&
    !canViewAssignments;

  useEffect(() => {
    if (mustChangePassword) {
      window.location.replace("/change-password");
      return;
    }

    if (adminAccessDenied) {
      window.location.replace("/home");
    }
  }, [mustChangePassword, adminAccessDenied]);

  if (
    !accessInfo ||
    mustChangePassword ||
    adminAccessDenied
  ) {
    return (
      <div style={{ padding: 24 }}>
        認証情報を確認しています...
      </div>
    );
  }

  return <>{children}</>;
}