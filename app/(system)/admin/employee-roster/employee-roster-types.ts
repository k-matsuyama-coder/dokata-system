export type EmployeeSummary = {
    id: string;
    organization_id: string;
    name: string;
    company_name: string | null;
    role: string | null;
  };
  
  export type EmployeePrivateProfile = {
    id: string;
    organization_id: string;
    employee_id: string;
  
    legal_name: string | null;
    legal_name_kana: string | null;
    birth_date: string | null;
  
    job_type: string | null;
    hired_on: string | null;
    experience_years: number | null;
  
    postal_code: string | null;
    address_line1: string | null;
    address_line2: string | null;
    phone_number: string | null;
  
    emergency_contact_name: string | null;
    emergency_contact_relationship: string | null;
    emergency_contact_phone: string | null;
  
    health_insurance_name: string | null;
    health_insurance_number: string | null;
  
    pension_insurance_name: string | null;
    pension_insurance_number: string | null;
  
    employment_insurance_name: string | null;
    employment_insurance_number: string | null;
  
    construction_retirement_book_owned: boolean | null;
  
    created_at: string;
    updated_at: string;
    created_by: string | null;
    updated_by: string | null;
  };

  export type EmployeePrivateProfileSummary = {
    employee_id: string;
    updated_at: string;
  };
  
  export type EmployeePrivateProfileInput = {
    legal_name: string;
    legal_name_kana: string;
    birth_date: string;
  
    postal_code: string;
    address_line1: string;
    address_line2: string;
    phone_number: string;
  
    emergency_contact_name: string;
    emergency_contact_relationship: string;
    emergency_contact_phone: string;
  
    hired_on: string;
  
    job_type?: string;
    experience_years?: string;
  
    health_insurance_name?: string;
    health_insurance_number?: string;
  
    pension_insurance_name?: string;
    pension_insurance_number?: string;
  
    employment_insurance_name?: string;
    employment_insurance_number?: string;
  
    construction_retirement_book_owned?: boolean | null;
  };
  
  export type EmployeeHealthProfile = {
    id: string;
    organization_id: string;
    employee_id: string;
  
    recent_health_check_date: string | null;
    health_check_medical_institution: string | null;
  
    blood_pressure_high: number | null;
    blood_pressure_low: number | null;
    blood_type: string | null;
  
    special_health_check_date: string | null;
    special_health_check_type: string | null;
  
    created_at: string;
    updated_at: string;
    created_by: string | null;
    updated_by: string | null;
  };
  
  export type EmployeeHealthProfileInput = {
    recent_health_check_date: string;
    health_check_medical_institution: string;
  
    blood_pressure_high: string;
    blood_pressure_low: string;
    blood_type: string;
  
    special_health_check_date: string;
    special_health_check_type: string;
  };
  
  export type EmployeeRosterRow = EmployeeSummary & {
    privateProfile: EmployeePrivateProfileSummary | null;
  };
  
  export type EmployeeRosterStatus = "draft" | "finalized";
  
  export type EmployeeRoster = {
    id: string;
    organization_id: string;
  
    title: string;
  
    business_office_name: string | null;
    site_manager_name: string | null;
  
    primary_company_name: string | null;
    primary_representative_name: string | null;
    primary_is_related_member: boolean | null;
  
    secondary_company_name: string | null;
    secondary_representative_name: string | null;
    secondary_is_related_member: boolean | null;
  
    prime_contractor_confirmation: string | null;
    confirmation_date: string | null;
  
    status: EmployeeRosterStatus;
  
    finalized_at: string | null;
    finalized_by: string | null;
  
    created_at: string;
    updated_at: string;
    created_by: string | null;
    updated_by: string | null;
  };
  
  export type EmployeeRosterMember = {
    id: string;
    roster_id: string;
    organization_id: string;
    employee_id: string | null;
  
    display_order: number;
    roster_number: string | null;
    role_marks: string[];
  
    site_entry_date: string | null;
    acceptance_training_date: string | null;
  
    snapshot_data: Record<string, unknown> | null;
    snapshot_created_at: string | null;
  
    created_at: string;
    updated_at: string;
    created_by: string | null;
    updated_by: string | null;
  };

  export type EmployeeRosterMemberInput = {
    employee_id: string;
    display_order: number;
    roster_number: string;
    role_marks: string[];
    site_entry_date: string;
    acceptance_training_date: string;
  };
  
  export type EmployeeRosterDraftInput = {
    title: string;
  
    business_office_name: string;
    site_manager_name: string;
  
    primary_company_name: string;
    primary_representative_name: string;
    primary_is_related_member: boolean | null;
  
    secondary_company_name: string;
    secondary_representative_name: string;
    secondary_is_related_member: boolean | null;
  
    prime_contractor_confirmation: string;
    confirmation_date: string;
  
    members: EmployeeRosterMemberInput[];
  };
  
  export type EmployeeRosterEditorData = {
    roster: EmployeeRoster;
    members: EmployeeRosterMember[];
    candidates: EmployeeRosterRow[];
  };

  export type EmployeeRosterQualificationSnapshot = {
    qualificationName?: string | null;
    name?: string | null;
    issueDate?: string | null;
  };
  
  export type EmployeeRosterLicenseSnapshot = {
    licenseName?: string | null;
    name?: string | null;
    issueDate?: string | null;
    expiryDate?: string | null;
  };
  
  export type EmployeeRosterSnapshot = {
    snapshotVersion: number;
    finalizedOn: string;
  
    employeeId: string;
    employeeName: string;
    employeeNameKana: string | null;
    companyName: string | null;
  
    rosterNumber: string | null;
    displayOrder: number;
    roleMarks: string[];
  
    jobType: string | null;
    hiredOn: string | null;
    experienceYears: number | null;
  
    birthDate: string | null;
    ageAtFinalization: number | null;
  
    postalCode: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    phoneNumber: string | null;
  
    emergencyContactName: string | null;
    emergencyContactRelationship: string | null;
    emergencyContactPhone: string | null;
  
    recentHealthCheckDate: string | null;
    healthCheckMedicalInstitution: string | null;
    bloodPressureHigh: number | null;
    bloodPressureLow: number | null;
    bloodType: string | null;
  
    specialHealthCheckDate: string | null;
    specialHealthCheckType: string | null;
  
    healthInsuranceName: string | null;
    healthInsuranceNumber: string | null;
  
    pensionInsuranceName: string | null;
    pensionInsuranceNumber: string | null;
  
    employmentInsuranceName: string | null;
    employmentInsuranceNumber: string | null;
  
    constructionRetirementBookOwned: boolean | null;
  
    siteEntryDate: string | null;
    acceptanceTrainingDate: string | null;
  
    certifications: EmployeeRosterQualificationSnapshot[];
    licenses: EmployeeRosterLicenseSnapshot[];
  };