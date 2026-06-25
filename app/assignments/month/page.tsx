"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import BackButton from "@/app/components/BackButton";
import type {
  Assignment,
  SiteMember,
  DailyInfo,
  ShiftRequest,
  AssignmentFile,
  Employee,
  Contractor,
  ContractorContact,
} from "./types";

import {
  th,
  td,
  cellTd,
  stickyTd1,
  stickyTd2,
  stickyTd3,
  stickyTh1,
  stickyTh2,
  stickyTh3,
  tagBlue,
  tagPurple,
  tagYellow,
} from "./styles";

import {
  getDayType,
  getWeekStart,
  toDateString,
  isOutOfAssignmentPeriod,
} from "./utils";

import {
  getEmployees,
  getVehicles,
  getContractors,
  getContractorContacts,
  getAssignments,
  getAssignmentFiles,
} from "./api";

export default function MonthlyAssignmentsPage() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  const [weekStart, setWeekStart] = useState(getWeekStart);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentFiles, setAssignmentFiles] = useState<AssignmentFile[]>([]);
  const [siteMembers, setSiteMembers] = useState<SiteMember[]>([]);
  const [dailyInfos, setDailyInfos] = useState<DailyInfo[]>([]);
  const [shiftRequests, setShiftRequests] = useState<ShiftRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [siteName, setSiteName] = useState("");
  const [contractorName, setContractorName] = useState("");
  const [shiftType, setShiftType] = useState("day");
  const [managerName, setManagerName] = useState("");
const [contactPhone, setContactPhone] = useState("");
const [address, setAddress] = useState("");
const [meetingTime, setMeetingTime] = useState("08:00");
const [startDate, setStartDate] = useState("");
const [endDate, setEndDate] = useState("");
const [contractors, setContractors] = useState<Contractor[]>([]);
const [contractorContacts, setContractorContacts] = useState<ContractorContact[]>([]);
const [showAddModal, setShowAddModal] = useState(false);
const [showMemberModal, setShowMemberModal] = useState(false);
const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
const [constructionType, setConstructionType] = useState("第一工事");
const [sortMode, setSortMode] = useState("manual");
const [showFinished, setShowFinished] = useState(false);
const [draggingAssignmentId, setDraggingAssignmentId] = useState<string | null>(null);

  const [draggingEmployeeName, setDraggingEmployeeName] = useState<string | null>(null);
  const [draggingSiteMemberId, setDraggingSiteMemberId] = useState<string | null>(null);
  const [draggingVehicleName, setDraggingVehicleName] = useState<string | null>(null);
const [draggingVehicleFrom, setDraggingVehicleFrom] = useState<{
  assignmentId: string;
  workDate: string;
  vehicleName: string;
} | null>(null);

const [copiedVehicleNames, setCopiedVehicleNames] = useState<string[]>([]);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string | null>(null);
const [selectedSiteMemberId, setSelectedSiteMemberId] = useState<string | null>(null);
const [selectedDate, setSelectedDate] = useState<string | null>(null);
const [selectedShiftType, setSelectedShiftType] = useState<string | null>(null);
const [copiedEmployeeNames, setCopiedEmployeeNames] = useState<string[]>([]);
const [editingDetails, setEditingDetails] = useState<Record<string, string>>({});
const [saveTimers, setSaveTimers] = useState<
  Record<string, ReturnType<typeof setTimeout>>
>({});
const [vehicles, setVehicles] = useState<
  {
    id: string;
    vehicle_name: string;
    vehicle_type: string | null;
  }[]
>([]);

const [isMobile, setIsMobile] = useState(false);

const days = useMemo(() => {
  if (viewMode === "week") {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);

      return toDateString(d);
    });
  }

  const [year, monthNum] = month.split("-").map(Number);

  const firstDay = new Date(year, monthNum - 1, 1);
  const lastDay = new Date(year, monthNum, 0);

  const start = new Date(firstDay);
  start.setDate(start.getDate() - 7);

  const end = new Date(lastDay);
  end.setDate(end.getDate() + 7);

  const result: string[] = [];

  const current = new Date(start);

  while (current <= end) {
    result.push(toDateString(current));

    current.setDate(current.getDate() + 1);
  }

  return result;
}, [month, viewMode, weekStart]);

  const todayString = new Date().toISOString().slice(0, 10);

const getDateHeaderStyle = (date: string) => {
  const dayType = getDayType(date);
  const isToday = date === todayString;

  return {
    ...th,
    boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
    backgroundColor: isToday
      ? "#fff3cd"
      : dayType === "sunday"
      ? "#ffe5e5"
      : dayType === "saturday"
      ? "#e5f0ff"
      : "#f5f5f5",
    color:
      dayType === "sunday"
        ? "#d11a2a"
        : dayType === "saturday"
        ? "#0a66c2"
        : "#111",
    fontWeight: 800,
  };
};

