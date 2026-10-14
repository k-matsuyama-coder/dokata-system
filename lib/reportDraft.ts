export const REPORT_DRAFT_FIELDS = [
    "reportDate",
    "site",
    "contractorName",
    "work",
    "shiftType",
    "startTime",
    "endTime",
    "overtimeMinutes",
    "note",
    "expresswayMain",
    "expresswaySecondary",
    "expresswaySubcontract",
    "parkingMain",
    "parkingSecondary",
    "parkingSubcontract",
    "fuelGasoline",
    "fuelDiesel",
    "memberInput",
    "driverInput",
    "heavyEquipment",
    "operatorName",
  ] as const;
  
  export type ReportDraftField =
    (typeof REPORT_DRAFT_FIELDS)[number];
  
  export type ReportDraft = Record<ReportDraftField, string> & {
    selectedMembers: {
      name: string;
      labor: string;
      overtime: string;
    }[];
    selectedDrivers: string[];
  };
  
  type StoredDraft = {
    version: 1;
    savedAt: string;
    data: ReportDraft;
  };
  
  function isObject(
    value: unknown
  ): value is Record<string, unknown> {
    return (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    );
  }
  
  function isReportDraft(value: unknown): value is ReportDraft {
    if (!isObject(value)) return false;
  
    if (
      !REPORT_DRAFT_FIELDS.every(
        (field) => typeof value[field] === "string"
      )
    ) {
      return false;
    }
  
    if (
      !Array.isArray(value.selectedMembers) ||
      !value.selectedMembers.every(
        (member) =>
          isObject(member) &&
          typeof member.name === "string" &&
          typeof member.labor === "string" &&
          typeof member.overtime === "string"
      )
    ) {
      return false;
    }
  
    return (
      Array.isArray(value.selectedDrivers) &&
      value.selectedDrivers.every(
        (driver) => typeof driver === "string"
      )
    );
  }
  
  export function createReportDraftKey(
    userId: string,
    organizationId: string,
    search: string
  ): string {
    const params = new URLSearchParams(search);
  
    const context = [
      params.get("assignment_id") ?? "",
      params.get("date") ?? "",
      params.get("site") ?? "",
    ];
  
    return `dobix:report-draft:v1:${JSON.stringify([
      userId,
      organizationId,
      ...context,
    ])}`;
  }
  
  export function readReportDraft(
    key: string
  ): StoredDraft | null {
    const raw = window.localStorage.getItem(key);
  
    if (!raw) return null;
  
    const parsed: unknown = JSON.parse(raw);
  
    if (
      !isObject(parsed) ||
      parsed.version !== 1 ||
      typeof parsed.savedAt !== "string" ||
      !Number.isFinite(Date.parse(parsed.savedAt)) ||
      !isReportDraft(parsed.data)
    ) {
      throw new Error("保存された下書きを読み取れませんでした。");
    }
  
    return {
      version: 1,
      savedAt: parsed.savedAt,
      data: parsed.data,
    };
  }
  
  export function saveReportDraft(
    key: string,
    data: ReportDraft
  ): void {
    const draft: StoredDraft = {
      version: 1,
      savedAt: new Date().toISOString(),
      data,
    };
  
    window.localStorage.setItem(key, JSON.stringify(draft));
  }
  
  export function removeReportDraft(key: string): void {
    window.localStorage.removeItem(key);
  }