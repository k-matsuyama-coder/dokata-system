export type DailyInfo = {
    id: string;
    assignment_id: string;
    work_date: string;
    planned_count: number | null;
    detail: string | null;
  };
  
  export type AssignmentFile = {
    id: string;
    assignment_id: string;
    file_name: string;
    file_url: string;
  };
  
  export type Assignment = {
    id: string;
    site_name: string | null;
    contractor_name: string | null;
    construction_type: string | null;
    manager_name: string | null;
    contact_phone: string | null;
    address: string | null;
    meeting_time: string | null;
    shift_type: string | null;
    start_date: string | null;
    end_date: string | null;
  };
  
  export type SiteMember = {
    id: string;
    assignment_id: string;
    work_date: string;
    employee_name: string;
  };
  
  export type Employee = {
    name: string;
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