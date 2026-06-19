"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import MyMonthlyScheduleModal from "@/app/components/MyMonthlyScheduleModal";

type Notification = {
  id: string;
  employee_name: string;
  title: string;
  message: string;
  link_url: string | null;
  is_read: boolean;
};

export default function NavBar() {
  const [role, setRole] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [employeeName, setEmployeeName] = useState("");
const [notifications, setNotifications] = useState<Notification[]>([]);
const [showNotifications, setShowNotifications] = useState(false);
const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    const fetchRole = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) return;

      const { data } = await supabase
        .from("employees")
        .select("name, role")
        .eq("auth_user_id", user.id)
        .single();

        if (data) {
          setRole(data.role);
          setEmployeeName(data.name);
        }
    };

    fetchRole();
  }, []);

  useEffect(() => {
    if (!employeeName) return;
  
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id, employee_name, title, message, link_url, is_read")
        .eq("employee_name", employeeName)
        .eq("is_read", false)
        .order("created_at", { ascending: false });
  
      setNotifications(data ?? []);
    };
  
    fetchNotifications();
  
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        fetchNotifications
      )
      .subscribe();
  
    return () => {
      supabase.removeChannel(channel);
    };
  }, [employeeName]);

  const markNotificationAsRead = async (notification: Notification) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notification.id);
  
    if (error) {
      alert("通知更新失敗: " + error.message);
      return;
    }
  
    setNotifications((prev) =>
      prev.filter((item) => item.id !== notification.id)
    );
  
    if (notification.link_url) {
      window.location.href = notification.link_url;
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
  
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
  
    for (let i = 0; i < rawData.length; i++) {
      outputArray[i] = rawData.charCodeAt(i);
    }
  
    return outputArray;
  };
  
  const enablePushNotifications = async () => {
    if (!employeeName) {
      alert("社員情報を取得できていません");
      return;
    }
  
    if (!("serviceWorker" in navigator)) {
      alert("この端末は通知未対応です");
      return;
    }
  
    if (!("PushManager" in window)) {
      alert("この端末はプッシュ通知未対応です");
      return;
    }
  
    const permission = await Notification.requestPermission();
  
    if (permission !== "granted") {
      alert("通知が許可されませんでした");
      return;
    }
  
    const registration = await navigator.serviceWorker.register("/sw.js");
  
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      ),
    });
  
    const json = subscription.toJSON();
  
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      alert("端末登録情報を取得できませんでした");
      return;
    }
  
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        employee_name: employeeName,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      },
      {
        onConflict: "endpoint",
      }
    );
  
    if (error) {
      alert("通知端末登録失敗: " + error.message);
      return;
    }
  
    setPushEnabled(true);
    alert("この端末で通知を受け取れるようになりました");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        zIndex: 1000,
        display: "flex",
        justifyContent: "flex-start",
gap: 12,
        alignItems: "center",
        padding: "14px 20px",
        borderBottom: "1px solid #ddd",
        backgroundColor: "#fff",
        boxSizing: "border-box",
        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
      }}
    >
      <button
  type="button"
  onClick={(e) => {
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  }}
  style={{
    border: "1px solid #ddd",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: "8px 12px",
    cursor: "pointer",
    fontSize: 18,
  }}
>
  ☰
</button>

<a
  href="/home"
  onClick={() => setMenuOpen(false)}
  style={{
    fontWeight: "bold",
    fontSize: 18,
    textDecoration: "none",
    color: "#111",
    cursor: "pointer",
  }}
>
  DOKATA-System
</a>

<div
  style={{
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    gap: 8,
  }}
>
  <button
    type="button"
    onClick={() => setShowCalendarModal(true)}
    style={{
      border: "1px solid #ddd",
      backgroundColor: "#fff",
      borderRadius: 8,
      padding: "8px 12px",
      cursor: "pointer",
      fontSize: 18,
    }}
  >
    📅
  </button>

  <button
  type="button"
  onClick={enablePushNotifications}
  style={{
    border: "1px solid #ddd",
    backgroundColor: pushEnabled ? "#16a34a" : "#fff",
    color: pushEnabled ? "#fff" : "#111",
    borderRadius: 8,
    padding: "8px 12px",
    cursor: "pointer",
    fontSize: 16,
  }}
>
  📲
