"use client";

import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams } from "next/navigation";

type PublicAssignmentMember = {
  employee_name: string;
  is_foreman: boolean | null;
};

type PublicAssignmentFile = {
  id: string;
  file_name: string;
  file_url: string;
};

type PublicAssignmentRow = {
  assignment_id: string;
  contractor_name: string | null;
  site_name: string | null;
  shift_type: string | null;
  manager_name: string | null;
  contact_phone: string | null;
  address: string | null;
  meeting_time: string | null;
  detail: string | null;
  vehicle_names?: string[] | null;
  members?: PublicAssignmentMember[] | null;
  files?: PublicAssignmentFile[] | null;
};

type PublicAssignmentsDay = {
  date: string;
  label: string;
  assignments: PublicAssignmentRow[];
};

type PublicAssignmentsResponse = {
  ok: true;
  shareTitle: string | null;
  organizationName: string | null;
  expiresAt: string;
  createdAt: string;
  viewMode: "week" | "next3days";
  baseDate: string;
  days: PublicAssignmentsDay[];
};

type PublicAssignmentsErrorResponse = {
  ok: false;
  error: string;
};

type AggregatedRow = {
  rowKey: string;
  assignment_id: string;
  contractor_name: string | null;
  site_name: string | null;
  shift_type: string | null;
  manager_name: string | null;
  contact_phone: string | null;
  address: string | null;
  meeting_time_by_date: Record<string, string | null | undefined>;
  detail_by_date: Record<string, string | null | undefined>;
  vehicle_names_by_date: Record<string, string[]>;
  members_by_date: Record<string, PublicAssignmentMember[]>;
  files: PublicAssignmentFile[];
};

type SearchMatch = {
  key: string;
  rowKey: string;
  dayDate: string;
  memberIndex: number;
  employeeName: string;
};

function getWeekdayIndex(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getDay();
}

function getJapaneseWeekday(date: string) {
  return ["日", "月", "火", "水", "木", "金", "土"][getWeekdayIndex(date)];
}

function formatDateCompact(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;

  return new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
  }).format(parsed);
}

