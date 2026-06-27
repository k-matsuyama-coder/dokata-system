export type Employee = {
    name: string;
  };
  
  export type MemberEntry = {
    name: string;
    labor: string;
    overtime: string;
  };
  
  export type Contractor = {
    name: string;
  };
  
  export type Site = {
    id: string;
    site_name: string;
    contractor_name: string;
    manager_name: string | null;
    is_my_assignment?: boolean;
  };