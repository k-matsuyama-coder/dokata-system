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
      error: {
        message: "元請・現場名・工期開始を入力してください",
      },
    };
  }

  const { error } = await supabase.from("assignments").insert({
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
  });

  return { error };
}