</button>

  <div style={{ position: "relative" }}>
  <button
    type="button"
    onClick={() => setShowNotifications(!showNotifications)}
    style={{
      border: "1px solid #ddd",
      backgroundColor: "#fff",
      borderRadius: 8,
      padding: "8px 12px",
      cursor: "pointer",
      fontSize: 18,
    }}
  >
    🔔
  </button>

  {notifications.length > 0 && (
    <span
      style={{
        position: "absolute",
        top: -4,
        right: -4,
        width: 12,
        height: 12,
        borderRadius: "50%",
        backgroundColor: "red",
      }}
    />
  )}

  {showNotifications && (
    <div
      style={{
        position: "absolute",
        right: 0,
        top: 44,
        width: 280,
        backgroundColor: "#fff",
        border: "1px solid #ddd",
        borderRadius: 12,
        padding: 10,
        boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
        zIndex: 2000,
      }}
    >
      {notifications.length === 0 ? (
        <div style={{ color: "#666", fontSize: 13 }}>
          通知はありません
        </div>
      ) : (
        notifications.map((notification) => (
          <div
  key={notification.id}
  onClick={() => markNotificationAsRead(notification)}
  style={{
    borderBottom: "1px solid #eee",
    padding: "8px 0",
    cursor: "pointer",
  }}
>
            <div style={{ fontWeight: 800 }}>
              {notification.title}
            </div>

            <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>
              {notification.message}
            </div>
          </div>
        ))
      )}
    </div>
  )}
</div>
</div>

        <>
  {menuOpen && (
    <div
      onClick={() => setMenuOpen(false)}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.3)",
        zIndex: 1000,
      }}
    />
  )}

<div
  onMouseEnter={() => setMenuOpen(true)}
  onMouseLeave={() => setMenuOpen(false)}
  style={{
    position: "fixed",
    top: 0,
    left: menuOpen ? 0 : -260,
    width: 250,
    height: "100vh",
    backgroundColor: "#fff",
    borderRight: "1px solid #ddd",
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    transition: "right 0.25s ease",
    zIndex: 1000,
    boxShadow: "-2px 0 10px rgba(0,0,0,0.12)",
  }}
>

<div
  style={{
    fontSize: 20,
    fontWeight: 800,
    marginBottom: 10,
    borderBottom: "1px solid #eee",
    paddingBottom: 12,
  }}
>
DOKATA-System
</div>
            <a
              href="/home"
              onClick={() => setMenuOpen(false)}
              className="nav-link"
              style={{
                color: pathname === "/home" ? "#0070f3" : "#333",
                fontWeight: pathname === "/home" ? 700 : 500,
              }}
            >
              ホーム
            </a>

            <a
              href="/reports"
              onClick={() => setMenuOpen(false)}
              className="nav-link"
              style={{
                color: pathname.startsWith("/reports") ? "#0070f3" : "#333",
                fontWeight: pathname.startsWith("/reports") ? 700 : 500,
              }}
            >
              日報
            </a>

            <a
  href="/assignments/view"
  onClick={() => setMenuOpen(false)}
  className="nav-link"
  style={{
    color: pathname.startsWith("/assignments/view") ? "#0070f3" : "#333",
    fontWeight: pathname.startsWith("/assignments/view") ? 700 : 500,
  }}
>
  番割
</a>

            <a
              href="/profile"
              onClick={() => setMenuOpen(false)}
              className="nav-link"
              style={{
                color: pathname.startsWith("/profile") ? "#0070f3" : "#333",
                fontWeight: pathname.startsWith("/profile") ? 700 : 500,
              }}
            >
              マイページ
            </a>

            <a
  href="/analytics"
  onClick={() => setMenuOpen(false)}
  className="nav-link"
  style={{
    color: pathname.startsWith("/analytics") ? "#0070f3" : "#333",
    fontWeight: pathname.startsWith("/analytics") ? 700 : 500,
  }}
>
  分析
</a>

{role === "admin" && (
  <a
    href="/assignments/month"
    onClick={() => setMenuOpen(false)}
    className="nav-link"
    style={{
      color: pathname.startsWith("/assignments/month") ? "#0070f3" : "#333",
fontWeight: pathname.startsWith("/assignments/month") ? 700 : 500,
    }}
  >
    番割作成
  </a>
)}

            {role === "admin" && (
              <a
                href="/admin"
                onClick={() => setMenuOpen(false)}
                className="nav-link"
                style={{
                  color: pathname.startsWith("/admin") ? "#0070f3" : "#333",
                  fontWeight: pathname.startsWith("/admin") ? 700 : 500,
                }}
              >
                管理
              </a>
            )}

            <button
              onClick={handleLogout}
              style={{
                border: "none",
                background: "none",
                cursor: "pointer",
                color: "#333",
                fontWeight: 500,
                textAlign: "left",
                padding: 0,
              }}
            >
              ログアウト
            </button>
          </div>
          </>

          <div
  onMouseEnter={() => setMenuOpen(true)}
  style={{
    position: "fixed",
    top: 0,
    left: 0,
    width: 15,
    height: "100vh",
    zIndex: 998,
  }}
/>

<MyMonthlyScheduleModal
  open={showCalendarModal}
  onClose={() => setShowCalendarModal(false)}
/>

    </header>
  );
}