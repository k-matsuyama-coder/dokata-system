"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Page from "@/app/components/ui/Page";
import OrganizationCreateForm from "./components/OrganizationCreateForm";
import OrganizationList from "./components/OrganizationList";

type Organization = {
  id: string;
  name: string;
  plan: string | null;
  status: string | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
};

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationName, setOrganizationName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");
  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [createdPassword, setCreatedPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchOrganizations = async () => {
    const { data, error } = await supabase
      .from("organizations")
      .select("id, name, plan, status, contract_start_date, contract_end_date")
      .order("name");

    if (error) {
      alert("会社取得失敗: " + error.message);
      return;
    }

    setOrganizations(data ?? []);
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleCreate = async () => {
    if (!organizationName || !adminFirstName || !adminEmail) {
      alert("会社名・管理者名・メールアドレスを入力してください");
      return;
    }

    setLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      alert("ログイン情報がありません");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/super-admin/create-organization", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        organizationName,
        adminLastName,
        adminFirstName,
        adminEmail,
      }),
    });

    const result = await res.json();

    setLoading(false);

    if (!res.ok) {
      alert(result.error || "会社作成失敗");
      return;
    }

    setCreatedPassword(result.password);

    setOrganizationName("");
    setAdminLastName("");
    setAdminFirstName("");
    setAdminEmail("");

    alert("会社と初期管理者を作成しました");
    fetchOrganizations();
  };

  return (
    <Page title="会社管理">

      <OrganizationCreateForm
        organizationName={organizationName}
        setOrganizationName={setOrganizationName}
        adminLastName={adminLastName}
        setAdminLastName={setAdminLastName}
        adminFirstName={adminFirstName}
        setAdminFirstName={setAdminFirstName}
        adminEmail={adminEmail}
        setAdminEmail={setAdminEmail}
        createdPassword={createdPassword}
        loading={loading}
        onCreate={handleCreate}
      />

      <OrganizationList organizations={organizations} />
      </Page>
  );
}