const getCellStyle = (
  date: string,
  plannedCount: number | null | undefined,
  memberCount: number,
  shiftType: string | null
) => {
  const dayType = getDayType(date);
  const isToday = date === todayString;

  const isShort =
    plannedCount !== null &&
    plannedCount !== undefined &&
    plannedCount > 0 &&
    memberCount < plannedCount;

  const isPerfect =
    plannedCount !== null &&
    plannedCount !== undefined &&
    plannedCount > 0 &&
    memberCount === plannedCount;

    return {
      ...cellTd,
      minWidth: viewMode === "week"
        ? (isMobile ? 160 : 220)
        : (isMobile ? 120 : 150),
      height: isMobile ? 120 : 140,
      padding: isMobile ? 4 : 6,
      backgroundColor:
  shiftType === "night"
    ? "#e5e7eb"
    : isShort
    ? "#ffe5e5"
    : isPerfect
    ? "#e8f7e8"
    : isToday
    ? "#fffdf0"
    : dayType === "sunday"
    ? "#fff7f7"
    : dayType === "saturday"
    ? "#f7fbff"
    : "#fcfcfc",
  };
};

  const fetchData = async () => {
    const startDate = days[0];
    const endDate = days[days.length - 1];
    const employeeData = await getEmployees();

setEmployees(employeeData);
const vehicleData = await getVehicles();

setVehicles(vehicleData);

const contractorData = await getContractors();

setContractors(contractorData);

const contactData = await getContractorContacts();

setContractorContacts(contactData);

const assignmentData = await getAssignments();

setAssignments(assignmentData);

    const assignmentIds = (assignmentData ?? []).map((a) => a.id);

    if (assignmentIds.length === 0) {
      setSiteMembers([]);
      setDailyInfos([]);
      setShiftRequests([]);
      setAssignmentFiles([]);
      return;
    }

    const fileData = await getAssignmentFiles(assignmentIds);

setAssignmentFiles(fileData);

    const { data: memberData, error: memberError } = await supabase
      .from("assignment_site_members")
      .select("id, assignment_id, work_date, employee_name, is_driver, is_operator, is_foreman, heavy_equipment")
      .in("assignment_id", assignmentIds)
      .gte("work_date", startDate)
      .lte("work_date", endDate);

    if (memberError) {
      alert("メンバー取得失敗: " + memberError.message);
      return;
    }

    const { data: dailyInfoData, error: dailyInfoError } = await supabase
  .from("assignment_site_daily_infos")
  .select("id, assignment_id, work_date, planned_count, detail, vehicle_names")
  .in("assignment_id", assignmentIds)
  .gte("work_date", startDate)
  .lte("work_date", endDate);

  if (dailyInfoError) {
    alert("日別情報取得失敗: " + dailyInfoError.message);
    return;
  }

    setSiteMembers(memberData ?? []);

    const { data: shiftRequestData, error: shiftRequestError } = await supabase
  .from("shift_requests")
  .select("id, employee_name, request_date, status")
  .gte("request_date", startDate)
  .lte("request_date", endDate);

if (shiftRequestError) {
  alert("休み希望取得失敗: " + shiftRequestError.message);
  return;
}

setShiftRequests(shiftRequestData ?? []);
setDailyInfos(dailyInfoData ?? []);
    
  };

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: employee } = await supabase
  .from("employees")
  .select(`
    *,
    organizations (
      id,
      name
    )
  `)
  .eq("auth_user_id", user.id)
  .single();

      if (!employee || employee.role !== "admin") {
        alert("管理者のみ閲覧できます");
        window.location.href = "/home";
        return;
      }

      fetchData();
    };

    checkAdmin();
  }, [month, viewMode, weekStart]);

  useEffect(() => {
    const channel = supabase
      .channel("monthly-assignments-realtime")
  
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assignment_site_members",
        },
        () => {
          console.log("メンバー配置更新あり");
          fetchData();
        }
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shift_requests",
        },
        () => {
          fetchData();
        }
      )
  
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assignment_site_daily_infos",
        },
        () => {
          fetchData();
        }
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assignments",
        },
        () => {
          console.log("現場更新あり");
          fetchData();
        }
      )
  
      .subscribe();
  
    return () => {
      supabase.removeChannel(channel);
    };
  }, [month, viewMode, weekStart]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
  
    checkMobile();
  
    window.addEventListener("resize", checkMobile);
  
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  useEffect(() => {
    if (viewMode !== "week") return;
  
    setWeekStart(getWeekStart());
  }, [month]);

  const updateAssignment = async () => {
    if (!editingAssignment) return;
  
    const { error } = await supabase
      .from("assignments")
      .update({
        contractor_name: editingAssignment.contractor_name,
        site_name: editingAssignment.site_name,
        construction_type: editingAssignment.construction_type,
        manager_name: editingAssignment.manager_name,
        contact_phone: editingAssignment.contact_phone,
        address: editingAssignment.address,
        meeting_time: editingAssignment.meeting_time,
        shift_type: editingAssignment.shift_type,
      
        start_time:
          editingAssignment.shift_type === "night"
            ? "20:00"
            : "08:00",
      
        end_time:
          editingAssignment.shift_type === "night"
            ? "05:00"
            : "17:00",
      
        start_date: editingAssignment.start_date,
        end_date: editingAssignment.end_date,
      })
      .eq("id", editingAssignment.id);
  
    if (error) {
      alert("現場更新失敗: " + error.message);
      return;
    }
  
    setEditingAssignment(null);
    fetchData();
  };

  const uploadFiles = async (
    assignmentId: string,
    files: FileList | null
  ) => {
    if (!files) return;
  
    for (const file of Array.from(files)) {
      const filePath = `${assignmentId}/${Date.now()}_${file.name}`;
  
      const { error: uploadError } = await supabase.storage
        .from("assignment-files")
        .upload(filePath, file);
  
      if (uploadError) {
        alert("アップロード失敗: " + uploadError.message);
        return;
      }
  
      const { data } = supabase.storage
        .from("assignment-files")
        .getPublicUrl(filePath);
  
      const { error: insertError } = await supabase
        .from("assignment_files")
        .insert({
          assignment_id: assignmentId,
          file_name: file.name,
          file_url: data.publicUrl,
          file_path: filePath,
        });
  
      if (insertError) {
        alert("ファイル登録失敗: " + insertError.message);
        return;
      }
    }
  
    fetchData();
  };

  const deleteAssignmentFile = async (file: AssignmentFile) => {
    const ok = window.confirm("このファイルを削除しますか？");
    if (!ok) return;
  
    const { error: storageError } = await supabase.storage
      .from("assignment-files")
      .remove([file.file_path]);
  
    if (storageError) {
      alert("ストレージ削除失敗: " + storageError.message);
      return;
    }
  
    const { error } = await supabase
      .from("assignment_files")
      .delete()
      .eq("id", file.id);
  
    if (error) {
      alert("ファイル削除失敗: " + error.message);
      return;
    }
  
    setAssignmentFiles((prev) =>
      prev.filter((item) => item.id !== file.id)
    );
  };

  const handleAddSite = async () => {
    if (!siteName || !contractorName || !startDate) {
      alert("元請・現場名・工期開始を入力してください");
      return;
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

    if (error) {
      alert("現場追加失敗: " + error.message);
      return;
    }

    setSiteName("");
setContractorName("");
setManagerName("");
setContactPhone("");
setAddress("");
setShiftType("day");
setConstructionType("第一工事");
setMeetingTime("08:00");
setStartDate("");
setEndDate("");
setShowAddModal(false);

    fetchData();
  };

  const addEmployeeToCell = async (
    employeeName: string,
    assignmentId: string,
    workDate: string,
    autoForeman = true
  ) => {
    const exists = siteMembers.some(
      (m) =>
        m.assignment_id === assignmentId &&
        m.work_date === workDate &&
        m.employee_name === employeeName
    );
  
    if (exists) return;
  
    const cellMembers = getCellMembers(assignmentId, workDate);
    const isFirstMember = autoForeman && cellMembers.length === 0;
  
    const { data, error } = await supabase
      .from("assignment_site_members")
      .insert({
        assignment_id: assignmentId,
        work_date: workDate,
        employee_name: employeeName,
        is_driver: false,
        is_operator: false,
        is_foreman: isFirstMember,
        heavy_equipment: "",
      })
      .select("id, assignment_id, work_date, employee_name, is_driver, is_operator, is_foreman, heavy_equipment")
      .single();
  
    if (error || !data) {
      alert("メンバー追加失敗: " + (error?.message || "取得失敗"));
      return;
    }
  
    setSiteMembers((prev) => [...prev, data]);
    setDraggingEmployeeName(null);
  };

  const moveSiteMember = async (
    siteMemberId: string,
    assignmentId: string,
    workDate: string
  ) => {
    const { error } = await supabase
      .from("assignment_site_members")
      .update({
        assignment_id: assignmentId,
        work_date: workDate,
      })
      .eq("id", siteMemberId);
  
    if (error) {
      alert("移動失敗: " + error.message);
      return;
    }
  
    setDraggingSiteMemberId(null);
    setSelectedSiteMemberId(null);
  
    fetchData();
  };

  const deleteSiteMember = async (id: string) => {
    const { error } = await supabase
      .from("assignment_site_members")
      .delete()
      .eq("id", id);

    if (error) {
      alert("削除失敗: " + error.message);
      return;
    }

    setSiteMembers((prev) =>
      prev.filter((m) => m.id !== id)
    );
  };

  const toggleForeman = async (member: SiteMember) => {
    const { error } = await supabase
      .from("assignment_site_members")
      .update({
        is_foreman: !member.is_foreman,
      })
      .eq("id", member.id);
  
    if (error) {
      alert("職長変更失敗: " + error.message);
      return;
    }
  
    setSiteMembers((prev) =>
      prev.map((m) =>
        m.id === member.id
          ? { ...m, is_foreman: !member.is_foreman }
          : m
      )
    );
  };

  const deleteAssignment = async (id: string) => {
    const ok = window.confirm("この現場を削除しますか？");
    if (!ok) return;

    const filesToDelete = assignmentFiles.filter(
      (file) => file.assignment_id === id && file.file_path
    );
    
    if (filesToDelete.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("assignment-files")
        .remove(filesToDelete.map((file) => file.file_path));
    
      if (storageError) {
        alert("添付ファイル削除失敗: " + storageError.message);
        return;
      }
    }
  
    await supabase
  .from("assignment_site_members")
  .delete()
  .eq("assignment_id", id);

await supabase
  .from("assignment_site_daily_infos")
  .delete()
  .eq("assignment_id", id);

await supabase
  .from("assignment_files")
  .delete()
  .eq("assignment_id", id);

const { error } = await supabase
  .from("assignments")
  .delete()
  .eq("id", id);
  
    if (error) {
      alert("現場削除失敗: " + error.message);
      return;
    }
  
    setAssignments((prev) => prev.filter((a) => a.id !== id));
    setSiteMembers((prev) => prev.filter((m) => m.assignment_id !== id));
    setAssignmentFiles((prev) =>
  prev.filter((file) => file.assignment_id !== id)
);
  };

  const moveAssignmentRow = async (
    fromAssignmentId: string,
    toAssignmentId: string
  ) => {
    if (fromAssignmentId === toAssignmentId) return;
  
    const fromIndex = assignments.findIndex((a) => a.id === fromAssignmentId);
    const toIndex = assignments.findIndex((a) => a.id === toAssignmentId);
  
    if (fromIndex === -1 || toIndex === -1) return;
  
    const nextAssignments = [...assignments];
    const [moved] = nextAssignments.splice(fromIndex, 1);
    nextAssignments.splice(toIndex, 0, moved);
  
    setAssignments(nextAssignments);
  
    const updates = nextAssignments.map((assignment, index) =>
      supabase
        .from("assignments")
        .update({ sort_order: index })
        .eq("id", assignment.id)
    );
  
    const results = await Promise.all(updates);
  
    const failed = results.find((result) => result.error);
  
    if (failed?.error) {
      alert("並び替え保存失敗: " + failed.error.message);
      fetchData();
    }
  };

  const getCellMembers = (assignmentId: string, workDate: string) => {
    return siteMembers.filter(
      (m) => m.assignment_id === assignmentId && m.work_date === workDate
    );
  };

  const getDailyInfo = (assignmentId: string, workDate: string) => {
    return dailyInfos.find(
      (info) =>
        info.assignment_id === assignmentId &&
        info.work_date === workDate
    );
  };
  
  const updateDailyInfo = async (
    assignmentId: string,
    workDate: string,
    field: "planned_count" | "detail" | "vehicle_names",
    value: string
  ) => {
    const existing = getDailyInfo(assignmentId, workDate);
  
    const payload = {
      assignment_id: assignmentId,
      work_date: workDate,
      planned_count:
  field === "planned_count"
    ? value === ""
      ? null
      : Number(value)
    : existing?.planned_count ?? null,
      detail:
        field === "detail"
          ? value
          : existing?.detail ?? null,
          vehicle_names:
  field === "vehicle_names"
    ? value ? value.split(",").filter(Boolean) : []
    : existing?.vehicle_names ?? [],
    };
  
    const { data, error } = await supabase
      .from("assignment_site_daily_infos")
      .upsert(payload, {
        onConflict: "assignment_id,work_date",
      })
      .select("id, assignment_id, work_date, planned_count, detail, vehicle_names")
      .single();
  
    if (error || !data) {
      alert("更新失敗: " + (error?.message || "取得失敗"));
      return;
    }
  
    setDailyInfos((prev) => {
      const exists = prev.some((info) => info.id === data.id);
  
      if (exists) {
        return prev.map((info) => (info.id === data.id ? data : info));
      }
  
      return [...prev, data];
    });
    const key = `${assignmentId}_${workDate}`;

setEditingDetails((prev) => {
  const next = { ...prev };
  delete next[key];
  return next;
});
setSaveTimers((prev) => {
  const next = { ...prev };
  delete next[key];
  return next;
});
  };

  const addVehicleToCell = async (
    vehicleName: string,
    assignmentId: string,
    workDate: string
  ) => {
    const existing = getDailyInfo(assignmentId, workDate);
    const current = existing?.vehicle_names ?? [];
  
    if (current.includes(vehicleName)) return;
  
    await updateDailyInfo(
      assignmentId,
      workDate,
      "vehicle_names",
      [...current, vehicleName].join(",")
    );
  };
  
  const removeVehicleFromCell = async (
    vehicleName: string,
    assignmentId: string,
    workDate: string
  ) => {
    const existing = getDailyInfo(assignmentId, workDate);
    const current = existing?.vehicle_names ?? [];
  
    await updateDailyInfo(
      assignmentId,
      workDate,
      "vehicle_names",
      current.filter((name) => name !== vehicleName).join(",")
    );
  };
  
  const moveVehicleToCell = async (
    vehicleName: string,
    fromAssignmentId: string,
    fromWorkDate: string,
    toAssignmentId: string,
    toWorkDate: string
  ) => {
    await removeVehicleFromCell(vehicleName, fromAssignmentId, fromWorkDate);
    await addVehicleToCell(vehicleName, toAssignmentId, toWorkDate);
  };

  const isAssignedSameDateDifferentShift = (
    employeeName: string,
    workDate: string,
    currentShiftType: string | null
  ) => {
    return siteMembers.some((member) => {
      if (member.work_date !== workDate) return false;
      if (member.employee_name !== employeeName) return false;
  
      const assignment = assignments.find(
        (a) => a.id === member.assignment_id
      );
  
      return (
        (assignment?.shift_type ?? "day") !==
        (currentShiftType ?? "day")
      );
    });
  };

  const getUnassignedEmployeesByDate = (
    workDate: string,
    shiftType: string | null
  ) => {
    const assignedNames = siteMembers
      .filter((m) => {
        if (m.work_date !== workDate) return false;
  
        const assignment = assignments.find(
          (a) => a.id === m.assignment_id
        );
  
        return (assignment?.shift_type ?? "day") === (shiftType ?? "day");
      })
      .map((m) => m.employee_name);
  
      const holidayNames = shiftRequests
      .filter((request) => request.request_date === workDate)
      .map((request) => request.employee_name);
    
    return employees.filter(
      (employee) =>
        !assignedNames.includes(employee.name) &&
        !holidayNames.includes(employee.name)
    );
  };

  const getAssignmentCount = (employeeName: string) => {
    return siteMembers.filter(
      (member) => member.employee_name === employeeName
    ).length;
  };

  const inputStyle = {
    width: "100%",
    padding: 10,
    border: "1px solid #ccc",
    borderRadius: 8,
    fontSize: 15,
    boxSizing: "border-box" as const,
  };

  const sortedAssignments = [...assignments].sort((a, b) => {
    switch (sortMode) {
      case "site":
        return (a.site_name || "").localeCompare(
          b.site_name || "",
          "ja"
        );
  
      case "contractor":
        return (a.contractor_name || "").localeCompare(
          b.contractor_name || "",
          "ja"
        );
  
      case "manager":
        return (a.manager_name || "").localeCompare(
          b.manager_name || "",
          "ja"
        );
  
      case "construction":
        return (a.construction_type || "").localeCompare(
          b.construction_type || "",
          "ja"
        );
  
      case "shift":
        return (a.shift_type || "").localeCompare(
          b.shift_type || "",
          "ja"
        );
  
      default:
        return 0;
    }
  });

  const visibleAssignments = sortedAssignments.filter((assignment) => {
    if (showFinished) return true;
  
    if (!assignment.start_date || !assignment.end_date) {
      return true;
    }
  
    return (
      assignment.start_date <= days[days.length - 1] &&
      assignment.end_date >= todayString
    );
  });
  
  const groupedAssignments = [
    {
      label: "第一工事",
      rows: visibleAssignments.filter(
        (a) => a.construction_type === "第一工事"
      ),
      color: "#eef6ff",
    },
    {
      label: "第二工事",
      rows: visibleAssignments.filter(
        (a) => a.construction_type === "第二工事"
      ),
      color: "#fff8e6",
    },
  ];

  return (
    <div style={{ padding: isMobile ? 8 : 16 }}>
      <BackButton />

      <div
  style={{
    width: "100%",
    paddingRight: isMobile ? 0 : 190,
    paddingBottom: isMobile ? 110 : 0,
  }}
>
<h1>{viewMode === "week" ? "週間番割表" : "月間番割表"}</h1>

        <div
  style={{
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "nowrap",
    marginBottom: 16,
    overflowX: "auto",
  }}
>
  <input
    type="month"
    value={month}
    onChange={(e) => setMonth(e.target.value)}
    style={{
      padding: 10,
      borderRadius: 8,
      border: "1px solid #ccc",
      fontSize: 16,
      height: 42,
    }}
  />

<div style={{ display: "flex", gap: 8 }}>
  <button
    onClick={() => setViewMode("month")}
    style={{
      padding: "8px 14px",
      background: viewMode === "month" ? "#2563eb" : "#fff",
      color: viewMode === "month" ? "#fff" : "#000",
      border: "1px solid #ccc",
      borderRadius: 6,
    }}
  >
    月間
  </button>

  <button
    onClick={() => setViewMode("week")}
    style={{
      padding: "8px 14px",
      background: viewMode === "week" ? "#2563eb" : "#fff",
      color: viewMode === "week" ? "#fff" : "#000",
      border: "1px solid #ccc",
      borderRadius: 6,
    }}
  >
    週間
  </button>
</div>

{viewMode === "week" && (
  <div style={{ display: "flex", gap: 8 }}>
    <button
      onClick={() => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() - 7);
        setWeekStart(d);
      }}
    >
      ← 前週
    </button>

    <button
      onClick={() => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + 7);
        setWeekStart(d);
      }}
    >
      次週 →
    </button>
    <button
  onClick={() => {
    setWeekStart(getWeekStart());
  }}
