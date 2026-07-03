import ExcelJS from "exceljs";

type Assignment = {
  id: string;
  contractor_name: string | null;
  site_name: string | null;
  group_name: string | null;
  manager_name: string | null;
  shift_type: string | null;
};

type DailyInfo = {
  assignment_id: string;
  work_date: string;
  planned_count: number | null;
};

function formatMonthFileName(month: string) {
  return `番割抽出_${month}_${Date.now()}.xlsx`;
}

function formatDateText(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatWeekdayText(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCalendarDaysForMonth(month: string) {
  const [year, monthValue] = month.split("-").map(Number);
  const first = new Date(year, monthValue - 1, 1);
  const last = new Date(year, monthValue, 0);

  const firstDay = first.getDay();
  const diffToMonday = firstDay === 0 ? -6 : 1 - firstDay;
  const start = new Date(first);
  start.setDate(first.getDate() + diffToMonday);

  const lastDay = last.getDay();
  const diffToSunday = lastDay === 0 ? 0 : 7 - lastDay;
  const end = new Date(last);
  end.setDate(last.getDate() + diffToSunday);

  const days: string[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    days.push(formatLocalDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

function buildWeekLabel(index: number) {
  return `${index + 1}w`;
}

function downloadBuffer(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportMonthlyMatrix(params: {
  month: string;
  assignments: Assignment[];
  dailyInfos: DailyInfo[];
}) {
  const { month, assignments, dailyInfos } = params;

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("番割抽出", {
    views: [{ state: "frozen", xSplit: 3, ySplit: 7 }],
  });

  const displayDays = getCalendarDaysForMonth(month);
  const plannedCountMap = new Map<string, number | null>();

  dailyInfos.forEach((info) => {
    plannedCountMap.set(
      `${info.assignment_id}_${info.work_date}`,
      info.planned_count ?? null
    );
  });

  sheet.getColumn(1).width = 8;
  sheet.getColumn(2).width = 12;
  sheet.getColumn(3).width = 8;

  assignments.forEach((_, index) => {
    sheet.getColumn(index + 4).width = 14;
  });

  const headerLabels = [
    "元請会社名",
    "現場名",
    "グループ",
    "担当者",
    "昼/夜",
    "日付",
    "曜日",
  ];

  headerLabels.forEach((label, index) => {
    const rowNumber = index + 1;
    const cell = sheet.getCell(rowNumber, 1);
    cell.value = label;
    cell.font = { bold: true };
    cell.alignment = {
      vertical: "middle",
      horizontal: "left",
    };
  });

  assignments.forEach((assignment, index) => {
    const col = index + 4;

    sheet.getCell(1, col).value = assignment.contractor_name ?? "";
    sheet.getCell(2, col).value = assignment.site_name ?? "";
    sheet.getCell(3, col).value = assignment.group_name ?? "";
    sheet.getCell(4, col).value = assignment.manager_name ?? "";
    sheet.getCell(5, col).value =
      assignment.shift_type === "night" ? "夜" : "昼";

    for (let row = 1; row <= 5; row += 1) {
      const cell = sheet.getCell(row, col);
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };
      if (row === 2) {
        cell.font = { bold: true };
      }
    }
  });

  const dataStartRow = 8;

  displayDays.forEach((workDate, index) => {
    const rowNumber = dataStartRow + index;
    const weekIndex = Math.floor(index / 7);

    sheet.getCell(rowNumber, 1).value = buildWeekLabel(weekIndex);
    sheet.getCell(rowNumber, 2).value = formatDateText(workDate);
    sheet.getCell(rowNumber, 3).value = formatWeekdayText(workDate);

    sheet.getCell(rowNumber, 2).alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    sheet.getCell(rowNumber, 3).alignment = {
      vertical: "middle",
      horizontal: "center",
    };

    assignments.forEach((assignment, assignmentIndex) => {
      const col = assignmentIndex + 4;
      const value = plannedCountMap.get(`${assignment.id}_${workDate}`) ?? "";

      const cell = sheet.getCell(rowNumber, col);
      cell.value = value === "" ? "" : Number(value);
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
      };
    });
  });

  for (let i = 0; i < displayDays.length; i += 7) {
    const startRow = dataStartRow + i;
    const endRow = Math.min(
      startRow + 6,
      dataStartRow + displayDays.length - 1
    );

    sheet.mergeCells(startRow, 1, endRow, 1);
    sheet.getCell(startRow, 1).alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    sheet.getCell(startRow, 1).font = { bold: true };
  }

  const totalRows = dataStartRow + displayDays.length - 1;
  const totalCols = assignments.length + 3;

  for (let row = 1; row <= totalRows; row += 1) {
    for (let col = 1; col <= totalCols; col += 1) {
      const cell = sheet.getCell(row, col);
      cell.border = {
        top: { style: "thin", color: { argb: "FFD1D5DB" } },
        left: { style: "thin", color: { argb: "FFD1D5DB" } },
        bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
        right: { style: "thin", color: { argb: "FFD1D5DB" } },
      };

      if (row <= 7) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF3F4F6" },
        };
      }
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBuffer(buffer as ArrayBuffer, formatMonthFileName(month));
}