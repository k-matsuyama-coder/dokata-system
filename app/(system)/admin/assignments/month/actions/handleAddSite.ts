import { supabase } from "@/lib/supabase";
import type { AssignmentGroupKey } from "../types";

async function getCurrentOrganization() {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (!token) {
    throw new Error("ログイン情報なし");
  }

  const res = await fetch("/api/current-organization", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || "会社情報取得失敗");
  }

  return result.organizationId as string;
}

type Props = {
  month: string;
  siteName: string;
  contractorName: string;
  startDate: string;
  endDate: string;
  shiftType: string;
  managerName: string;
  contactPhone: string;
  address: string;
  meetingTime: string;
  groupKey: AssignmentGroupKey;
};

async function getTopSortOrder(organizationId: string) {
  const { data, error } = await supabase
    .from("assignments")
    .select("sort_order")
    .eq("organization_id", organizationId)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const currentTop =
    typeof data?.sort_order === "number" ? data.sort_order : 0;

  return currentTop - 1;
}

export async function handleAddSiteAction({
  month,
  siteName,
  contractorName,
  startDate,
  endDate,
  shiftType,
  managerName,
  contactPhone,
  address,
  meetingTime,
  groupKey,
}: Props) {
  if (!siteName || !contractorName || !startDate) {
    return {
      data: null,
      error: {
        message: "元請・現場名・工期開始を入力してください",
      },
    };
  }

  try {
    const organizationId = await getCurrentOrganization();
    const sortOrder = await getTopSortOrder(organizationId);

    const { data, error } = await supabase
  .from("assignments")
  .insert({
    organization_id: organizationId,
    assignment_date: `${month}-01`,
    start_date: startDate,
    end_date: endDate || null,
    contractor_name: contractorName,
    site_name: siteName,
    group_key: groupKey,
    sort_order: sortOrder,
    shift_type: shiftType,
    start_time: shiftType === "night" ? "20:00" : "08:00",
    end_time: shiftType === "night" ? "05:00" : "17:00",
    manager_name: managerName,
    contact_phone: contactPhone,
    address,
    meeting_time: meetingTime,
  })
  .select("id")
  .single();

    if (error || !data) {
      return { data, error };
    }

    if (contractorName && managerName && contactPhone) {
      const { data: contractor } = await supabase
        .from("contractors")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("name", contractorName)
        .maybeSingle();

      if (contractor?.id) {
        const { data: existingContact } = await supabase
          .from("contractor_contacts")
          .select("id, contact_phone")
          .eq("organization_id", organizationId)
          .eq("contractor_id", contractor.id)
          .eq("manager_name", managerName)
          .maybeSingle();

        if (!existingContact) {
          await supabase.from("contractor_contacts").insert({
            organization_id: organizationId,
            contractor_id: contractor.id,
            manager_name: managerName,
            contact_phone: contactPhone,
          });
        } else if (!existingContact.contact_phone) {
          await supabase
            .from("contractor_contacts")
            .update({
              contact_phone: contactPhone,
            })
            .eq("organization_id", organizationId)
            .eq("id", existingContact.id);
        }
      }
    }

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        message:
          error instanceof Error ? error.message : "現場追加に失敗しました",
      },
    };
  }
}