>
  今週
</button>
  </div>
)}

<select
  value={sortMode}
  onChange={(e) => setSortMode(e.target.value)}
  style={{
    width: 160,
    height: 42,
    padding: "8px 12px",
    border: "1px solid #ccc",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 700,
    backgroundColor: "#fff",
    boxSizing: "border-box",
    flexShrink: 0,
  }}
>
  <option value="manual">標準</option>
  <option value="site">現場順</option>
  <option value="contractor">元請順</option>
  <option value="manager">担当者順</option>
  <option value="construction">工事区分順</option>
  <option value="shift">昼夜順</option>
</select>

<label
  style={{
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontWeight: 700,
    whiteSpace: "nowrap",
  }}
>
  <input
    type="checkbox"
    checked={showFinished}
    onChange={(e) => setShowFinished(e.target.checked)}
  />
  終了現場表示
</label>

<button
  type="button"
  onClick={() => setShowAddModal(true)}
>
  ＋ 現場追加
</button>
</div>

        {showAddModal && (
  <div
    onClick={() => setShowAddModal(false)}
    style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.45)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
      padding: 16,
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: "100%",
        maxWidth: 520,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        display: "grid",
        gap: 10,
        maxHeight: "90vh",
        overflowY: "auto",
      }}
    >
      <h2 style={{ margin: 0 }}>現場追加</h2>

      <div>
        <input
          list="contractors"
          value={contractorName}
          onChange={(e) => {
            setContractorName(e.target.value);
            setManagerName("");
            setContactPhone("");
          }}
          placeholder="元請"
          style={inputStyle}
        />

        <datalist id="contractors">
          {contractors.map((contractor) => (
            <option
              key={contractor.id}
              value={contractor.name}
            />
          ))}
        </datalist>
      </div>

      <input
        value={siteName}
        onChange={(e) => setSiteName(e.target.value)}
        placeholder="現場名"
        style={inputStyle}
      />

