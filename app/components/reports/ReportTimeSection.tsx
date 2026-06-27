import React from "react";

type MemberEntry = {
  name: string;
  labor: string;
  overtime: string;
};

type Props = {
  sectionStyle: React.CSSProperties;
  inputStyle: React.CSSProperties;

  work: string;
  setWork: (value: string) => void;

  startTime: string;
  setStartTime: (value: string) => void;

  endTime: string;
  setEndTime: (value: string) => void;

  overtimeMinutes: string;
  setOvertimeMinutes: (value: string) => void;

  selectedMembers: MemberEntry[];
  setSelectedMembers: (value: MemberEntry[]) => void;

  timeOptions: string[];
};

export default function ReportTimeSection({
  sectionStyle,
  inputStyle,
  work,
  setWork,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  overtimeMinutes,
  setOvertimeMinutes,
  selectedMembers,
  setSelectedMembers,
  timeOptions,
}: Props) {
  const overtimeOptions = [
    "0",
    "0.5",
    "1",
    "1.5",
    "2",
    "2.5",
    "3",
    "3.5",
    "4",
    "4.5",
    "5",
    "5.5",
    "6",
    "6.5",
    "7",
    "7.5",
    "8",
    "8.5",
    "9",
    "9.5",
    "10",
  ];

  return (
    <>
      <div style={sectionStyle}>
        <p>作業内容</p>
        <textarea
          value={work}
          onChange={(e) => setWork(e.target.value)}
          style={{ ...inputStyle, minHeight: 100 }}
        />
      </div>

      <div style={sectionStyle}>
        <p>開始時間</p>
        <select
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          style={inputStyle}
        >
          <option value="">選択してください</option>
          {timeOptions.map((time) => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </select>
      </div>

      <div style={sectionStyle}>
        <p>終了時間</p>
        <select
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          style={inputStyle}
        >
          <option value="">選択してください</option>
          {timeOptions.map((time) => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </select>
      </div>

      <div style={sectionStyle}>
        <p>残業（時間）</p>

        <select
          value={overtimeMinutes}
          onChange={(e) => {
            const value = e.target.value;

            setOvertimeMinutes(value);

            setSelectedMembers(
              selectedMembers.map((member) => ({
                ...member,
                overtime: value,
              }))
            );
          }}
          style={inputStyle}
        >
          {overtimeOptions.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}