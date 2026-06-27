import { stickyTh, th, totalTh } from "../styles";
import type { Employee } from "../types";

type Props = {
  days: string[];
  employees: Employee[];
  getDailyTotal: (workDate: string) => number;
};

export default function TwoMonthTableHeader({
  days,
  employees,
  getDailyTotal,
}: Props) {
  return (
    <thead>
      <tr style={{ position: "sticky", top: 0, zIndex: 60 }}>
        <th style={{ ...stickyTh, top: 0, zIndex: 61 }}>現場名</th>

        <th style={{ ...totalTh, position: "sticky", top: 0, left: 180, zIndex: 61 }}>
          前月合計
        </th>

        <th style={{ ...totalTh, position: "sticky", top: 0, left: 250, zIndex: 61 }}>
          後月合計
        </th>

        {days.map((date) => {
          const day = new Date(date).getDay();
          const isSunday = day === 0;
          const isSaturday = day === 6;

          return (
            <th
              key={date}
              style={{
                ...th,
                backgroundColor: isSunday
                  ? "#ffe5e5"
                  : isSaturday
                  ? "#e5f0ff"
                  : "#f5f5f5",
                color: isSunday ? "#d11a2a" : isSaturday ? "#2563eb" : "#111",
                position: "sticky",
                top: 0,
                zIndex: 60,
              }}
            >
              {date.slice(5).replace("-", "/")}
            </th>
          );
        })}
      </tr>

      <tr>
        <th
          style={{
            ...stickyTh,
            top: 30,
            zIndex: 59,
            backgroundColor: "#f9fafb",
          }}
        >
          日別合計
        </th>

        <th style={{ ...totalTh, position: "sticky", top: 28, left: 180, zIndex: 59 }} />

        <th style={{ ...totalTh, position: "sticky", top: 28, left: 250, zIndex: 59 }} />

        {days.map((date) => {
          const day = new Date(date).getDay();
          const isSunday = day === 0;
          const isSaturday = day === 6;

          return (
            <th
              key={date}
              style={{
                ...th,
                fontWeight: 800,
                backgroundColor: isSunday
                  ? "#ffe5e5"
                  : isSaturday
                  ? "#e5f0ff"
                  : "#f9fafb",
                color: isSunday ? "#d11a2a" : isSaturday ? "#2563eb" : "#111",
                position: "sticky",
                top: 30,
                zIndex: 59,
              }}
            >
              {getDailyTotal(date)} / {employees.length}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}