<select
  value={constructionType}
  onChange={(e) => setConstructionType(e.target.value)}
  style={inputStyle}
>
  <option value="第一工事">第一工事</option>
  <option value="第二工事">第二工事</option>
</select>

      <div>
        <input
          list="manager-list"
          value={managerName}
          onChange={(e) => {
            const value = e.target.value;

            setManagerName(value);

            const contractor = contractors.find(
              (c) => c.name === contractorName
            );

            if (!contractor) return;

            const contact = contractorContacts.find(
              (c) =>
                c.contractor_id === contractor.id &&
                c.manager_name === value
            );

            if (contact) {
              setContactPhone(contact.contact_phone ?? "");
            }
          }}
          placeholder="担当者"
          style={inputStyle}
        />

        <datalist id="manager-list">
          {contractorContacts
            .filter((contact) => {
              const contractor = contractors.find(
                (c) => c.id === contact.contractor_id
              );

              return contractor?.name === contractorName;
            })
            .map((contact) => (
              <option
                key={contact.id}
                value={contact.manager_name}
              />
            ))}
        </datalist>
      </div>

      <input
        value={contactPhone}
        onChange={(e) => setContactPhone(e.target.value)}
        placeholder="連絡先"
        style={inputStyle}
      />

      <input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="住所"
        style={inputStyle}
      />

      <div style={{ display: "flex", gap: 8 }}>
  <div style={{ flex: 1 }}>
    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
      工期開始
    </div>

    <input
      type="date"
      value={startDate}
      onChange={(e) => setStartDate(e.target.value)}
      style={inputStyle}
    />
  </div>

  <div style={{ flex: 1 }}>
    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
      工期終了
    </div>

    <input
      type="date"
      value={endDate}
      onChange={(e) => setEndDate(e.target.value)}
      style={inputStyle}
    />
  </div>
</div>

<div style={{ display: "flex", gap: 8 }}>
  <button
    type="button"
    onClick={() => {
      setShiftType("day");
      setMeetingTime("08:00");
    }}
    style={{
      flex: 1,
      padding: 10,
      borderRadius: 8,
      border: shiftType === "day" ? "2px solid #111" : "1px solid #ccc",
      backgroundColor: shiftType === "day" ? "#f3f3f3" : "#fff",
      fontWeight: 700,
      cursor: "pointer",
    }}
  >
    昼
  </button>

  <button
    type="button"
    onClick={() => {
      setShiftType("night");
      setMeetingTime("20:00");
    }}
    style={{
      flex: 1,
      padding: 10,
      borderRadius: 8,
      border: shiftType === "night" ? "2px solid #111" : "1px solid #ccc",
      backgroundColor: shiftType === "night" ? "#f3f3f3" : "#fff",
      fontWeight: 700,
      cursor: "pointer",
    }}
  >
    夜
  </button>
</div>

      <input
        type="time"
        value={meetingTime}
        onChange={(e) => setMeetingTime(e.target.value)}
        style={inputStyle}
      />

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() => setShowAddModal(false)}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 8,
            border: "1px solid #ccc",
            backgroundColor: "#fff",
          }}
        >
          キャンセル
        </button>

        <button
  type="button"
  onClick={handleAddSite}
          style={{
            flex: 1,
            padding: 12,
            border: "none",
            borderRadius: 8,
            backgroundColor: "#111",
            color: "#fff",
            fontWeight: 700,
          }}
        >
          追加
        </button>
      </div>
    </div>
  </div>
)}

