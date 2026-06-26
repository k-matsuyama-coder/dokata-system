import { supabase } from "@/lib/supabase";

export async function getEmployees() {
    const { data } = await supabase
      .from("employees")
      .select("name, company_name")
      .order("company_name", { ascending: true })
      .order("name", { ascending: true });
  
    return data ?? [];
  }

  export async function getVehicles() {
    const { data, error } = await supabase
      .from("vehicles")
      .select("id, vehicle_name, vehicle_type")
      .order("vehicle_name", { ascending: true });
  
    if (error) throw error;
  
    return data ?? [];
  }

  export async function getContractors() {
    const { data, error } = await supabase
      .from("contractors")
      .select("id, name")
      .order("name", { ascending: true });
  
    if (error) throw error;
  
    return data ?? [];
  }

  export async function getContractorContacts() {
    const { data, error } = await supabase
      .from("contractor_contacts")
      .select("id, contractor_id, manager_name, contact_phone");
  
    if (error) throw error;
  
    return data ?? [];
  }
  
  export async function getAssignments() {
    const { data, error } = await supabase
      .from("assignments")
      .select(
        "id, assignment_date, site_name, contractor_name, construction_type, shift_type, start_time, end_time, manager_name, contact_phone, address, meeting_time, start_date, end_date"
      )
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
  
    if (error) throw error;
  
    return data ?? [];
  }

  export async function getAssignmentFiles(
    assignmentIds: string[]
  ) {
    if (assignmentIds.length === 0) return [];
  
    const { data, error } = await supabase
      .from("assignment_files")
      .select("id, assignment_id, file_name, file_url, file_path")
      .in("assignment_id", assignmentIds);
  
    if (error) throw error;
  
    return data ?? [];
  }

  export async function getSiteMembers(
    assignmentIds: string[],
    startDate: string,
    endDate: string
  ) {
    if (assignmentIds.length === 0) return [];
  
    const { data, error } = await supabase
      .from("assignment_site_members")
      .select(
        "id, assignment_id, work_date, employee_name, is_driver, is_operator, is_foreman, heavy_equipment"
      )
      .in("assignment_id", assignmentIds)
      .gte("work_date", startDate)
      .lte("work_date", endDate);
  
    if (error) throw error;
  
    return data ?? [];
  }

  export async function getDailyInfos(
    assignmentIds: string[],
    startDate: string,
    endDate: string
  ) {
    const { data, error } = await supabase
      .from("assignment_site_daily_infos")
      .select("id, assignment_id, work_date, planned_count, detail, vehicle_names")
      .in("assignment_id", assignmentIds)
      .gte("work_date", startDate)
      .lte("work_date", endDate);
  
    if (error) throw error;
  
    return data ?? [];
  }

  export async function getShiftRequests(
    startDate: string,
    endDate: string
  ) {
    const { data, error } = await supabase
      .from("shift_requests")
      .select("id, employee_name, request_date, status")
      .gte("request_date", startDate)
      .lte("request_date", endDate);
  
    if (error) throw error;
  
    return data ?? [];
  }