function formatExpiresAt(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function isUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function toTelHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

function toGoogleMapsSearchUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function getRowKey(row: PublicAssignmentRow) {
  return `${row.assignment_id}_${row.shift_type ?? "day"}`;
}

function getDateHeaderStyle(date: string): React.CSSProperties {
  const day = getWeekdayIndex(date);

  if (day === 0) {
    return {
      ...dateHeaderStyleBase,
      background:
        "linear-gradient(180deg, rgba(254,242,242,1) 0%, rgba(255,255,255,1) 100%)",
      color: "#dc2626",
      borderColor: "#fecaca",
    };
  }

  if (day === 6) {
    return {
      ...dateHeaderStyleBase,
      background:
        "linear-gradient(180deg, rgba(239,246,255,1) 0%, rgba(255,255,255,1) 100%)",
      color: "#2563eb",
      borderColor: "#bfdbfe",
    };
  }

  return {
    ...dateHeaderStyleBase,
    background:
      "linear-gradient(180deg, rgba(248,250,252,1) 0%, rgba(255,255,255,1) 100%)",
    color: "#111827",
    borderColor: "#e5e7eb",
  };
}

function pickDisplayValue(current: string | null, next: string | null) {
  return current?.trim() ? current : next;
}

function highlightText(text: string, query: string) {
  if (!query.trim()) return text;

  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase();
  const index = normalizedText.indexOf(normalizedQuery);

  if (index === -1) return text;

  const before = text.slice(0, index);
  const match = text.slice(index, index + query.length);
  const after = text.slice(index + query.length);

  return (
    <>
      {before}
      <mark style={memberSearchMarkStyle}>{match}</mark>
      {after}
    </>
  );
}

function DetailPreview({
  detail,
  title,
  isMobile,
  onOpen,
}: {
  detail: string;
  title: string;
  isMobile: boolean;
  onOpen: (title: string, text: string) => void;
}) {
  const text = `詳細：${detail}`;
  const textRef = useRef<HTMLDivElement | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useLayoutEffect(() => {
    const element = textRef.current;
    if (!element) return;

    const checkOverflow = () => {
      setIsOverflowing(element.scrollWidth > element.clientWidth);
    };

    checkOverflow();

    const resizeObserver = new ResizeObserver(() => {
      checkOverflow();
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [text, isMobile]);

  return (
    <button
      type="button"
      onClick={() => {
        if (!isOverflowing) return;
        onOpen(title, detail);
      }}
      style={{
        ...detailPreviewButtonStyle,
        cursor: isOverflowing ? "pointer" : "default",
      }}
    >
      <div
        ref={textRef}
        style={{
          ...notesBlockStyle,
          fontSize: isMobile ? 9 : 12,
          padding: isMobile ? "5px 6px" : "8px 9px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
        }}
        title={isOverflowing ? text : undefined}
      >
        {text}
      </div>

      {isOverflowing ? (
        <div
          style={{
            ...detailMoreTextStyle,
            marginTop: 2,
            fontSize: 9,
          }}
        >
          タップで全文
        </div>
      ) : null}
    </button>
  );
}

export default function PublicAssignmentsPage() {
  const params = useParams<{ token: string }>();
  const token = typeof params?.token === "string" ? params.token : "";

  const [data, setData] = useState<PublicAssignmentsResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const boardTableOuterRef = useRef<HTMLDivElement | null>(null);

  const [detailModalRow, setDetailModalRow] = useState<{
    site_name: string | null;
    contractor_name: string | null;
    manager_name: string | null;
    contact_phone: string | null;
    address: string | null;
    shift_type: string | null;
    files: PublicAssignmentFile[];
  } | null>(null);

  const [detailTextModal, setDetailTextModal] = useState<{
    title: string;
    text: string;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);

  const matchElementMapRef = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const updateIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    updateIsMobile();
    window.addEventListener("resize", updateIsMobile);

    return () => {
      window.removeEventListener("resize", updateIsMobile);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!token) {
        setError("公開トークンがありません");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `/api/public/assignments/${encodeURIComponent(token)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const json =
          ((await res.json()) as
            | PublicAssignmentsResponse
            | PublicAssignmentsErrorResponse) ?? null;

        if (cancelled) return;

        if (!res.ok || !json || !("ok" in json) || !json.ok) {
          setData(null);
          setError(
            json && "error" in json && typeof json.error === "string"
              ? json.error
              : "公開ページの取得に失敗しました"
          );
          return;
        }

        setData(json);
      } catch {
        if (cancelled) return;
        setData(null);
        setError("公開ページの取得に失敗しました");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const rows = useMemo(() => {
    if (!data) return [];

    const rowMap = new Map<string, AggregatedRow>();

    for (const day of data.days) {
      for (const assignment of day.assignments) {
        const key = getRowKey(assignment);
        const members = Array.isArray(assignment.members) ? assignment.members : [];

        if (!rowMap.has(key)) {
          rowMap.set(key, {
            rowKey: key,
            assignment_id: assignment.assignment_id,
            contractor_name: assignment.contractor_name,
            site_name: assignment.site_name,
            shift_type: assignment.shift_type,
            manager_name: assignment.manager_name,
            contact_phone: assignment.contact_phone,
            address: assignment.address,
            meeting_time_by_date: {},
            detail_by_date: {},
            vehicle_names_by_date: {},
            members_by_date: {},
            files: Array.isArray(assignment.files) ? assignment.files : [],
          });
        }

        const current = rowMap.get(key)!;

        current.contractor_name = pickDisplayValue(
          current.contractor_name,
          assignment.contractor_name
        );
        current.site_name = pickDisplayValue(current.site_name, assignment.site_name);
        current.manager_name = pickDisplayValue(
          current.manager_name,
          assignment.manager_name
        );
        current.contact_phone = pickDisplayValue(
          current.contact_phone,
          assignment.contact_phone
        );
        current.address = pickDisplayValue(current.address, assignment.address);
current.meeting_time_by_date[day.date] = assignment.meeting_time;
current.detail_by_date[day.date] = assignment.detail;
current.vehicle_names_by_date[day.date] = assignment.vehicle_names ?? [];
current.members_by_date[day.date] = members;
      }
    }

    return Array.from(rowMap.values());
  }, [data]);

  const sortedRows = useMemo(() => {
    const sorter = (a: AggregatedRow, b: AggregatedRow) => {
      const contractorCompare = (a.contractor_name ?? "").localeCompare(
        b.contractor_name ?? "",
        "ja"
      );
      if (contractorCompare !== 0) return contractorCompare;

      const siteCompare = (a.site_name ?? "").localeCompare(
        b.site_name ?? "",
        "ja"
      );
      if (siteCompare !== 0) return siteCompare;

      if (a.shift_type === b.shift_type) return 0;
      return a.shift_type === "night" ? 1 : -1;
    };

    return [...rows].sort(sorter);
  }, [rows]);

  const searchMatches = useMemo<SearchMatch[]>(() => {
    if (!searchQuery.trim() || !data) return [];

    const normalizedQuery = searchQuery.trim().toLowerCase();
    const matches: SearchMatch[] = [];

    for (const row of sortedRows) {
      for (const day of data.days) {
        const members = row.members_by_date[day.date] ?? [];

        members.forEach((member, memberIndex) => {
          if (!member.employee_name.toLowerCase().includes(normalizedQuery)) {
            return;
          }

          matches.push({
            key: `${row.rowKey}__${day.date}__${memberIndex}`,
            rowKey: row.rowKey,
            dayDate: day.date,
            memberIndex,
            employeeName: member.employee_name,
          });
        });
      }
    }

    return matches;
  }, [data, searchQuery, sortedRows]);

  useEffect(() => {
    setActiveMatchIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    if (searchMatches.length === 0) return;
    if (activeMatchIndex >= searchMatches.length) {
      setActiveMatchIndex(0);
    }
  }, [activeMatchIndex, searchMatches]);

  useEffect(() => {
    if (searchMatches.length === 0) return;
  
    const activeMatch = searchMatches[activeMatchIndex];
    if (!activeMatch) return;
  
    const element = matchElementMapRef.current[activeMatch.key];
    const container = boardTableOuterRef.current;
  
    if (!element || !container) return;
  
    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
  
    const currentScrollLeft = container.scrollLeft;
    const elementLeftInContainer =
      elementRect.left - containerRect.left + currentScrollLeft;
  
    const targetScrollLeft =
      elementLeftInContainer - container.clientWidth / 2 + elementRect.width / 2;
  
    container.scrollTo({
      left: Math.max(targetScrollLeft, 0),
      behavior: "smooth",
    });
  
    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
  }, [activeMatchIndex, searchMatches]);

  const goToNextMatch = () => {
    if (searchMatches.length === 0) return;
    setActiveMatchIndex((prev) => (prev + 1) % searchMatches.length);
  };

  const goToPrevMatch = () => {
    if (searchMatches.length === 0) return;
    setActiveMatchIndex((prev) =>
      prev === 0 ? searchMatches.length - 1 : prev - 1
    );
  };

  return (
    <div style={publicPageStyle}>
      <div style={publicContainerStyle}>
        <header style={topHeaderStyle}>
          <div>
            <div style={eyebrowStyle}>公開番割</div>
            <h1 style={pageTitleStyle}>{data?.shareTitle?.trim() || "番割表"}</h1>
            <div style={pageSubTitleStyle}>
              {data?.organizationName?.trim() || "組織名未設定"}
            </div>
          </div>

          {data && (
            <div style={summaryMetaWrapStyle}>
              <div style={summaryMetaCardStyle}>
                <div style={summaryMetaLabelStyle}>表示形式</div>
                <div style={summaryMetaValueStyle}>
                  {data.viewMode === "week" ? "今週1週間" : "翌日から3日間"}
                </div>
              </div>

              <div style={summaryMetaCardStyle}>
                <div style={summaryMetaLabelStyle}>有効期限</div>
                <div style={summaryMetaValueStyle}>
                  {formatExpiresAt(data.expiresAt)}
                </div>
              </div>
            </div>
          )}
        </header>

        {data ? (
  <div style={searchStickyWrapStyle}>
    <div style={searchStickyBarStyle}>
      <input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="名前で検索"
        style={searchInputStyle}
      />

      <button
        type="button"
        onClick={goToPrevMatch}
        disabled={searchMatches.length === 0}
        style={{
          ...searchNavButtonStyle,
          opacity: searchMatches.length === 0 ? 0.45 : 1,
          cursor: searchMatches.length === 0 ? "not-allowed" : "pointer",
        }}
      >
        ↑
      </button>

      <button
        type="button"
        onClick={goToNextMatch}
        disabled={searchMatches.length === 0}
        style={{
          ...searchNavButtonStyle,
          opacity: searchMatches.length === 0 ? 0.45 : 1,
          cursor: searchMatches.length === 0 ? "not-allowed" : "pointer",
        }}
      >
        ↓
      </button>

      <div style={searchCountInlineTextStyle}>
        {searchQuery.trim()
          ? `${searchMatches.length === 0 ? 0 : activeMatchIndex + 1}/${searchMatches.length}`
          : "名前検索"}
      </div>
    </div>
  </div>
) : null}

        {loading && (
          <div style={statusPanelStyle}>
            <div style={statusTextStyle}>読み込み中...</div>
          </div>
        )}

        {!loading && error && (
          <div style={errorPanelStyle}>
            <div style={errorTitleStyle}>表示できません</div>
            <div style={errorTextStyle}>{error}</div>
          </div>
        )}

        {!loading && !error && data && (
          <div style={boardWrapStyle}>
            <BoardTable
  rows={sortedRows}
  days={data.days}
  isMobile={isMobile}
  searchQuery={searchQuery}
  searchMatches={searchMatches}
  activeMatchIndex={activeMatchIndex}
  matchElementMapRef={matchElementMapRef}
  boardTableOuterRef={boardTableOuterRef}
  onOpenDetailModal={(row) =>
    setDetailModalRow({
      site_name: row.site_name,
      contractor_name: row.contractor_name,
      manager_name: row.manager_name,
      contact_phone: row.contact_phone,
      address: row.address,
      shift_type: row.shift_type,
      files: row.files ?? [],
    })
  }
  onOpenDetailTextModal={(title, text) =>
    setDetailTextModal({
      title,
      text,
    })
  }
/>
          </div>
        )}

        {detailModalRow && (
          <div
            onClick={() => setDetailModalRow(null)}
            style={detailModalOverlayStyle}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={detailModalCardStyle}
            >
              <div style={detailModalHeaderStyle}>
                <div>
                  <div style={detailModalTitleStyle}>
                    {detailModalRow.site_name || "現場名未設定"}
                  </div>
                  <div style={detailModalSubTitleStyle}>
                    {detailModalRow.contractor_name || "-"}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDetailModalRow(null)}
                  style={detailModalCloseButtonStyle}
                >
                  ×
                </button>
              </div>

              <div style={detailModalBodyStyle}>
                <div style={detailModalItemStyle}>
                  <div style={detailModalLabelStyle}>区分</div>
                  <div style={detailModalValueStyle}>
                    {detailModalRow.shift_type === "night" ? "夜勤" : "日勤"}
                  </div>
                </div>

                <div style={detailModalItemStyle}>
                  <div style={detailModalLabelStyle}>担当者</div>
                  <div style={detailModalValueStyle}>
                    {detailModalRow.manager_name || "-"}
                  </div>
                </div>

                <div style={detailModalItemStyle}>
                  <div style={detailModalLabelStyle}>連絡先</div>
                  <div style={detailModalValueStyle}>
                    {detailModalRow.contact_phone ? (
                      <a
                        href={toTelHref(detailModalRow.contact_phone)}
                        style={inlineLinkStyle}
                      >
                        {detailModalRow.contact_phone}
                      </a>
                    ) : (
                      "-"
                    )}
                  </div>
                </div>

                <div style={detailModalItemStyle}>
                  <div style={detailModalLabelStyle}>住所</div>
                  <div style={detailModalValueStyle}>
                    {detailModalRow.address ? (
                      <a
                        href={
                          isUrl(detailModalRow.address)
                            ? detailModalRow.address
                            : toGoogleMapsSearchUrl(detailModalRow.address)
                        }
                        target="_blank"
                        rel="noreferrer"
                        style={inlineLinkStyle}
                      >
                        {detailModalRow.address}
                      </a>
                    ) : (
                      "-"
                    )}
                  </div>
                </div>

                <div style={detailModalItemStyle}>
  <div style={detailModalLabelStyle}>添付ファイル</div>

  {detailModalRow.files.length > 0 ? (
    <div style={detailFileListStyle}>
      {detailModalRow.files.map((file) => (
        <a
          key={file.id}
          href={file.file_url}
          target="_blank"
          rel="noreferrer"
          style={detailFileLinkStyle}
        >
          {file.file_name}
        </a>
      ))}
    </div>
  ) : (
    <div style={detailModalValueStyle}>なし</div>
  )}
</div>
              </div>
            </div>
          </div>
        )}

        {detailTextModal && (
          <div
            onClick={() => setDetailTextModal(null)}
            style={detailModalOverlayStyle}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={detailModalCardStyle}
            >
              <div style={detailModalHeaderStyle}>
                <div>
                  <div style={detailModalTitleStyle}>{detailTextModal.title}</div>
                  <div style={detailModalSubTitleStyle}>現場詳細</div>
                </div>

                <button
                  type="button"
                  onClick={() => setDetailTextModal(null)}
                  style={detailModalCloseButtonStyle}
                >
                  ×
                </button>
              </div>

              <div style={detailModalBodyStyle}>
                <div
                  style={{
                    ...detailModalValueStyle,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {detailTextModal.text}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BoardTable({
  rows,
  days,
  isMobile,
  searchQuery,
  searchMatches,
  activeMatchIndex,
  matchElementMapRef,
  boardTableOuterRef,
  onOpenDetailModal,
  onOpenDetailTextModal,
}: {
  rows: AggregatedRow[];
  days: PublicAssignmentsDay[];
  isMobile: boolean;
  searchQuery: string;
  searchMatches: SearchMatch[];
  activeMatchIndex: number;
  matchElementMapRef: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  boardTableOuterRef: React.MutableRefObject<HTMLDivElement | null>;
  onOpenDetailModal: (row: AggregatedRow) => void;
  onOpenDetailTextModal: (title: string, text: string) => void;
}) {
  const siteColumnWidth = isMobile ? 132 : 220;
  const dayColumnWidth = isMobile ? 104 : 150;

  const activeMatchKey = searchMatches[activeMatchIndex]?.key ?? null;
  const matchKeySet = new Set(searchMatches.map((match) => match.key));

  return (
    <div ref={boardTableOuterRef} style={boardTableOuterStyle}>
      <table
        style={{
          ...boardTableStyle,
          minWidth: siteColumnWidth + dayColumnWidth * days.length,
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                ...stickyHeaderCellStyle,
                ...stickySiteHeaderStyle,
                minWidth: siteColumnWidth,
                width: siteColumnWidth,
              }}
            >
              現場
            </th>

            {days.map((day) => (
              <th
                key={day.date}
                style={{
                  ...getDateHeaderStyle(day.date),
                  minWidth: dayColumnWidth,
                  width: dayColumnWidth,
                  padding: isMobile ? "8px 4px" : "10px 6px",
                }}
              >
                <div style={dateHeaderTopTextStyle}>{day.label}</div>
                <div style={dateHeaderWeekTextStyle}>
                  {getJapaneseWeekday(day.date)}
                </div>
                <div style={dateHeaderBottomTextStyle}>
                  {formatDateCompact(day.date)}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={1 + days.length} style={emptyBoardCellStyle}>
                番割はありません
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const isNight = row.shift_type === "night";
              const rowSurfaceStyle = isNight
                ? publicNightRowSurfaceStyleGray
                : publicDayRowSurfaceStyle;

              return (
                <tr key={row.rowKey}>
                  <td
                    style={{
                      ...stickySiteBodyStyle,
                      ...rowSurfaceStyle,
                      minWidth: siteColumnWidth,
                      width: siteColumnWidth,
                      padding: isMobile ? "8px 8px" : "10px 10px",
                    }}
                  >
                    <div
                      style={{
                        ...siteTitleStyleEnhanced,
                        fontSize: isMobile ? 12 : 14,
                        lineHeight: isMobile ? 1.2 : 1.3,
                      }}
                    >
                      {row.site_name || "現場名未設定"}
                    </div>

                    <div style={siteMetaStackStyle}>
                      <div
                        style={{
                          ...contractorBadgeStyle,
                          fontSize: isMobile ? 10 : 11,
                          padding: isMobile ? "3px 6px" : "4px 8px",
                        }}
                      >
                        {row.contractor_name || "-"}
                      </div>

                      <div
                        style={{
                          ...(isNight
                            ? publicShiftBadgeNightStyleGray
                            : publicShiftBadgeDayStyle),
                          width: "fit-content",
                          fontSize: isMobile ? 10 : 11,
                          padding: isMobile ? "4px 7px" : "5px 8px",
                        }}
                      >
                        {isNight ? "夜勤" : "日勤"}
                      </div>

                      {row.manager_name ? (
  <div
    style={{
      ...siteInfoPrimaryTextStyle,
      fontSize: isMobile ? 12 : 14,
      lineHeight: isMobile ? 1.2 : 1.3,
    }}
  >
    担当：{row.manager_name}
  </div>
) : null}

{(() => {
  const firstMeetingTime = days
    .map((day) => row.meeting_time_by_date[day.date])
    .find((value) => Boolean(value?.trim()));

  return firstMeetingTime ? (
    <div
      style={{
        ...siteInfoPrimaryTextStyle,
        fontSize: isMobile ? 12 : 14,
        lineHeight: isMobile ? 1.2 : 1.3,
      }}
    >
      集合：{firstMeetingTime}
    </div>
  ) : null;
})()}

                      {isMobile && (row.contact_phone || row.address) ? (
                        <button
                          type="button"
                          onClick={() => onOpenDetailModal(row)}
                          style={mobileSiteDetailButtonStyle}
                        >
                          詳細を見る
                        </button>
                      ) : null}

                      {!isMobile && row.contact_phone ? (
                        <div
                          style={{
                            ...siteMetaTextStyle,
                            fontSize: 11,
                            lineHeight: 1.35,
                          }}
                        >
                          連絡先：
                          <a href={toTelHref(row.contact_phone)} style={inlineLinkStyle}>
                            {row.contact_phone}
                          </a>
                        </div>
                      ) : null}

                      {!isMobile && row.address ? (
                        <div
                          style={{
                            ...siteMetaTextStyle,
                            fontSize: 11,
                            lineHeight: 1.35,
                          }}
                        >
                          住所：
                          <a
                            href={
                              isUrl(row.address)
                                ? row.address
                                : toGoogleMapsSearchUrl(row.address)
                            }
                            target="_blank"
                            rel="noreferrer"
                            style={inlineLinkStyle}
                          >
                            {row.address}
                          </a>
                        </div>
                      ) : null}
                    </div>
                  </td>

                  {days.map((day) => {
                    const members = row.members_by_date[day.date] ?? [];
                    const detail = row.detail_by_date[day.date];
                    const vehicleNames = row.vehicle_names_by_date[day.date] ?? [];

                    return (
                      <td
                        key={`${row.rowKey}_${day.date}`}
                        style={{
                          ...boardBodyCellStyle,
                          ...rowSurfaceStyle,
                          minWidth: dayColumnWidth,
                          maxWidth: dayColumnWidth,
                          width: dayColumnWidth,
                          padding: isMobile ? "8px 4px" : "10px 6px",
                          overflow: "hidden",
                        }}
                      >
                        <div style={cellCardStyle}>
                          {detail ? (
                            <DetailPreview
                              detail={detail}
                              title={row.site_name || "現場詳細"}
                              isMobile={isMobile}
                              onOpen={onOpenDetailTextModal}
                            />
                          ) : null}

{vehicleNames.length > 0 ? (
  <div
    style={{
      ...vehicleBlockStyle,
      fontSize: isMobile ? 9 : 11,
    }}
  >
    🚚 {vehicleNames.join(" / ")}
  </div>
) : null}

                          {members.length > 0 ? (
                            <div style={membersBlockWrapStyle}>
                              <div
                                style={{
                                  ...memberCountLabelStyle,
                                  fontSize: isMobile ? 9 : 12,
                                }}
                              >
                                {members.length}人
                              </div>

                              <div style={membersChipWrapStyle}>
                                {[...members]
                                  .sort((a, b) => {
                                    if (a.is_foreman === b.is_foreman) return 0;
                                    return a.is_foreman ? -1 : 1;
                                  })
                                  .map((member, index) => {
                                    const memberMatchKey = `${row.rowKey}__${day.date}__${index}`;
                                    const isMatched = matchKeySet.has(memberMatchKey);
                                    const isActive = activeMatchKey === memberMatchKey;

                                    return (
                                      <div
                                        key={`${day.date}-${row.assignment_id}-${member.employee_name}-${index}`}
                                        ref={(element) => {
                                          matchElementMapRef.current[memberMatchKey] = element;
                                        }}
                                        style={{
                                          ...memberChipElevatedStyle,
                                          ...(isMatched ? memberChipMatchedStyle : {}),
                                          ...(isActive ? memberChipActiveStyle : {}),
                                        }}
                                      >
                                        <span
                                          style={{
                                            display: "inline-block",
                                            maxWidth: isMobile ? 52 : 90,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                            verticalAlign: "bottom",
                                          }}
                                        >
                                          {highlightText(member.employee_name, searchQuery)}
                                        </span>

                                        {member.is_foreman ? (
                                          <span style={foremanBadgeStyle}>職長</span>
                                        ) : null}
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

const publicPageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #f3f4f6 0%, #eef2f7 100%)",
  padding: "24px 16px 40px",
  boxSizing: "border-box",
};

const publicContainerStyle: React.CSSProperties = {
  maxWidth: "100%",
  margin: "0 auto",
};

const topHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  marginBottom: 18,
  flexWrap: "wrap",
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: "#2563eb",
  marginBottom: 6,
  letterSpacing: 0.4,
};

const pageTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 30,
  lineHeight: 1.15,
  fontWeight: 900,
  color: "#111827",
};

const pageSubTitleStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 15,
  color: "#4b5563",
  fontWeight: 600,
};

const summaryMetaWrapStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
};

const summaryMetaCardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.85)",
  backdropFilter: "blur(8px)",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: "12px 14px",
  minWidth: 180,
  boxSizing: "border-box",
  boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
};

const summaryMetaLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#6b7280",
  fontWeight: 700,
  marginBottom: 6,
};

const summaryMetaValueStyle: React.CSSProperties = {
  fontSize: 15,
  color: "#111827",
  fontWeight: 900,
};

const searchInputStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  padding: "8px 10px",
  fontSize: 14,
  fontWeight: 700,
  color: "#111827",
  backgroundColor: "#ffffff",
};

const searchNavButtonStyle: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  backgroundColor: "#ffffff",
  color: "#111827",
  borderRadius: 10,
  width: 34,
  height: 34,
  fontSize: 15,
  fontWeight: 900,
  cursor: "pointer",
};

const statusPanelStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  padding: 24,
  boxShadow: "0 10px 28px rgba(15,23,42,0.06)",
};

const statusTextStyle: React.CSSProperties = {
  fontSize: 15,
  color: "#374151",
};

const errorPanelStyle: React.CSSProperties = {
  backgroundColor: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: 18,
  padding: 24,
  boxShadow: "0 10px 28px rgba(127,29,29,0.08)",
};

const errorTitleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  color: "#991b1b",
  marginBottom: 10,
};

const errorTextStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#7f1d1d",
  whiteSpace: "pre-wrap",
};

const boardWrapStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
};

const boardTableOuterStyle: React.CSSProperties = {
  overflowX: "auto",
  WebkitOverflowScrolling: "touch",
  border: "1px solid #dbe2ea",
  borderRadius: 20,
  background: "rgba(255,255,255,0.88)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
};

const boardTableStyle: React.CSSProperties = {
  borderCollapse: "separate",
  borderSpacing: 0,
  width: "100%",
};

const stickyHeaderCellStyle: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 50,
  padding: "10px 6px",
  textAlign: "center",
  fontSize: 12,
  fontWeight: 900,
  whiteSpace: "nowrap",
  background:
    "linear-gradient(180deg, rgba(248,250,252,0.98) 0%, rgba(255,255,255,0.98) 100%)",
  borderBottom: "1px solid #dbe2ea",
};

const stickySiteHeaderStyle: React.CSSProperties = {
  left: 0,
  zIndex: 70,
  minWidth: 116,
  width: 116,
  boxShadow: "2px 0 0 #dbe2ea, 10px 0 24px rgba(15,23,42,0.06)",
};

const dateHeaderStyleBase: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 40,
  minWidth: 118,
  width: 118,
  padding: "8px 4px",
  textAlign: "center",
  borderBottom: "1px solid #dbe2ea",
  borderLeft: "1px solid #eef2f7",
};

const dateHeaderTopTextStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 900,
  lineHeight: 1.15,
};

const dateHeaderWeekTextStyle: React.CSSProperties = {
  marginTop: 4,
  fontSize: 20,
  fontWeight: 900,
  lineHeight: 1,
};

const dateHeaderBottomTextStyle: React.CSSProperties = {
  marginTop: 4,
  fontSize: 11,
  fontWeight: 700,
  opacity: 0.92,
};

const stickySiteBodyStyle: React.CSSProperties = {
  position: "sticky",
  left: 0,
  zIndex: 20,
  minWidth: 116,
  width: 116,
  padding: "8px 8px",
  borderBottom: "1px solid #edf2f7",
  boxShadow: "2px 0 0 #dbe2ea, 10px 0 24px rgba(15,23,42,0.06)",
  verticalAlign: "top",
};

const publicDayRowSurfaceStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
};

const publicNightRowSurfaceStyleGray: React.CSSProperties = {
  background: "linear-gradient(180deg, #bcc3cc 0%, #d1d5db 42%, #e5e7eb 100%)",
};

const publicShiftBadgeDayStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "5px 8px",
  borderRadius: 999,
  backgroundColor: "#ecfdf5",
  color: "#166534",
  border: "1px solid #86efac",
  fontSize: 11,
  fontWeight: 900,
  whiteSpace: "nowrap",
};

const publicShiftBadgeNightStyleGray: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "5px 8px",
  borderRadius: 999,
  background: "linear-gradient(180deg, #374151 0%, #111827 100%)",
  color: "#ffffff",
  border: "1px solid #1f2937",
  boxShadow: "0 6px 14px rgba(17,24,39,0.22)",
  fontSize: 11,
  fontWeight: 900,
  whiteSpace: "nowrap",
};

const boardBodyCellStyle: React.CSSProperties = {
  minWidth: 118,
  width: 118,
  padding: "8px 4px",
  borderBottom: "1px solid #edf2f7",
  borderLeft: "1px solid #f1f5f9",
  verticalAlign: "top",
  boxSizing: "border-box",
};

const siteTitleStyleEnhanced: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  lineHeight: 1.2,
  color: "#0f172a",
  letterSpacing: 0,
  wordBreak: "break-word",
};

const siteMetaStackStyle: React.CSSProperties = {
  marginTop: 8,
  display: "grid",
  gap: 4,
};

const contractorBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  width: "fit-content",
  maxWidth: "100%",
  padding: "3px 6px",
  borderRadius: 999,
  backgroundColor: "#eef2ff",
  color: "#4338ca",
  fontSize: 10,
  fontWeight: 800,
  wordBreak: "break-word",
};

const siteMetaTextStyle: React.CSSProperties = {
  fontSize: 10,
  color: "#475569",
  lineHeight: 1.25,
  wordBreak: "break-word",
};

const siteInfoPrimaryTextStyle: React.CSSProperties = {
  color: "#0f172a",
  wordBreak: "break-word",
};

const inlineLinkStyle: React.CSSProperties = {
  color: "#2563eb",
  textDecoration: "underline",
  marginLeft: 2,
  fontWeight: 700,
};

const cellCardStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
};

const notesBlockStyle: React.CSSProperties = {
  padding: "6px 7px",
  borderRadius: 10,
  background: "linear-gradient(180deg, #f3f4f6 0%, #ffffff 100%)",
  border: "1px solid #d1d5db",
  color: "#374151",
  fontSize: 9,
  fontWeight: 800,
  lineHeight: 1.25,
  wordBreak: "break-word",
};

const vehicleBlockStyle: React.CSSProperties = {
  padding: "6px 7px",
  borderRadius: 10,
  background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
  border: "1px solid #e5e7eb",
  color: "#334155",
  fontSize: 9,
  fontWeight: 700,
  lineHeight: 1.35,
  wordBreak: "break-word",
};

const membersBlockWrapStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
};

const memberCountLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 900,
  color: "#0f172a",
};

const membersChipWrapStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 4,
};

const memberChipElevatedStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 3,
  padding: "3px 6px",
  borderRadius: 999,
  background: "linear-gradient(180deg, #fff7ed 0%, #fffbeb 100%)",
  border: "1px solid #fed7aa",
  color: "#111827",
  fontSize: 9,
  fontWeight: 800,
  lineHeight: 1.1,
  boxShadow: "0 2px 6px rgba(251,146,60,0.08)",
  maxWidth: "100%",
  overflow: "hidden",
};

const memberChipMatchedStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, #fef3c7 0%, #fffbeb 100%)",
  border: "1px solid #f59e0b",
};

const memberChipActiveStyle: React.CSSProperties = {
  outline: "3px solid #2563eb",
  outlineOffset: 2,
  boxShadow: "0 0 0 4px rgba(37,99,235,0.18)",
};

const memberSearchMarkStyle: React.CSSProperties = {
  backgroundColor: "#fde68a",
  color: "#111827",
  padding: 0,
};

const foremanBadgeStyle: React.CSSProperties = {
  backgroundColor: "#111827",
  color: "#ffffff",
  borderRadius: 999,
  padding: "1px 4px",
  fontSize: 8,
  fontWeight: 800,
  lineHeight: 1,
  flexShrink: 0,
};

const emptyBoardCellStyle: React.CSSProperties = {
  padding: 24,
  textAlign: "center",
  color: "#6b7280",
  fontSize: 14,
};

const mobileSiteDetailButtonStyle: React.CSSProperties = {
  marginTop: 4,
  width: "fit-content",
  border: "none",
  borderRadius: 999,
  padding: "5px 9px",
  backgroundColor: "#e2e8f0",
  color: "#0f172a",
  fontSize: 10,
  fontWeight: 800,
  cursor: "pointer",
};

const detailModalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(15,23,42,0.48)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  zIndex: 9999,
};

const detailModalCardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 420,
  backgroundColor: "#ffffff",
  borderRadius: 18,
  boxShadow: "0 16px 40px rgba(15,23,42,0.18)",
  border: "1px solid #e5e7eb",
  overflow: "hidden",
};

const detailModalHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  padding: "16px 16px 12px",
  borderBottom: "1px solid #e5e7eb",
};

const detailModalTitleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 900,
  color: "#111827",
  lineHeight: 1.3,
};

const detailModalSubTitleStyle: React.CSSProperties = {
  marginTop: 4,
  fontSize: 13,
  fontWeight: 700,
  color: "#64748b",
};

const detailModalCloseButtonStyle: React.CSSProperties = {
  border: "none",
  backgroundColor: "#f3f4f6",
  color: "#111827",
  borderRadius: 999,
  width: 36,
  height: 36,
  fontSize: 22,
  fontWeight: 900,
  cursor: "pointer",
  flexShrink: 0,
};

const detailModalBodyStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
  padding: 16,
};

const detailModalItemStyle: React.CSSProperties = {
  display: "grid",
  gap: 4,
};

const detailModalLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: "#64748b",
};

const detailModalValueStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "#111827",
  lineHeight: 1.5,
  wordBreak: "break-word",
};

const detailPreviewButtonStyle: React.CSSProperties = {
  display: "block",
  border: "none",
  background: "transparent",
  padding: 0,
  margin: 0,
  textAlign: "left",
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  overflow: "hidden",
  boxSizing: "border-box",
};

const detailMoreTextStyle: React.CSSProperties = {
  marginTop: 4,
  fontSize: 10,
  fontWeight: 800,
  color: "#2563eb",
};

const detailFileListStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
};

const detailFileLinkStyle: React.CSSProperties = {
  display: "block",
  padding: "10px 12px",
  borderRadius: 12,
  backgroundColor: "#f8fafc",
  border: "1px solid #dbe2ea",
  color: "#2563eb",
  textDecoration: "underline",
  fontSize: 14,
  fontWeight: 700,
  wordBreak: "break-word",
};

const searchStickyWrapStyle: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 300,
  background: "linear-gradient(180deg, #f3f4f6 0%, #eef2f7 100%)",
  padding: "0 0 10px",
  marginBottom: 10,
};

const searchStickyBarStyle: React.CSSProperties = {
  display: "flex",
  gap: 6,
  alignItems: "center",
  flexWrap: "wrap",
  background: "rgba(255,255,255,0.94)",
  backdropFilter: "blur(8px)",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: "12px 14px",
  boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
};

const searchCountInlineTextStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#64748b",
  fontWeight: 700,
  paddingLeft: 4,
};