{editingAssignment && (
  <div
    onClick={() => setEditingAssignment(null)}
    style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.45)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 99999,
      padding: 16,
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: "100%",
        maxWidth: 520,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        display: "grid",
        gap: 10,
      }}
    >
      <h2 style={{ margin: 0 }}>現場編集</h2>

      <input
        value={editingAssignment.contractor_name ?? ""}
        onChange={(e) =>
          setEditingAssignment({
            ...editingAssignment,
            contractor_name: e.target.value,
          })
        }
        placeholder="元請"
        style={inputStyle}
      />

      <input
        value={editingAssignment.site_name ?? ""}
        onChange={(e) =>
          setEditingAssignment({
            ...editingAssignment,
            site_name: e.target.value,
          })
        }
        placeholder="現場名"
        style={inputStyle}
      />

      <select
        value={editingAssignment.construction_type ?? "第一工事"}
        onChange={(e) =>
          setEditingAssignment({
            ...editingAssignment,
            construction_type: e.target.value,
          })
        }
        style={inputStyle}
      >
        <option value="第一工事">第一工事</option>
        <option value="第二工事">第二工事</option>
      </select>

      <input
        value={editingAssignment.manager_name ?? ""}
        onChange={(e) =>
          setEditingAssignment({
            ...editingAssignment,
            manager_name: e.target.value,
          })
        }
        placeholder="担当者"
        style={inputStyle}
      />

      <input
        value={editingAssignment.contact_phone ?? ""}
        onChange={(e) =>
          setEditingAssignment({
            ...editingAssignment,
            contact_phone: e.target.value,
          })
        }
        placeholder="連絡先"
        style={inputStyle}
      />

      <input
        value={editingAssignment.address ?? ""}
        onChange={(e) =>
          setEditingAssignment({
            ...editingAssignment,
            address: e.target.value,
          })
        }
        placeholder="住所"
        style={inputStyle}
      />

      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="date"
          value={editingAssignment.start_date ?? ""}
          onChange={(e) =>
            setEditingAssignment({
              ...editingAssignment,
              start_date: e.target.value,
            })
          }
          style={inputStyle}
        />

        <input
          type="date"
          value={editingAssignment.end_date ?? ""}
          onChange={(e) =>
            setEditingAssignment({
              ...editingAssignment,
              end_date: e.target.value,
            })
          }
          style={inputStyle}
        />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
  <button
    type="button"
    onClick={() =>
      setEditingAssignment({
        ...editingAssignment,
        shift_type: "day",
        meeting_time: "08:00",
      })
    }
    style={{
      flex: 1,
      padding: 10,
      borderRadius: 8,
      border:
        editingAssignment.shift_type === "day"
          ? "2px solid #111"
          : "1px solid #ccc",
      backgroundColor:
        editingAssignment.shift_type === "day" ? "#f3f3f3" : "#fff",
      fontWeight: 700,
    }}
  >
    昼
  </button>

  <button
    type="button"
    onClick={() =>
      setEditingAssignment({
        ...editingAssignment,
        shift_type: "night",
        meeting_time: "20:00",
      })
    }
    style={{
      flex: 1,
      padding: 10,
      borderRadius: 8,
      border:
        editingAssignment.shift_type === "night"
          ? "2px solid #111"
          : "1px solid #ccc",
      backgroundColor:
        editingAssignment.shift_type === "night" ? "#f3f3f3" : "#fff",
      fontWeight: 700,
    }}
  >
    夜
  </button>
</div>

<input
  type="time"
  value={editingAssignment.meeting_time ?? "08:00"}
  onChange={(e) =>
    setEditingAssignment({
      ...editingAssignment,
      meeting_time: e.target.value,
    })
  }
  style={inputStyle}
/>

<div>
  <div style={{ fontWeight: 800, marginBottom: 6 }}>
    添付ファイル
  </div>

  <input
    type="file"
    multiple
    onChange={(e) =>
      uploadFiles(editingAssignment.id, e.target.files)
    }
    style={inputStyle}
  />

  <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
    {assignmentFiles
      .filter((file) => file.assignment_id === editingAssignment.id)
      .map((file) => (
        <div
  key={file.id}
  style={{
    display: "flex",
    gap: 8,
    alignItems: "center",
  }}
>
  <a
    href={file.file_url}
    target="_blank"
    rel="noreferrer"
    style={{
      flex: 1,
      padding: 8,
      border: "1px solid #ddd",
      borderRadius: 8,
      color: "#111",
      textDecoration: "none",
      fontWeight: 700,
    }}
  >
    📎 {file.file_name}
  </a>

  <button
    type="button"
    onClick={() => deleteAssignmentFile(file)}
    style={{
      border: "none",
      backgroundColor: "#dc2626",
      color: "#fff",
      borderRadius: 6,
      padding: "6px 10px",
      cursor: "pointer",
      fontWeight: 700,
    }}
  >
    削除
  </button>
</div>
      ))}
  </div>
</div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() => setEditingAssignment(null)}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 8,
            border: "1px solid #ccc",
            backgroundColor: "#fff",
          }}
        >
          キャンセル
        </button>

        <button
          type="button"
          onClick={updateAssignment}
          style={{
            flex: 1,
            padding: 12,
            border: "none",
            borderRadius: 8,
            backgroundColor: "#111",
            color: "#fff",
            fontWeight: 700,
          }}
        >
          保存
        </button>
      </div>
    </div>
  </div>
)}

<div
  style={{
    overflowX: "auto",
    overflowY: "auto",
    border: "1px solid #ddd",
    borderRadius: 12,
    backgroundColor: "#fff",
    maxHeight: "78vh",
    position: "relative",
  }}
>
<table
  style={{
    borderCollapse: "separate",
    borderSpacing: 0,
    minWidth: viewMode === "week"
  ? (isMobile ? 900 : 1200)
  : (isMobile ? 950 : 1700),
    width: "100%",
    backgroundColor: "#fff",
    fontSize: isMobile ? 10 : 12,
  }}
>
            <thead>
              <tr>
              {!isMobile && (
  <th style={{ ...th, ...stickyTh1 }}>元請</th>
)}

<th
  style={{
    ...th,
    ...stickyTh2,
    left: isMobile ? 0 : 70,
  }}
>
  現場名
</th>

{!isMobile && (
  <th style={{ ...th, ...stickyTh3 }}>担当者</th>
)}

<th style={th}>昼/夜</th>

