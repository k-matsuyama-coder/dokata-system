"use client";

import { useEffect, useRef, useState } from "react";
import { useAppResume } from "@/app/hooks/useAppResume";
import { AppRefreshContext } from "@/app/hooks/useAppRefresh";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { withTimeout } from "@/lib/withTimeout";
import { hasRole } from "@/app/types/auth";

type AccessInfo = {
  role: string | null;
  mustChangePassword: boolean;
};

type CheckResult =
  | { kind: "login" }
  | { kind: "superAdmin" }
  | { kind: "employee"; accessInfo: AccessInfo };

export default function SystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [accessInfo, setAccessInfo] = useState<AccessInfo | null>(null);
  const [authError, setAuthError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [refreshVersion, setRefreshVersion] = useState(0);
const [isChecking, setIsChecking] = useState(false);

const checkingRef = useRef(false);
const checkedOnceRef = useRef(false);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const checkAccount = async (): Promise<CheckResult> => {
      const { data, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      // タイムアウト・画面移動後は次の通信を開始しない
      if (controller.signal.aborted) {
        throw new Error("認証確認を中断しました。");
      }

      const user = data.session?.user;

      if (!user) {
        return { kind: "login" };
      }

      const { data: employee, error: employeeError } = await supabase
        .from("employees")
        .select("role, must_change_password")
        .eq("auth_user_id", user.id)
        .abortSignal(controller.signal)
        .maybeSingle();

      if (employeeError) throw employeeError;

      if (employee) {
        return {
          kind: "employee",
          accessInfo: {
            role: employee.role ?? null,
            mustChangePassword: employee.must_change_password === true,
          },
        };
      }

      if (controller.signal.aborted) {
        throw new Error("認証確認を中断しました。");
      }

      const { data: superAdminUser, error: superAdminError } =
        await supabase
          .from("super_admin_users")
          .select("id")
          .eq("auth_user_id", user.id)
          .abortSignal(controller.signal)
          .maybeSingle();

      if (superAdminError) throw superAdminError;

      if (superAdminUser) {
        return { kind: "superAdmin" };
      }

      throw new Error(
        "利用者情報が見つかりません。管理者に確認してください。"
      );
    };

    const run = async () => {
      checkingRef.current = true;
      setIsChecking(true);
      setAuthError("");

      try {
        const result = await withTimeout(
          checkAccount(),
          15000,
          "認証確認に時間がかかっています。通信状態を確認して再試行してください。"
        );

        if (!active) return;

        if (result.kind === "login") {
          window.location.replace("/login");
          return;
        }

        if (result.kind === "superAdmin") {
          window.location.replace("/super-admin");
          return;
        }

        setAccessInfo(result.accessInfo);

        // 初回はページ自身が取得するため、復帰・再試行時だけ通知する
if (checkedOnceRef.current) {
  setRefreshVersion((version) => version + 1);
}

checkedOnceRef.current = true;

      } catch (error) {
        if (!active) return;

        console.error("認証確認失敗:", error);

        const message =
          error instanceof Error
            ? error.message
            : "認証情報を取得できませんでした。しばらくして再試行してください。";

        setAuthError(message);
      } finally {
        controller.abort();
      
        if (active) {
          checkingRef.current = false;
          setIsChecking(false);
        }
      }
    };

    void run();

    return () => {
      active = false;
      controller.abort();
    };
  }, [retryCount]);

  useAppResume(async () => {
    // 確認中の重複リクエストを防ぐ
    if (checkingRef.current) return;
  
    checkingRef.current = true;
    setRetryCount((count) => count + 1);
  });

  const mustChangePassword =
    accessInfo?.mustChangePassword === true &&
    pathname !== "/change-password";

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

  if (authError && !accessInfo) {
    return (
      <div style={{ padding: 24 }} role="alert">
        <p>認証情報を確認できませんでした。</p>
        <p>{authError}</p>

        <button
          type="button"
          onClick={() => {
            setAuthError("");
            setRetryCount((count) => count + 1);
          }}
        >
          再試行
        </button>
      </div>
    );
  }

  if (!accessInfo || mustChangePassword || adminAccessDenied) {
    return (
      <div style={{ padding: 24 }}>
        認証情報を確認しています...
      </div>
    );
  }

  return (
    <AppRefreshContext.Provider value={refreshVersion}>
      {authError && (
        <div
          role="alert"
          style={{
            padding: 12,
            backgroundColor: "#fff3cd",
            color: "#664d03",
            borderBottom: "1px solid #ffecb5",
          }}
        >
          <p style={{ margin: "0 0 8px" }}>
            接続を確認できませんでした。入力中の内容はそのままです。
          </p>
  
          <p style={{ margin: "0 0 8px", fontSize: 13 }}>
            {authError}
          </p>
  
          <button
            type="button"
            disabled={isChecking}
            onClick={() => {
              if (checkingRef.current) return;
  
              checkingRef.current = true;
              setRetryCount((count) => count + 1);
            }}
          >
            再試行
          </button>
        </div>
      )}
  
      {children}
    </AppRefreshContext.Provider>
  );
}