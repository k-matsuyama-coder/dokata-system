"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ReportForm from "@/app/components/reports/ReportForm";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  createReportDraftKey,
  readReportDraft,
  saveReportDraft,
  removeReportDraft,
  type ReportDraft,
} from "@/lib/reportDraft";
import { withTimeout } from "@/lib/withTimeout";

type Employee = {
  id: string;
  name: string;
};

type MemberEntry = {
  name: string;
  labor: string;
  overtime: string;
};

export default function NewReportPage() {
  const [reportDate, setReportDate] = useState("");
  const [site, setSite] = useState("");
  const [contractorName, setContractorName] = useState("");
  const [work, setWork] = useState("");
  const [shiftType, setShiftType] = useState("day");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [overtimeMinutes, setOvertimeMinutes] = useState("");
  const [note, setNote] = useState("");
  const [employeeName, setEmployeeName] = useState("");

  const [expresswayMain, setExpresswayMain] = useState("");
  const [expresswaySecondary, setExpresswaySecondary] = useState("");
  const [expresswaySubcontract, setExpresswaySubcontract] = useState("");

  const [parkingMain, setParkingMain] = useState("");
  const [parkingSecondary, setParkingSecondary] = useState("");
  const [parkingSubcontract, setParkingSubcontract] = useState("");

  const [fuelGasoline, setFuelGasoline] = useState("");
  const [fuelDiesel, setFuelDiesel] = useState("");

  const [memberInput, setMemberInput] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<MemberEntry[]>([]);
  const [siteSuggestions, setSiteSuggestions] = useState<string[]>([]);
  const [driverInput, setDriverInput] = useState("");
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const [heavyEquipment, setHeavyEquipment] = useState("");
const [operatorName, setOperatorName] = useState("");
const [draftKey, setDraftKey] = useState("");
const [draftReady, setDraftReady] = useState(false);
const [draftNotice, setDraftNotice] = useState("");
const [initialError, setInitialError] = useState("");
const [draftSaveError, setDraftSaveError] = useState("");
const [draftSaved, setDraftSaved] = useState(false);
const [submitted, setSubmitted] = useState(false);

const draftStoppedRef = useRef(false);
const lastDraftJsonRef = useRef<string | null>(null);

const restoreDraft = (draft: ReportDraft) => {
  setReportDate(draft.reportDate);
  setSite(draft.site);
  setContractorName(draft.contractorName);
  setWork(draft.work);
  setShiftType(draft.shiftType);
  setStartTime(draft.startTime);
  setEndTime(draft.endTime);
  setOvertimeMinutes(draft.overtimeMinutes);
  setNote(draft.note);
  setExpresswayMain(draft.expresswayMain);
  setExpresswaySecondary(draft.expresswaySecondary);
  setExpresswaySubcontract(draft.expresswaySubcontract);
  setParkingMain(draft.parkingMain);
  setParkingSecondary(draft.parkingSecondary);
  setParkingSubcontract(draft.parkingSubcontract);
  setFuelGasoline(draft.fuelGasoline);
  setFuelDiesel(draft.fuelDiesel);
  setMemberInput(draft.memberInput);
  setDriverInput(draft.driverInput);
  setHeavyEquipment(draft.heavyEquipment);
  setOperatorName(draft.operatorName);
  setSelectedMembers(draft.selectedMembers);
  setSelectedDrivers(draft.selectedDrivers);
};

  const router = useRouter();
  const getCurrentOrganization = async (accessToken?: string) => {
    let token = accessToken;
  
    if (!token) {
      const { data: sessionData } = await supabase.auth.getSession();
      token = sessionData.session?.access_token;
    }
  
    if (!token) {
      return null;
    }
  
    const res = await fetch("/api/current-organization", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  
    const result = await res.json();
  
    if (!res.ok) {
      console.error(result.error || "organization取得失敗");
      return null;
    }
  
    return result.organizationId as string | null;
  };

  useEffect(() => {
    let active = true;
  
    const fetchInitialData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;
      
      const user = session?.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const cachedEmployeeName = window.sessionStorage.getItem(
        `nippo_employee_name:${user.id}`
      );
      
      if (cachedEmployeeName) {
        setEmployeeName(cachedEmployeeName);
      }
      const [currentOrganizationId, employeeResult] = await Promise.all([
        getCurrentOrganization(session.access_token),
        supabase
          .from("employees")
          .select("name")
          .eq("auth_user_id", user.id)
          .single(),
      ]);

      if (!active) return;
      
      if (!currentOrganizationId) {
        throw new Error("会社情報を取得できませんでした。");
      }
      
      const employee = employeeResult.data;

      if (employeeResult.error || !employee) {
        throw new Error("社員情報を取得できませんでした。");
      }

      if (employee) {
        setEmployeeName(employee.name);
      
        window.sessionStorage.setItem(
          `nippo_employee_name:${user.id}`,
          employee.name
        );
      }

      const {
        data: employeeList,
        error: employeeListError,
      } = await supabase
  .from("employees")
  .select("id, name")
  .eq("organization_id", currentOrganizationId)
  .order("name", { ascending: true });

  if (!active) return;

  if (employeeListError) {
    throw employeeListError;
  }

      if (employeeList) {
        setEmployees(employeeList);
      }

      const key = createReportDraftKey(
        user.id,
        currentOrganizationId,
        window.location.search
      );
      
      const savedDraft = readReportDraft(key);
      
      setDraftKey(key);
      
      if (savedDraft) {
        restoreDraft(savedDraft.data);
        setDraftNotice(
          "入力途中の下書きを復元しました。日付と内容を確認してください。"
        );
        setDraftReady(true);
        return;
      }

      const params = new URLSearchParams(window.location.search);

      const assignmentIdParam = params.get("assignment_id");
const siteParam = params.get("site");
const dateParam = params.get("date");

if (siteParam) {
  setSite(siteParam);
}

if (dateParam) {
  setReportDate(dateParam);
}

if (assignmentIdParam && dateParam) {
  const [assignmentResult, membersResult] = await Promise.all([
    supabase
      .from("assignments")
      .select("site_name, contractor_name, shift_type, start_time, end_time")
      .eq("id", assignmentIdParam)
      .eq("organization_id", currentOrganizationId)
      .single(),

    supabase
      .from("assignment_site_members")
      .select("employee_name, is_driver, is_operator, heavy_equipment")
      .eq("organization_id", currentOrganizationId)
      .eq("assignment_id", assignmentIdParam)
      .eq("work_date", dateParam),
  ]);

  if (!active) return;

  if (assignmentResult.error || membersResult.error) {
    console.error(
      "番割情報の取得失敗:",
      assignmentResult.error ?? membersResult.error
    );
    throw new Error(
      "番割情報を取得できませんでした。画面を開き直してください。"
    );
  }

  const assignment = assignmentResult.data;
  const assignmentMembers = membersResult.data;

  if (assignment) {
    setSite(assignment.site_name ?? "");
    setContractorName(assignment.contractor_name ?? "");
    setShiftType(assignment.shift_type ?? "day");
    setStartTime(assignment.start_time ?? "08:00");
    setEndTime(assignment.end_time ?? "17:00");
  }

  setSelectedMembers(
    (assignmentMembers ?? []).map((member) => ({
      name: member.employee_name,
      labor: "1",
      overtime: "0",
    }))
  );

  setSelectedDrivers(
    (assignmentMembers ?? [])
      .filter((member) => member.is_driver)
      .map((member) => member.employee_name)
  );

  const operator = (assignmentMembers ?? []).find(
    (member) => member.is_operator
  );

  if (operator) {
    setOperatorName(operator.employee_name);
    setHeavyEquipment(operator.heavy_equipment ?? "");
  }
}

      if (active) {
        setDraftReady(true);
      }
    };

    void withTimeout(
      fetchInitialData(),
      20000,
      "日報の準備に時間がかかっています。再度開き直してください。"
    ).catch((error) => {
      if (!active) return;

      // 遅れて返った初期値でフォームを書き換えない
      active = false;

      console.error("日報の初期取得失敗:", error);
      setInitialError(
        error instanceof Error
          ? error.message
          : "日報の準備ができませんでした。"
      );
    });

    return () => {
      active = false;
    };
  }, []);

  const draft: ReportDraft = {
    reportDate,
    site,
    contractorName,
    work,
    shiftType,
    startTime,
    endTime,
    overtimeMinutes,
    note,
    expresswayMain,
    expresswaySecondary,
    expresswaySubcontract,
    parkingMain,
    parkingSecondary,
    parkingSubcontract,
    fuelGasoline,
    fuelDiesel,
    memberInput,
    driverInput,
    heavyEquipment,
    operatorName,
    selectedMembers,
    selectedDrivers,
  };
  
  const draftJson = JSON.stringify(draft);
  
  useEffect(() => {
    if (!draftReady || !draftKey || draftStoppedRef.current) {
      return;
    }
  
    // 初期値を表示しただけでは、新しい下書きを作らない
    if (lastDraftJsonRef.current === null) {
      lastDraftJsonRef.current = draftJson;
      return;
    }
  
    if (lastDraftJsonRef.current === draftJson) {
      return;
    }
  
    try {
      saveReportDraft(
        draftKey,
        JSON.parse(draftJson) as ReportDraft
      );
  
      lastDraftJsonRef.current = draftJson;
      setDraftSaved(true);
      setDraftSaveError("");
    } catch (error) {
      console.error("日報の下書き保存失敗:", error);
      setDraftSaved(false);
      setDraftSaveError(
        "この端末に下書きを保存できません。画面を閉じると入力内容が失われる可能性があります。"
      );
    }
  }, [draftKey, draftReady, draftJson]);

  const handleSubmit = async () => {
    if (!draftReady || draftStoppedRef.current) return;
    console.log({
      employeeName,
      reportDate,
      site,
    });

    const currentOrganizationId = await getCurrentOrganization();

    if (!currentOrganizationId) {
      alert("会社情報が取得できません");
      return;
    }
    
const { data: existingReport } = await supabase
.from("daily_reports")
.select("id")
.eq("organization_id", currentOrganizationId)
.eq("worker_name", employeeName)
.eq("report_date", reportDate)
.eq("site_name", site)
.maybeSingle();

  console.log("existingReport", existingReport);

if (existingReport) {
  alert("この日の日報は既に登録されています");
  return;
}
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      alert("ログインしてください");
      return;
    }

    const currentDraftKey = createReportDraftKey(
      user.id,
      currentOrganizationId,
      window.location.search
    );
    
    if (currentDraftKey !== draftKey) {
      alert(
        "利用者または会社情報が変わっています。元の利用者・会社に戻してから登録してください。"
      );
      return;
    }

    const payload = {
      organization_id: currentOrganizationId,
      worker_name: employeeName,
      site_name: site,
      contractor_name: contractorName,
      work_description: work,
      report_date: reportDate,
      shift_type: shiftType,
      start_time: startTime,
      end_time: endTime,
      overtime_minutes: Math.round(Number(overtimeMinutes || 0) * 60),
      worker_count: selectedMembers.reduce(
        (sum, member) => sum + Number(member.labor || 0),
        0
      ),
      vehicle_count: selectedDrivers.length,
      driver_name: selectedDrivers.join(", "),
      expressway_main: Number(expresswayMain || 0),
      expressway_secondary: Number(expresswaySecondary || 0),
      expressway_subcontract: Number(expresswaySubcontract || 0),
      parking_main: Number(parkingMain || 0),
      parking_secondary: Number(parkingSecondary || 0),
      parking_subcontract: Number(parkingSubcontract || 0),
      fuel_gasoline: Number(fuelGasoline || 0),
      fuel_diesel: Number(fuelDiesel || 0),
      members: selectedMembers.map((member) => member.name).join(", "),
      member_details: selectedMembers,
      note,
      user_id: user.id,
      heavy_equipment: heavyEquipment,
operator_name: operatorName,
    };

    const { data: reportData, error: reportError } = await supabase
      .from("daily_reports")
      .insert([payload])
      .select("id")
      .single();

      console.log("reportError", reportError);

      if (reportError || !reportData) {
        if (
          reportError?.message.includes("duplicate") ||
          reportError?.message.includes("daily_reports_unique_daily")
        ) {
          alert("この日報は既に登録されています");
          return;
        }
      
        alert("日報保存失敗: " + (reportError?.message || "id取得失敗"));
        return;
      }

      const reportMembersPayload = selectedMembers.map((member) => ({
        organization_id: currentOrganizationId,
        report_id: reportData.id,
        employee_id:
          employees.find((employee) => employee.name === member.name)?.id ?? null,
        employee_name: member.name,
        labor: Number(member.labor || 0),
        overtime: Number(member.overtime || 0),
        is_driver: selectedDrivers.includes(member.name),
      }));

    let membersError = null;

if (reportMembersPayload.length > 0) {
  const result = await supabase
    .from("report_members")
    .insert(reportMembersPayload);

  membersError = result.error;
}

if (membersError) {
  await supabase
    .from("daily_reports")
    .delete()
    .eq("id", reportData.id);

  alert("メンバー保存失敗: " + membersError.message);
  return;
      }

      // 日報とメンバーの保存が両方成功してから削除する
draftStoppedRef.current = true;
setSubmitted(true);

try {
  removeReportDraft(draftKey);
} catch (error) {
  console.error("登録済み下書きの削除失敗:", error);
  toast.error(
    "日報は登録済みですが、端末の下書きを削除できませんでした。",
    { duration: 6000 }
  );
}

      toast.success("日報を登録しました", {
        duration: 1200,
      });
      
      setTimeout(() => {
        router.replace("/home");
      }, 900);
    };

    if (submitted) {
      return (
        <div style={{ padding: 24 }}>
          <p role="status">日報を登録しました。</p>
          <Link href="/home">ホームへ戻る</Link>
        </div>
      );
    }

    if (!draftReady) {
      return (
        <div style={{ padding: 24 }}>
          {initialError ? (
            <div role="alert">
              <p>{initialError}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
              >
                再試行
              </button>
            </div>
          ) : (
            <p role="status">日報を準備しています…</p>
          )}
        </div>
      );
    }

    return (
      <div>
        {draftNotice && (
          <p role="status" style={{ padding: "12px 16px" }}>
            {draftNotice}
          </p>
        )}

{draftSaveError ? (
  <p
    role="alert"
    style={{ padding: "0 16px", color: "#b91c1c" }}
  >
    {draftSaveError}
  </p>
) : draftSaved ? (
  <p
    role="status"
    style={{ padding: "0 16px", color: "#555", fontSize: 13 }}
  >
    この端末に下書きを保存しました。
  </p>
) : null}
    
        <ReportForm
        reportDate={reportDate}
        setReportDate={setReportDate}
        contractorName={contractorName}
        setContractorName={setContractorName}
        site={site}
        setSite={setSite}
        work={work}
        setWork={setWork}
        startTime={startTime}
        setStartTime={setStartTime}
        endTime={endTime}
        setEndTime={setEndTime}
        shiftType={shiftType}
        setShiftType={setShiftType}
        overtimeMinutes={overtimeMinutes}
        setOvertimeMinutes={setOvertimeMinutes}
        employeeName={employeeName}
        selectedDrivers={selectedDrivers}
        setSelectedDrivers={setSelectedDrivers}
        driverInput={driverInput}
        setDriverInput={setDriverInput}
        selectedMembers={selectedMembers}
        setSelectedMembers={setSelectedMembers}
        memberInput={memberInput}
        setMemberInput={setMemberInput}
        employees={employees}
        siteSuggestions={siteSuggestions}
        expresswayMain={expresswayMain}
        setExpresswayMain={setExpresswayMain}
        expresswaySecondary={expresswaySecondary}
        setExpresswaySecondary={setExpresswaySecondary}
        expresswaySubcontract={expresswaySubcontract}
        setExpresswaySubcontract={setExpresswaySubcontract}
        parkingMain={parkingMain}
        setParkingMain={setParkingMain}
        parkingSecondary={parkingSecondary}
        setParkingSecondary={setParkingSecondary}
        parkingSubcontract={parkingSubcontract}
        setParkingSubcontract={setParkingSubcontract}
        fuelGasoline={fuelGasoline}
        setFuelGasoline={setFuelGasoline}
        fuelDiesel={fuelDiesel}
        setFuelDiesel={setFuelDiesel}
        note={note}
        setNote={setNote}
        submitLabel="日報を保存"
        onSubmit={handleSubmit}
        heavyEquipment={heavyEquipment}
setHeavyEquipment={setHeavyEquipment}
operatorName={operatorName}
setOperatorName={setOperatorName}
        
      />
    </div>
  );
}