{days.map((date) => {
  const membersOfDate = siteMembers.filter(
    (member) => member.work_date === date
  );

  const plannedAll = dailyInfos
  .filter((info) => info.work_date === date)
  .reduce(
    (sum, info) => sum + (info.planned_count ?? 0),
    0
  );

const plannedFirst = dailyInfos
  .filter((info) => {
    if (info.work_date !== date) return false;

    const assignment = assignments.find(
      (a) => a.id === info.assignment_id
    );

    return assignment?.construction_type === "第一工事";
  })
  .reduce(
    (sum, info) => sum + (info.planned_count ?? 0),
    0
  );

const plannedSecond = dailyInfos
  .filter((info) => {
    if (info.work_date !== date) return false;

    const assignment = assignments.find(
      (a) => a.id === info.assignment_id
    );

    return assignment?.construction_type === "第二工事";
  })
  .reduce(
    (sum, info) => sum + (info.planned_count ?? 0),
    0
  );

  const totalAll = membersOfDate.length;

  const totalFirst = membersOfDate.filter((member) => {
    const assignment = assignments.find(
      (a) => a.id === member.assignment_id
    );

    return assignment?.construction_type === "第一工事";
  }).length;

  const totalSecond = membersOfDate.filter((member) => {
    const assignment = assignments.find(
      (a) => a.id === member.assignment_id
    );

    return assignment?.construction_type === "第二工事";
  }).length;

  return (
    <th key={date} style={getDateHeaderStyle(date)}>
  <div style={{ fontSize: 14, fontWeight: 800 }}>
    {Number(date.slice(-2))}
  </div>

  <div
    style={{
      fontSize: 11,
      marginTop: 2,
    }}
  >
    {["日", "月", "火", "水", "木", "金", "土"][
      new Date(date).getDay()
    ]}
  </div>

      <div
        style={{
          marginTop: 4,
          fontSize: 10,
          lineHeight: 1.4,
          color: "#333",
          fontWeight: 800,
        }}
      >
        <div>全 {plannedAll}/{totalAll}</div>
<div>一 {plannedFirst}/{totalFirst}</div>
<div>二 {plannedSecond}/{totalSecond}</div>
      </div>
    </th>
  );
})}
              </tr>
            </thead>

            <tbody>
            {groupedAssignments.map((group) => (
  <Fragment key={group.label}>
  <tr>
  <td
  colSpan={days.length + (isMobile ? 2 : 4)}
  style={{
    ...td,
    backgroundColor: group.color,
    color: "#111",
    fontWeight: 900,
    fontSize: 14,
  }}
>
      {group.label}
    </td>
  </tr>

  {group.rows.map((assignment) => (
  <tr
  key={assignment.id}
  style={{
    backgroundColor:
      assignment.shift_type === "night"
        ? "#f3f4f6"
        : "#fff",
  }}
>
{!isMobile && (
<td
  style={{
    ...td,
    ...stickyTd1,
    backgroundColor:
      assignment.shift_type === "night" ? "#e5e7eb" : "#fff",
  }}
>
  {assignment.contractor_name || "-"}
</td>
)}


<td
  draggable={!isMobile && sortMode === "manual"}
  onDragStart={() => setDraggingAssignmentId(assignment.id)}
  onDragEnd={() => setDraggingAssignmentId(null)}
  onDragOver={(e) => e.preventDefault()}
  onDrop={() => {
    if (!draggingAssignmentId) return;

    moveAssignmentRow(
      draggingAssignmentId,
      assignment.id
    );
  }}
  style={{
    ...td,
    ...stickyTd2,
    left: isMobile ? 0 : 70,
    fontWeight: 800,
    cursor: !isMobile && sortMode === "manual" ? "grab" : "pointer",
    backgroundColor:
      draggingAssignmentId === assignment.id
        ? "#dbeafe"
        : assignment.shift_type === "night"
        ? "#e5e7eb"
        : "#fff",
    minWidth: viewMode === "week" ? 260 : 180,
    width: viewMode === "week" ? 260 : 180,
  }}
>
<div
  style={{
    display: "flex",
    flexDirection: "column",
    gap: 6,
  }}
>
      <span
  onClick={() => setEditingAssignment(assignment)}
  style={{
    cursor: "pointer",
    textDecoration: "underline",
  }}
>
  {assignment.site_name || "-"}
</span>

        <button
          type="button"
          onClick={() => deleteAssignment(assignment.id)}
          style={{
            backgroundColor: "#d11a2a",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: isMobile ? "6px 10px" : "4px 8px",
            cursor: "pointer",
            fontSize: isMobile ? 11 : 12,
          }}
        >
          削除
        </button>
      </div>
    </td>

    {!isMobile && (
    <td
  style={{
    ...td,
    ...stickyTd3,
    backgroundColor:
      assignment.shift_type === "night" ? "#e5e7eb" : "#fff",
  }}
>
  {assignment.manager_name || "-"}
</td>
)}

<td
  style={{
    ...td,
    fontWeight: 800,
    color:
      assignment.shift_type === "night"
        ? "#fff"
        : "#111",
    backgroundColor:
      assignment.shift_type === "night"
        ? "#374151"
        : "#f3f4f6",
    textAlign: "center",
  }}
>
  {assignment.shift_type === "night" ? "夜" : "昼"}
</td>

                  {days.map((date) => {
                    const cellMembers = getCellMembers(assignment.id, date);
                    const dailyInfo = getDailyInfo(assignment.id, date);
                    const isOutOfPeriod = isOutOfAssignmentPeriod(
                      date,
                      assignment.start_date,
                      assignment.end_date
                    );
                    const plannedCount = dailyInfo?.planned_count ?? null;
const memberCount = cellMembers.length;
const isShort =
  plannedCount !== null &&
  plannedCount > 0 &&
  memberCount < plannedCount;

  const isPerfect =
  plannedCount !== null &&
  plannedCount > 0 &&
  memberCount === plannedCount;

  const baseCellStyle = getCellStyle(
    date,
    plannedCount,
    memberCount,
    assignment.shift_type
  );

                    return (
                      <td
                        key={date}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (isOutOfPeriod) return;
                          if (draggingSiteMemberId) {
                            moveSiteMember(draggingSiteMemberId, assignment.id, date);
                            return;
                          }
                        
                          if (draggingEmployeeName) {
                            addEmployeeToCell(draggingEmployeeName, assignment.id, date);
                            return;
                          }
                        
                          if (draggingVehicleFrom) {
                            moveVehicleToCell(
                              draggingVehicleFrom.vehicleName,
                              draggingVehicleFrom.assignmentId,
                              draggingVehicleFrom.workDate,
                              assignment.id,
                              date
                            );
                            setDraggingVehicleFrom(null);
                            return;
                          }
                        
                          if (draggingVehicleName) {
                            addVehicleToCell(draggingVehicleName, assignment.id, date);
                            setDraggingVehicleName(null);
                          }
                        }}
                        onClick={(e) => {
                          if (isOutOfPeriod) return;
                          setSelectedDate(date);
                          setSelectedShiftType(assignment.shift_type ?? "day");
                        
                          if (selectedSiteMemberId) {
                            moveSiteMember(selectedSiteMemberId, assignment.id, date);
                            setSelectedSiteMemberId(null);
                            return;
                          }
                        
                          if (selectedEmployeeName) {
                            addEmployeeToCell(selectedEmployeeName, assignment.id, date);
                          
                            setSelectedEmployeeName(null);
                          
                            if (isMobile) {
                              setShowMemberModal(false);
                            }
                          
                            return;
                          }
                        
                          if (copiedEmployeeNames.length > 0) {
                            const isMultiPaste = copiedEmployeeNames.length > 1;
                          
                            copiedEmployeeNames.forEach((name) => {
                              addEmployeeToCell(name, assignment.id, date, !isMultiPaste);
                            });
                          
                            if (!e.shiftKey) {
                              setCopiedEmployeeNames([]);
                            }
                          }

                          if (copiedVehicleNames.length > 0) {
                            copiedVehicleNames.forEach((name) => {
                              addVehicleToCell(name, assignment.id, date);
                            });
                          
                            setCopiedVehicleNames([]);

                            if (isMobile) {
                              setShowMemberModal(false);
                            }
                          }
                        
                          }}
                          style={{
                            ...baseCellStyle,
                            backgroundColor: isOutOfPeriod
                              ? "#e5e7eb"
                              : baseCellStyle.backgroundColor,
                            opacity: isOutOfPeriod ? 0.6 : 1,
                          }}
                      >
                        <div style={{ display: "grid", gap: 4 }}>
                        {isOutOfPeriod && (
  <div
    style={{
      padding: "4px 6px",
      borderRadius: 6,
      backgroundColor: "#d1d5db",
      color: "#374151",
      textAlign: "center",
      fontWeight: 800,
      fontSize: 11,
      marginBottom: 4,
    }}
  >
    工期外
  </div>
)}
                        <div
  style={{
    fontSize: isMobile ? 10 : 11,
    fontWeight: 800,
    color: isShort
      ? "#d11a2a"
      : isPerfect
      ? "#16a34a"
      : "#555",
    display: "grid",
    gap: 2,
    lineHeight: 1.4,
  }}
>
<div>
    予定人数：{plannedCount ?? "-"}
  </div>
  <div>
    人数：{plannedCount ? `${memberCount}/${plannedCount}` : memberCount}
  </div>  
</div>

<input
  type="number"
  value={dailyInfo?.planned_count ?? ""}
  onChange={(e) =>
    updateDailyInfo(
      assignment.id,
      date,
      "planned_count",
      e.target.value
    )
  }
  placeholder="人"
  disabled={isOutOfPeriod}
  style={{
    width: "100%",
    padding: "4px 6px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontSize: isMobile ? 10 : 11,
    fontWeight: 700,
    backgroundColor: "#fff",
    boxSizing: "border-box",
  }}
/>

<textarea
  value={
    editingDetails[`${assignment.id}_${date}`] ??
    dailyInfo?.detail ??
    ""
  }
  onChange={(e) => {
    const key = `${assignment.id}_${date}`;
    const value = e.target.value;

    setEditingDetails((prev) => ({
      ...prev,
      [key]: value,
    }));

    if (saveTimers[key]) {
      clearTimeout(saveTimers[key]);
    }

    const timer = setTimeout(() => {
      updateDailyInfo(
        assignment.id,
        date,
        "detail",
        value
      );
    }, 500);

    setSaveTimers((prev) => ({
      ...prev,
      [key]: timer,
    }));
  }}
  disabled={isOutOfPeriod}
  placeholder="詳細"
  style={{
    width: "100%",
    padding: "4px 6px",
    border: "1px solid #e5e7eb",
    borderRadius: 6,
    fontSize: isMobile ? 10 : 11,
    backgroundColor: "#fff",
    boxSizing: "border-box",
  }}
/>

<div
  style={{
    marginTop: 0,
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#f9fafb",
    fontSize: isMobile ? 10 : 11,
  }}
>
  <div style={{ fontWeight: 800, color: "#555", marginBottom: 4 }}>
    車両
  </div>

  {dailyInfo?.vehicle_names?.length ? (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      {dailyInfo.vehicle_names.map((name) => (
        <div
          key={name}
          draggable={!isMobile}
          onDragStart={() =>
            setDraggingVehicleFrom({
              assignmentId: assignment.id,
              workDate: date,
              vehicleName: name,
            })
          }
          onDragEnd={() => setDraggingVehicleFrom(null)}
          onClick={(e) => {
            e.stopPropagation();
            setCopiedVehicleNames((prev) =>
              prev.includes(name)
                ? prev.filter((v) => v !== name)
                : [...prev, name]
            );
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            removeVehicleFromCell(name, assignment.id, date);
          }}
          style={{
            padding: "3px 7px",
            borderRadius: 999,
            backgroundColor: copiedVehicleNames.includes(name)
              ? "#fef3c7"
              : "#e0f2fe",
            border: copiedVehicleNames.includes(name)
              ? "2px solid #f59e0b"
              : "1px solid #bae6fd",
            color: "#0369a1",
            fontWeight: 800,
            cursor: "grab",
            width: "fit-content",
          }}
        >
          🚚 {name}
        </div>
      ))}
    </div>
  ) : (
    <div style={{ color: "#999" }}>未配置</div>
  )}
</div>

<div
  style={{
    display: "flex",
    flexWrap: "wrap",
    gap: 4,
    alignItems: "center",
    marginTop: 4,
  }}
>
{[...cellMembers]
  .sort((a, b) => Number(b.is_foreman) - Number(a.is_foreman))
  .map((member) => {
    const isCopied = copiedEmployeeNames.includes(member.employee_name);

    return (
    <div
      key={member.id}
      draggable={!isMobile}
      onDragStart={() => setDraggingSiteMemberId(member.id)}
      onDragEnd={() => setDraggingSiteMemberId(null)}
      onClick={(e) => {
        e.stopPropagation();
        setCopiedEmployeeNames((prev) =>
          prev.includes(member.employee_name)
            ? prev.filter((name) => name !== member.employee_name)
            : [...prev, member.employee_name]
        );
        setSelectedSiteMemberId(null);
        setSelectedEmployeeName(null);
      }}
      onDoubleClick={() => deleteSiteMember(member.id)}
      style={{
        padding: "2px 6px",
        borderRadius: 6,
        backgroundColor: isCopied
          ? "#dbeafe"
          : member.is_foreman
          ? "#fef3c7"
          : "#eef2ff",
        border: isCopied
          ? "2px solid #2563eb"
          : member.is_foreman
          ? "2px solid #f59e0b"
          : "1px solid #c7d2fe",
        color: isCopied ? "#1d4ed8" : "#111",
        cursor: "grab",
        fontWeight: 700,
        fontSize: 11,
        width: "fit-content",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
        {member.is_foreman && <span style={tagYellow}>職長</span>}
        {member.is_driver && <span style={tagBlue}>運転</span>}
        {member.is_operator && <span style={tagPurple}>OP</span>}
        {member.heavy_equipment && <span style={tagYellow}>{member.heavy_equipment}</span>}
      </div>

      <span>{member.employee_name}</span>

      {member.is_foreman ? (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      toggleForeman(member);
    }}
    style={{
      marginTop: 3,
      border: "none",
      borderRadius: 6,
      padding: "2px 6px",
      backgroundColor: "#f59e0b",
      color: "#fff",
      fontSize: 10,
      fontWeight: 800,
      cursor: "pointer",
    }}
  >
    職長解除
  </button>
) : !cellMembers.some((m) => m.is_foreman) ? (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      toggleForeman(member);
    }}
    style={{
      marginTop: 3,
      border: "none",
      borderRadius: 6,
      padding: "2px 6px",
      backgroundColor: "#e5e7eb",
      color: "#111",
      fontSize: 10,
      fontWeight: 800,
      cursor: "pointer",
    }}
  >
    職長
  </button>
) : null}
        </div>
    );
  })}
</div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
                    ))}
                    </Fragment>
                  ))}
            </tbody>
          </table>
          {isMobile && (selectedEmployeeName || copiedVehicleNames.length > 0) && (
  <div
    style={{
      position: "fixed",
      left: 16,
      right: 16,
      bottom: 72,
      padding: 10,
      borderRadius: 12,
      backgroundColor: "#fff",
      border: "1px solid #ddd",
      zIndex: 2000,
      fontSize: 13,
      fontWeight: 800,
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    }}
  >
    {selectedEmployeeName && <>選択中：{selectedEmployeeName}</>}

    {copiedVehicleNames.length > 0 && (
      <div>車両選択中：{copiedVehicleNames.join("、")}</div>
    )}
  </div>
)}
          {isMobile && (
  <button
    type="button"
    onClick={() => setShowMemberModal(true)}
    style={{
      position: "fixed",
      left: 16,
      right: 16,
      bottom: 16,
      padding: 14,
      borderRadius: 999,
      border: "none",
      backgroundColor: "#111",
      color: "#fff",
      fontWeight: 800,
      fontSize: 16,
      zIndex: 2000,
    }}
  >
    メンバー・車両を選ぶ
  </button>
)}
{isMobile && showMemberModal && (
  <div
    onClick={() => setShowMemberModal(false)}
    style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.45)",
      zIndex: 3000,
      padding: 12,
      display: "flex",
      alignItems: "flex-end",
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: "100%",
        maxHeight: "80vh",
        overflowY: "auto",
        backgroundColor: "#fff",
        borderRadius: "16px 16px 0 0",
        padding: 14,
      }}
    >
      <div style={{ display: "grid", gap: 12 }}>
      <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }}
