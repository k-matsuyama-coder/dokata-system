import { supabase } from "@/lib/supabase";

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
  constructionType: string;
};

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
  constructionType,
}: Props) {
  if (!siteName || !contractorName || !startDate) {
    return {
      data: null,
      error: {
        message: "元請・現場名・工期開始を入力してください",
      },
    };
  }

  const { data, error } = await supabase
  .from("assignments")
  .insert({
    assignment_date: `${month}-01`,
    start_date: startDate,
    end_date: endDate || null,
    contractor_name: contractorName,
    site_name: siteName,
    shift_type: shiftType,
    start_time: shiftType === "night" ? "20:00" : "08:00",
    end_time: shiftType === "night" ? "05:00" : "17:00",
    manager_name: managerName,
    contact_phone: contactPhone,
    address,
    meeting_time: meetingTime,
    construction_type: constructionType,
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
    .eq("name", contractorName)
    .maybeSingle();

  if (contractor?.id) {
    const { data: existingContact } = await supabase
      .from("contractor_contacts")
      .select("id, contact_phone")
      .eq("contractor_id", contractor.id)
      .eq("manager_name", managerName)
      .maybeSingle();

    if (!existingContact) {
      await supabase.from("contractor_contacts").insert({
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
        .eq("id", existingContact.id);
    }
  }
}

return { data, error: null };
}