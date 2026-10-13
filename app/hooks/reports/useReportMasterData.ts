import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Contractor, Site } from "../../types/report";

type Props = {
  employeeName: string;
  reportDate: string;
};

export function useReportMasterData({
  employeeName,
  reportDate,
}: Props) {
  const [organizationId, setOrganizationId] = useState("");
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [rawSites, setRawSites] = useState<Site[]>([]);
  const [myAssignments, setMyAssignments] = useState({
    key: "",
    ids: [] as string[],
  });

  // 会社情報は、この画面を開いた時に取得する
  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const load = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!active) return;

        const token = data.session?.access_token;
        if (!token) return;

        const res = await fetch("/api/current-organization", {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        const result = await res.json();

        if (!res.ok || !result.organizationId) {
          throw new Error("会社情報が取得できません");
        }

        if (active) setOrganizationId(result.organizationId);
      } catch (error) {
        if (active) console.error("会社情報の取得失敗:", error);
      }
    };

    void load();

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  // 元請と現場を同時に取得し、届いた方から表示する
  useEffect(() => {
    if (!organizationId) return;

    let active = true;
    const controller = new AbortController();

    const loadContractors = async () => {
      try {
        const { data, error } = await supabase
          .from("contractors")
          .select("name")
          .eq("organization_id", organizationId)
          .order("name", { ascending: true })
          .abortSignal(controller.signal);

        if (error) throw error;
        if (active) setContractors(data ?? []);
      } catch (error) {
        if (active) console.error("元請一覧の取得失敗:", error);
      }
    };

    const loadSites = async () => {
      try {
        const { data, error } = await supabase
          .from("assignments")
          .select("id, site_name, contractor_name, manager_name")
          .eq("organization_id", organizationId)
          .not("site_name", "is", null)
          .order("site_name", { ascending: true })
          .abortSignal(controller.signal);

        if (error) throw error;
        if (active) setRawSites(data ?? []);
      } catch (error) {
        if (active) console.error("現場一覧の取得失敗:", error);
      }
    };

    void loadContractors();
    void loadSites();

    return () => {
      active = false;
      controller.abort();
    };
  }, [organizationId]);

  // 名前・日付が変わったら、自分の配置だけを取り直す
  useEffect(() => {
    if (!organizationId || !employeeName || !reportDate) return;

    let active = true;
    const controller = new AbortController();
    const key = JSON.stringify([
      organizationId,
      employeeName,
      reportDate,
    ]);

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("assignment_site_members")
          .select("assignment_id")
          .eq("organization_id", organizationId)
          .eq("employee_name", employeeName)
          .eq("work_date", reportDate)
          .abortSignal(controller.signal);

        if (error) throw error;

        if (active) {
          setMyAssignments({
            key,
            ids: (data ?? []).map((row) => row.assignment_id),
          });
        }
      } catch (error) {
        if (active) console.error("自分の配置の取得失敗:", error);
      }
    };

    void load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [organizationId, employeeName, reportDate]);

  const sites = useMemo(() => {
    const currentKey = JSON.stringify([
      organizationId,
      employeeName,
      reportDate,
    ]);

    const ids = new Set(
      myAssignments.key === currentKey ? myAssignments.ids : []
    );

    return Array.from(
      new Map(
        rawSites.map((site) => [
          `${site.contractor_name}-${site.site_name}`,
          {
            ...site,
            is_my_assignment: ids.has(site.id),
          },
        ])
      ).values()
    );
  }, [rawSites, myAssignments, organizationId, employeeName, reportDate]);

  return { contractors, sites };
}