>
  <strong>{selectedDate ? "未配置メンバー" : "全メンバー"}</strong>

  <button
    type="button"
    onClick={() => setShowMemberModal(false)}
  >
    閉じる
  </button>
</div>
        <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
  {(selectedDate
    ? getUnassignedEmployeesByDate(
        selectedDate,
        selectedShiftType
      )
    : employees
  ).map((employee) => (
    <button
      key={employee.name}
      type="button"
      onClick={() => {
        setSelectedEmployeeName(employee.name);
        setShowMemberModal(false);
      }}
      style={{
        padding: 12,
        borderRadius: 10,
        border:
          selectedEmployeeName === employee.name
            ? "2px solid #2563eb"
            : "1px solid #ddd",
        backgroundColor:
          selectedEmployeeName === employee.name
            ? "#dbeafe"
            : "#fff",
        textAlign: "left",
        fontWeight: 700,
      }}
    >
      {employee.name}
    </button>
  ))}
</div>
<div style={{ marginTop: 18 }}>
  <div
    style={{
      fontWeight: 800,
      marginBottom: 8,
      paddingTop: 12,
      borderTop: "1px solid #ddd",
    }}
  >
    車両
  </div>

  <div style={{ display: "grid", gap: 8 }}>
    {vehicles.map((vehicle) => (
      <button
        key={vehicle.id}
        type="button"
        onClick={() => {
          setSelectedEmployeeName(null);
          setSelectedSiteMemberId(null);
          setCopiedEmployeeNames([]);

          setCopiedVehicleNames((prev) =>
            prev.includes(vehicle.vehicle_name)
              ? prev.filter((name) => name !== vehicle.vehicle_name)
              : [...prev, vehicle.vehicle_name]
          );

          setShowMemberModal(false);
        }}
        style={{
          padding: 12,
          borderRadius: 10,
          border: copiedVehicleNames.includes(vehicle.vehicle_name)
            ? "2px solid #f59e0b"
            : "1px solid #ddd",
          backgroundColor: copiedVehicleNames.includes(vehicle.vehicle_name)
            ? "#fef3c7"
            : "#fff",
          textAlign: "left",
          fontWeight: 800,
        }}
      >
        🚚 {vehicle.vehicle_name}
      </button>
    ))}
  </div>
