export type Assignment = {
    id: string;
    assignment_date: string;
    site_name: string | null;
    contractor_name: string | null;
    shift_type: string | null;
    start_time: string | null;
    end_time: string | null;
    manager_name: string | null;
    contact_phone: string | null;
    address: string | null;
    meeting_time: string | null;
    construction_type: string | null;
    start_date: string | null;
    end_date: string | null;
  };
  
  export type SiteMember = {
    id: string;
    assignment_id: string;
    work_date: string;
    employee_name: string;
    is_driver: boolean | null;
    is_operator: boolean | null;
    heavy_equipment: string | null;
    is_foreman: boolean | null;
  };
  
  export type DailyInfo = {
    id: string;
    assignment_id: string;
    work_date: string;
    planned_count: number | null;
    detail: string | null;
    vehicle_names: string[] | null;
  };
  
  export type ShiftRequest = {
    id: string;
    employee_name: string;
    request_date: string;
    status: string;
  };
  
  export type AssignmentFile = {
    id: string;
    assignment_id: string;
    file_name: string;
    file_url: string;
    file_path: string;
  };
  
  export type Employee = {
    name: string;
    company_name: string | null;
  };
  
  export type Contractor = {
    id: string;
    name: string;
  };
  
  export type ContractorContact = {
    id: string;
    contractor_id: string;
    manager_name: string;
    contact_phone: string | null;
  };