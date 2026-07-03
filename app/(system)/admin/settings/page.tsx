"use client";

import { useEffect, useState } from "react";
import BackButton from "@/app/components/BackButton";
import { supabase } from "@/lib/supabase";
import { hasRole } from "@/app/types/auth";
import type {
  AssignmentGroupKey,
  AssignmentGroupSetting,
} from "@/app/(system)/admin/assignments/month/types";

const ALL_GROUP_KEYS: AssignmentGroupKey[] = [
  "group1",
  "group2",
  "group3",
  "group4",
  "group5",
];

function defaultGroupName(groupKey: AssignmentGroupKey) {
  switch (groupKey) {
    case "group1":
      return "第一工事";
    case "group2":
      return "第二工事";
    case "group3":
      return "グループ③";
    case "group4":
      return "グループ④";
    case "group5":
      return "グループ⑤";
    default:
      return "グループ";
  }
}

async function getCurrentOrganization() {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (!token) {
    throw new Error("ログイン情報がありません");
  }

  const res = await fetch("/api/current-organization", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await res.json();

  if (!res.ok || !result.organizationId) {
    throw new Error(result.error || "会社情報が取得できません");
  }

  return result.organizationId as string;
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AssignmentGroupSetting[]>([]);

  useEffect(() => {
    void initialize();
  }, []);

  const initialize = async () => {
    try {
      setLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: employee, error } = await supabase
        .from("employees")
        .select("role")
        .eq("auth_user_id", user.id)
        .single();

      if (error || !employee || !hasRole(employee.role, "admin")) {
        window.location.href = "/home";
        return;
      }

      const organizationId = await getCurrentOrganization();

      const { data, error: groupError } = await supabase
        .from("assignment_groups")
        .select("id, organization_id, group_key, display_name, is_enabled, sort_order, header_color")
        .eq("organization_id", organizationId)
        .order("sort_order", { ascending: true });

      if (groupError) {
        throw new Error(groupError.message);
      }

      const fetched = (data ?? []) as AssignmentGroupSetting[];

      const normalized = ALL_GROUP_KEYS.map((groupKey, index) => {
        const found = fetched.find((item) => item.group_key === groupKey);

        return (
          found ?? {
            id: `${groupKey}-${index}`,
            organization_id: organizationId,
            group_key: groupKey,
            display_name: defaultGroupName(groupKey),
            is_enabled: groupKey === "group1" || groupKey === "group2",
            sort_order: index + 1,
            header_color:
  groupKey === "group1"
    ? "#e5e7eb"
    : groupKey === "group2"
    ? "#dbeafe"
    : groupKey === "group3"
    ? "#dcfce7"
    : groupKey === "group4"
    ? "#fef3c7"
    : "#fce7f3",
          }
        );
      });

      setSettings(normalized);
    } catch (error) {
      alert(error instanceof Error ? error.message : "設定の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    groupKey: AssignmentGroupKey,
    field: "display_name" | "is_enabled" | "header_color",
    value: string | boolean
  ) => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.group_key === groupKey
          ? {
              ...setting,
              [field]: value,
            }
          : setting
      )
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const organizationId = await getCurrentOrganization();

      const payload = settings.map((setting) => ({
        organization_id: organizationId,
        group_key: setting.group_key,
        display_name: setting.display_name.trim() || defaultGroupName(setting.group_key),
        is_enabled: setting.is_enabled,
        sort_order: setting.sort_order,
        header_color: setting.header_color || "#e5e7eb",
      }));

      const { error } = await supabase.from("assignment_groups").upsert(payload, {
        onConflict: "organization_id,group_key",
      });

      if (error) {
        throw new Error(error.message);
      }

      alert("設定を保存しました");
      await initialize();
    } catch (error) {
      alert(error instanceof Error ? error.message : "設定保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 16 }}>読み込み中...</div>;
  }

  return (
    <div style={{ padding: 16, backgroundColor: "#f5f6f8", minHeight: "100vh" }}>
      <BackButton />

      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ marginBottom: 16 }}>設定</h1>

        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 16,
            display: "grid",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 800 }}>現場グループ設定</div>

          {settings.map((setting) => (
            <div
              key={setting.group_key}
              style={{
                display: "grid",
                gridTemplateColumns: "140px 1fr 120px 120px",
                gap: 12,
                alignItems: "center",
                padding: 12,
                border: "1px solid #e5e7eb",
                borderRadius: 12,
              }}
            >
              <div style={{ fontWeight: 800 }}>{setting.group_key}</div>

              <input
                value={setting.display_name}
                onChange={(e) =>
                  handleChange(setting.group_key, "display_name", e.target.value)
                }
                placeholder={defaultGroupName(setting.group_key)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />

<input
  type="color"
  value={setting.header_color || "#e5e7eb"}
  onChange={(e) =>
    handleChange(setting.group_key, "header_color", e.target.value)
  }
  style={{
    width: "100%",
    height: 42,
    border: "1px solid #d1d5db",
    borderRadius: 8,
    backgroundColor: "#fff",
    padding: 4,
    boxSizing: "border-box",
  }}
/>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  justifyContent: "center",
                  fontWeight: 700,
                }}
              >
                <input
                  type="checkbox"
                  checked={setting.is_enabled}
                  onChange={(e) =>
                    handleChange(setting.group_key, "is_enabled", e.target.checked)
                  }
                />
                使用
              </label>
            </div>
          ))}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                border: "none",
                backgroundColor: saving ? "#9ca3af" : "#111827",
                color: "#fff",
                borderRadius: 10,
                padding: "12px 18px",
                fontWeight: 800,
                cursor: saving ? "default" : "pointer",
              }}
            >
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}