</div>
      </div>
    </div>
  </div>
)}
        </div>

        {!isMobile && (
  <div
    style={{
      position: "fixed",
      right: 4,
      top: 90,
      bottom: 10,
      width: 180,

    overflowY: "auto",

    border: "1px solid #ddd",
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: 8,
    zIndex: 1000,
    boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
  }}
>
  <div style={{ fontWeight: 800, marginBottom: 6 }}>
    {selectedDate ? "未配置メンバー" : "全メンバー"}
  </div>

  <div style={{ fontSize: 12, color: "#666", marginBottom: 10 }}>
  {selectedDate
  ? `${selectedDate} / ${selectedShiftType === "night" ? "夜" : "昼"}`
  : "日付未選択"}
  </div>

  {copiedEmployeeNames.length > 0 && (
  <div
    style={{
      marginBottom: 10,
      padding: 8,
      borderRadius: 8,
      backgroundColor: "#dbeafe",
      color: "#1d4ed8",
      fontWeight: 700,
      fontSize: 12,
    }}
  >
    選択中：{copiedEmployeeNames.length}名
    <div style={{ marginTop: 4 }}>
  {copiedEmployeeNames.join("、")}
</div>

    <button
      type="button"
      onClick={() => setCopiedEmployeeNames([])}
      style={{
        marginLeft: 8,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        fontWeight: 800,
      }}
    >
      ×
    </button>
  </div>
)}

{copiedVehicleNames.length > 0 && (
  <div
    style={{
      marginBottom: 10,
      padding: 8,
      borderRadius: 8,
      backgroundColor: "#fef3c7",
      color: "#92400e",
      fontWeight: 700,
      fontSize: 12,
    }}
  >
    車両選択中：{copiedVehicleNames.length}台

    <div style={{ marginTop: 4 }}>
      {copiedVehicleNames.join("、")}
    </div>

    <button
      type="button"
      onClick={() => setCopiedVehicleNames([])}
      style={{
        marginLeft: 8,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        fontWeight: 800,
      }}
    >
      ×
    </button>
  </div>
)}

  {selectedDate && (
  <button
    type="button"
    onClick={() => {
      setSelectedDate(null);
      setSelectedEmployeeName(null);
    }}
    style={{
      marginBottom: 10,
      width: "100%",
      padding: "8px 10px",
      borderRadius: 8,
      border: "1px solid #ccc",
      backgroundColor: "#fff",
      cursor: "pointer",
      fontWeight: 700,
    }}
  >
    全員表示
  </button>
)}

<div style={{ display: "grid", gap: 10 }}>
  {Object.entries(
    (selectedDate
      ? getUnassignedEmployeesByDate(selectedDate, selectedShiftType)
      : employees
    ).reduce((acc, employee) => {
      const company = employee.company_name || "未設定";

      if (!acc[company]) {
        acc[company] = [];
      }

      acc[company].push(employee);

      return acc;
    }, {} as Record<string, Employee[]>)
  ).map(([company, members]) => (
    <div key={company}>
      <div
        style={{
          fontWeight: 800,
          backgroundColor: "#f3f4f6",
          padding: "6px 8px",
          borderRadius: 6,
          marginBottom: 6,
        }}
      >
        {company}
      </div>

      <div style={{ display: "grid", gap: 6 }}>
  {members.map((employee) => {
    const isSameDateOtherShift =
      selectedDate &&
      isAssignedSameDateDifferentShift(
        employee.name,
        selectedDate,
        selectedShiftType
      );

    return (
      <div
        key={employee.name}
        draggable={!isMobile}
        onDragStart={() =>
          setDraggingEmployeeName(employee.name)
        }
        onDragEnd={() =>
          setDraggingEmployeeName(null)
        }
        onClick={() => {
          setSelectedEmployeeName(employee.name);
          setSelectedSiteMemberId(null);
        }}
        style={{
          padding: "8px 10px",
          borderRadius: 999,
          backgroundColor:
            selectedEmployeeName === employee.name
              ? "#dbeafe"
              : isSameDateOtherShift
              ? "#fee2e2"
              : "#fff7ed",
          border: isSameDateOtherShift
            ? "2px solid #ef4444"
            : "1px solid #fed7aa",
          color: isSameDateOtherShift ? "#b91c1c" : "#111",
          cursor: "grab",
          fontWeight: 700,
          fontSize: 13,
        }}
      >
        <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }}
>
  <span>{employee.name}</span>

  <span
    style={{
      fontSize: 11,
      fontWeight: 800,
      color: "#666",
    }}
  >
    {getAssignmentCount(employee.name)}
  </span>
</div>
      </div>
    );
  })}
</div>
    </div>
  ))}

<div style={{ marginTop: 12 }}>
  <div
    style={{
      fontWeight: 800,
      backgroundColor: "#f3f4f6",
      padding: "6px 8px",
      borderRadius: 6,
      marginBottom: 6,
    }}
  >
    車両
  </div>

  <div style={{ display: "grid", gap: 6 }}>
    {vehicles.map((vehicle) => (
      <div
        key={vehicle.id}
        draggable={!isMobile}
        onDragStart={() => setDraggingVehicleName(vehicle.vehicle_name)}
        onDragEnd={() => setDraggingVehicleName(null)}
        onClick={() => {
          setSelectedEmployeeName(null);
          setSelectedSiteMemberId(null);
          setCopiedEmployeeNames([]);
        
          setCopiedVehicleNames((prev) =>
            prev.includes(vehicle.vehicle_name)
              ? prev.filter((name) => name !== vehicle.vehicle_name)
              : [...prev, vehicle.vehicle_name]
          );
        }}
        style={{
          padding: "8px 10px",
          borderRadius: 999,
          backgroundColor: copiedVehicleNames.includes(vehicle.vehicle_name)
            ? "#fef3c7"
            : "#e0f2fe",
          border: copiedVehicleNames.includes(vehicle.vehicle_name)
            ? "2px solid #f59e0b"
            : "1px solid #bae6fd",
          color: "#0369a1",
          cursor: "grab",
          fontWeight: 800,
          fontSize: 13,
        }}
      >
        🚚 {vehicle.vehicle_name}
      </div>
    ))}
  </div>
</div>

</div>
</div>
)}

        <p style={{ color: "#666", fontSize: 13 }}>
          ※ メンバーを外す場合は、配置済みの名前をダブルクリックしてください。
        </p>
      </div>
    </div>
  );
}