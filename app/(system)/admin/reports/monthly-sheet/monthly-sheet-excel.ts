import ExcelJS from "exceljs";
import type { Sheet } from "./page";

const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

function downloadExcel(buffer: ArrayBuffer, fileName: string) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
}

function safeSheetName(name: string) {
  return name.replace(/[\\/*?:[\]]/g, "_").slice(0, 31) || "営業所未設定";
}

function setBorder(cell: ExcelJS.Cell) {
  cell.border = {
    top: { style: "thin", color: { argb: "FF111111" } },
    left: { style: "thin", color: { argb: "FF111111" } },
    bottom: { style: "thin", color: { argb: "FF111111" } },
    right: { style: "thin", color: { argb: "FF111111" } },
  };

  cell.alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };
}

function writeSheetBlock(params: {
  worksheet: ExcelJS.Worksheet;
  sheet: Sheet;
  month: string;
  number: number;
  startRow: number;
  startColumn: number;
}) {
  const {
    worksheet,
    sheet,
    month,
    number,
    startRow,
    startColumn,
  } = params;

  const [year, monthNumber] = month.split("-").map(Number);
  const lastColumn = startColumn + 8;

  worksheet.mergeCells(
    startRow,
    startColumn,
    startRow,
    startColumn + 2
  );
  worksheet.mergeCells(
    startRow,
    startColumn + 3,
    startRow,
    startColumn + 7
  );

  worksheet.getCell(startRow, startColumn).value =
    `${year}年${monthNumber}月`;
  worksheet.getCell(startRow, startColumn + 3).value = "作業員日報";
  worksheet.getCell(startRow, lastColumn).value = number;

  worksheet.getCell(startRow + 1, startColumn).value = "現場名";
  worksheet.mergeCells(
    startRow + 1,
    startColumn + 1,
    startRow + 1,
    lastColumn
  );
  worksheet.getCell(startRow + 1, startColumn + 1).value =
    sheet.siteName;

  worksheet.getCell(startRow + 2, startColumn).value = "昼/夜";
  worksheet.mergeCells(
    startRow + 2,
    startColumn + 1,
    startRow + 2,
    lastColumn
  );
  worksheet.getCell(startRow + 2, startColumn + 1).value =
    sheet.shiftType === "night" ? "夜" : "昼";

  worksheet.getCell(startRow + 3, startColumn).value =
    "出張所、担当";

  worksheet.mergeCells(
    startRow + 3,
    startColumn + 1,
    startRow + 3,
    startColumn + 4
  );
  worksheet.getCell(startRow + 3, startColumn + 1).value =
    sheet.contractorName;

  worksheet.mergeCells(
    startRow + 3,
    startColumn + 5,
    startRow + 3,
    lastColumn
  );
  worksheet.getCell(startRow + 3, startColumn + 5).value =
    sheet.managerName;

  const headers = [
    "日付",
    "曜日",
    "人工",
    "残業",
    "車両",
    "駐車場",
    "ガソリン\n（リットル）",
    "軽油\n（リットル）",
    "備考",
  ];

  headers.forEach((header, index) => {
    const cell = worksheet.getCell(
      startRow + 4,
      startColumn + index
    );

    cell.value = header;
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF3F4F6" },
    };
  });

  sheet.rows.forEach((row, index) => {
    const rowNumber = startRow + 5 + index;
    const date = new Date(`${row.date}T00:00:00`);

    const values = [
      `${monthNumber}/${Number(row.date.slice(-2))}`,
      weekdays[date.getDay()],
      row.workerCount || "",
      row.overtimeHours
        ? Number(row.overtimeHours.toFixed(2))
        : "",
      row.vehicleCount || "",
      row.parking || "",
      row.gasoline
        ? Number(row.gasoline.toFixed(2))
        : "",
      row.diesel
        ? Number(row.diesel.toFixed(2))
        : "",
      row.notes.join(" / "),
    ];

    values.forEach((value, valueIndex) => {
      worksheet.getCell(
        rowNumber,
        startColumn + valueIndex
      ).value = value;
    });

    if (row.parking) {
      worksheet.getCell(rowNumber, startColumn + 5).numFmt =
        '"¥"#,##0';
    }
  });

  const totals = sheet.rows.reduce(
    (result, row) => ({
      workerCount: result.workerCount + row.workerCount,
      overtimeHours: result.overtimeHours + row.overtimeHours,
      vehicleCount: result.vehicleCount + row.vehicleCount,
      parking: result.parking + row.parking,
      gasoline: result.gasoline + row.gasoline,
      diesel: result.diesel + row.diesel,
    }),
    {
      workerCount: 0,
      overtimeHours: 0,
      vehicleCount: 0,
      parking: 0,
      gasoline: 0,
      diesel: 0,
    }
  );

  const totalRow = startRow + 5 + sheet.rows.length;

  worksheet.mergeCells(
    totalRow,
    startColumn,
    totalRow,
    startColumn + 1
  );

  worksheet.getCell(totalRow, startColumn).value = "合計";
  worksheet.getCell(totalRow, startColumn + 2).value =
    totals.workerCount;
  worksheet.getCell(totalRow, startColumn + 3).value =
    Number(totals.overtimeHours.toFixed(2));
  worksheet.getCell(totalRow, startColumn + 4).value =
    totals.vehicleCount;
  worksheet.getCell(totalRow, startColumn + 5).value =
    totals.parking;
  worksheet.getCell(totalRow, startColumn + 5).numFmt =
    '"¥"#,##0';
  worksheet.getCell(totalRow, startColumn + 6).value =
    Number(totals.gasoline.toFixed(2));
  worksheet.getCell(totalRow, startColumn + 7).value =
    Number(totals.diesel.toFixed(2));

  for (let row = startRow; row <= totalRow; row += 1) {
    for (
      let column = startColumn;
      column <= lastColumn;
      column += 1
    ) {
      setBorder(worksheet.getCell(row, column));
    }
  }

  for (
    let column = startColumn;
    column <= lastColumn;
    column += 1
  ) {
    worksheet.getCell(startRow, column).font = {
      bold: true,
      size: 14,
    };

    worksheet.getCell(startRow + 1, column).font = {
      bold: column !== startColumn,
    };

    worksheet.getCell(totalRow, column).font = {
      bold: true,
    };
  }

  worksheet.getColumn(startColumn).width = 8;
  worksheet.getColumn(startColumn + 1).width = 6;
  worksheet.getColumn(startColumn + 2).width = 8;
  worksheet.getColumn(startColumn + 3).width = 8;
  worksheet.getColumn(startColumn + 4).width = 8;
  worksheet.getColumn(startColumn + 5).width = 11;
  worksheet.getColumn(startColumn + 6).width = 11;
  worksheet.getColumn(startColumn + 7).width = 11;
  worksheet.getColumn(startColumn + 8).width = 24;
}

export async function exportMonthlySheetsToExcel(params: {
  month: string;
  sheets: Sheet[];
}) {
  const { month, sheets } = params;

  if (sheets.length === 0) {
    throw new Error("出力対象の現場がありません");
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "DOKATA-System";
  workbook.created = new Date();

  const officeMap = new Map<string, Sheet[]>();

  sheets.forEach((sheet) => {
    const officeSheets = officeMap.get(sheet.contractorName) ?? [];
    officeSheets.push(sheet);
    officeMap.set(sheet.contractorName, officeSheets);
  });

  Array.from(officeMap.entries()).forEach(
    ([officeName, officeSheets]) => {
      const worksheet = workbook.addWorksheet(
        safeSheetName(officeName),
        {
          pageSetup: {
            paperSize: 9,
            orientation: "landscape",
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0,
            margins: {
              left: 0.2,
              right: 0.2,
              top: 0.3,
              bottom: 0.3,
              header: 0,
              footer: 0,
            },
          },
        }
      );

      worksheet.pageSetup.horizontalCentered = true;

      officeSheets.forEach((sheet, index) => {
        const position = index % 3;
        const group = Math.floor(index / 3);

        const startColumn = 1 + position * 10;
        const startRow = 1 + group * (sheet.rows.length + 8);

        writeSheetBlock({
          worksheet,
          sheet,
          month,
          number: index + 1,
          startRow,
          startColumn,
        });
      });
    }
  );

  const buffer = await workbook.xlsx.writeBuffer();

  downloadExcel(
    buffer as ArrayBuffer,
    `請求用月次日報_${month}.xlsx`
  );
}