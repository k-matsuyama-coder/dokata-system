import type {
    EmployeeRoster,
    EmployeeRosterSnapshot,
  } from "../employee-roster-types";
  
  type Props = {
    roster: EmployeeRoster;
    snapshots: EmployeeRosterSnapshot[];
  };
  
  const MEMBERS_PER_PAGE = 10;
  
  export default function EmployeeRosterPrintSheet({
    roster,
    snapshots,
  }: Props) {
    const sortedSnapshots = [...snapshots].sort(
      (first, second) =>
        first.displayOrder - second.displayOrder
    );
  
    const pages =
      sortedSnapshots.length === 0
        ? [[]]
        : chunk(sortedSnapshots, MEMBERS_PER_PAGE);
  
    return (
      <div className="employee-roster-print-root">
        {pages.map((pageMembers, pageIndex) => (
          <section
            key={pageIndex}
            className="employee-roster-print-page"
          >
            <RosterHeading
              roster={roster}
              pageNumber={pageIndex + 1}
              pageCount={pages.length}
            />
  
            <table className="employee-roster-print-table">
              <thead>
                <tr>
                  <th rowSpan={2} className="roster-col-number">
                    番号
                  </th>
  
                  <th rowSpan={2} className="roster-col-name">
                    ふりがな
                    <br />
                    氏名
                  </th>
  
                  <th rowSpan={2} className="roster-col-job">
                    職種
                  </th>
  
                  <th rowSpan={2} className="roster-col-mark">
                    ＊1
                  </th>
  
                  <th rowSpan={2} className="roster-col-date">
                    雇入年月日
                    <br />
                    経験年数
                  </th>
  
                  <th rowSpan={2} className="roster-col-date">
                    生年月日
                    <br />
                    年齢
                  </th>
  
                  <th rowSpan={2} className="roster-col-address">
                    現住所・電話番号
                    <br />
                    家族連絡先・電話番号
                  </th>
  
                  <th rowSpan={2} className="roster-col-health">
                    最近の健康診断日
                    <br />
                    血圧
                  </th>
  
                  <th rowSpan={2} className="roster-col-blood">
                    血液型
                  </th>
  
                  <th rowSpan={2} className="roster-col-health">
                    特殊健康診断日
                    <br />
                    種類
                  </th>
  
                  <th
                    rowSpan={2}
                    className="roster-col-insurance"
                  >
                    健康保険
                    <br />
                    年金保険
                    <br />
                    雇用保険
                  </th>
  
                  <th colSpan={2}>
                    教育・資格・免許
                  </th>
  
                  <th rowSpan={2} className="roster-col-date">
                    入場年月日
                    <br />
                    受入教育
                    <br />
                    実施年月日
                  </th>
  
                  <th rowSpan={2} className="roster-col-retirement">
                    建退共手帳
                    <br />
                    所有の有無
                  </th>
                </tr>
  
                <tr>
                  <th className="roster-col-qualification">
                    雇入・職長特別教育
                    <br />
                    技能講習
                  </th>
  
                  <th className="roster-col-license">
                    免許
                  </th>
                </tr>
              </thead>
  
              <tbody>
                {pageMembers.map((snapshot) => (
                  <WorkerRows
                    key={snapshot.employeeId}
                    snapshot={snapshot}
                  />
                ))}
  
                {Array.from({
                  length:
                    MEMBERS_PER_PAGE -
                    pageMembers.length,
                }).map((_, index) => (
                  <BlankWorkerRows
                    key={`blank-${index}`}
                  />
                ))}
              </tbody>
            </table>
  
            <RosterNotes />
          </section>
        ))}
      </div>
    );
  }
  
  function RosterHeading({
    roster,
    pageNumber,
    pageCount,
  }: {
    roster: EmployeeRoster;
    pageNumber: number;
    pageCount: number;
  }) {
    return (
      <>
        <div className="employee-roster-form-number">
          全建統一様式第5号
        </div>
  
        <div className="employee-roster-title-row">
          <div className="employee-roster-heading-left">
            <div>
              事業所の名称：
              <strong>
                {roster.business_office_name || ""}
              </strong>
            </div>
  
            <div>
              所長名：
              <strong>
                {roster.site_manager_name || ""}
              </strong>
            </div>
          </div>
  
          <div className="employee-roster-title">
            <h1>作業員名簿</h1>
            <div>（令和　年　月　日現在）</div>
          </div>
  
          <div className="employee-roster-confirmation">
            <div className="employee-roster-confirmation-box">
              <span>元請確認欄</span>
              <strong>
                {roster.prime_contractor_confirmation ||
                  ""}
              </strong>
            </div>
  
            <div>
              {formatDate(roster.confirmation_date)}
            </div>
          </div>
        </div>
  
        <div className="employee-roster-company-row">
          <div>
            <div>
              一次会社名：
              <strong>
                {roster.primary_company_name || ""}
              </strong>
            </div>
  
            <div>
              代表者名：
              <strong>
                {roster.primary_representative_name ||
                  ""}
              </strong>
            </div>
  
            <div>
              建退共加入：
              {formatBoolean(
                roster.primary_is_related_member
              )}
            </div>
          </div>
  
          <div>
            <div>
              二次会社名：
              <strong>
                {roster.secondary_company_name || ""}
              </strong>
            </div>
  
            <div>
              代表者名：
              <strong>
                {roster.secondary_representative_name ||
                  ""}
              </strong>
            </div>
  
            <div>
              建退共加入：
              {formatBoolean(
                roster.secondary_is_related_member
              )}
            </div>
          </div>
  
          <div className="employee-roster-page-number">
            {pageNumber} / {pageCount}
          </div>
        </div>
      </>
    );
  }
  
  function WorkerRows({
    snapshot,
  }: {
    snapshot: EmployeeRosterSnapshot;
  }) {
    const qualifications = snapshot.certifications
      .map(
        (item) =>
          item.qualificationName || item.name || ""
      )
      .filter(Boolean)
      .join("・");
  
    const licenses = snapshot.licenses
      .map(
        (item) => item.licenseName || item.name || ""
      )
      .filter(Boolean)
      .join("・");
  
    return (
      <>
        <tr className="employee-roster-worker-first-row">
          <td rowSpan={3}>
            {snapshot.rosterNumber || ""}
          </td>
  
          <td rowSpan={3}>
            <div className="employee-roster-kana">
              {snapshot.employeeNameKana || ""}
            </div>
  
            <strong>{snapshot.employeeName}</strong>
          </td>
  
          <td rowSpan={3}>{snapshot.jobType || ""}</td>
  
          <td rowSpan={3}>
            {(snapshot.roleMarks ?? []).join("・")}
          </td>
  
          <td rowSpan={3}>
            {formatDate(snapshot.hiredOn)}
            <br />
            {formatNumber(snapshot.experienceYears)}
            {snapshot.experienceYears !== null
              ? "年"
              : ""}
          </td>
  
          <td rowSpan={3}>
            {formatDate(snapshot.birthDate)}
            <br />
            {formatNumber(snapshot.ageAtFinalization)}
            {snapshot.ageAtFinalization !== null
              ? "歳"
              : ""}
          </td>
  
          <td rowSpan={3} className="roster-text-left">
            <div>
              {joinText([
                snapshot.postalCode
                  ? `〒${snapshot.postalCode}`
                  : "",
                snapshot.addressLine1,
                snapshot.addressLine2,
              ])}
            </div>
  
            <div>
              TEL：{snapshot.phoneNumber || ""}
            </div>
  
            <div className="employee-roster-emergency">
              家族連絡先：
              {joinText([
                snapshot.emergencyContactName,
                snapshot.emergencyContactRelationship,
              ])}
            </div>
  
            <div>
              TEL：
              {snapshot.emergencyContactPhone || ""}
            </div>
          </td>
  
          <td rowSpan={3}>
            {formatDate(
              snapshot.recentHealthCheckDate
            )}
            <br />
            {formatBloodPressure(snapshot)}
          </td>
  
          <td rowSpan={3}>
            {snapshot.bloodType || ""}
          </td>
  
          <td rowSpan={3}>
            {formatDate(
              snapshot.specialHealthCheckDate
            )}
            <br />
            {snapshot.specialHealthCheckType || ""}
          </td>
  
          <td className="roster-text-left">
            健：
            {formatInsurance(
              snapshot.healthInsuranceName,
              snapshot.healthInsuranceNumber
            )}
          </td>
  
          <td rowSpan={3} className="roster-text-left">
            {qualifications}
          </td>
  
          <td rowSpan={3} className="roster-text-left">
            {licenses}
          </td>
  
          <td rowSpan={3}>
            {formatDate(snapshot.siteEntryDate)}
            <br />
            {formatDate(
              snapshot.acceptanceTrainingDate
            )}
          </td>
  
          <td rowSpan={3}>
            {formatBoolean(
              snapshot.constructionRetirementBookOwned
            )}
          </td>
        </tr>
  
        <tr>
          <td className="roster-text-left">
            年：
            {formatInsurance(
              snapshot.pensionInsuranceName,
              snapshot.pensionInsuranceNumber
            )}
          </td>
        </tr>
  
        <tr>
          <td className="roster-text-left">
            雇：
            {formatInsurance(
              snapshot.employmentInsuranceName,
              snapshot.employmentInsuranceNumber
            )}
          </td>
        </tr>
      </>
    );
  }
  
  function BlankWorkerRows() {
    return (
      <>
        <tr className="employee-roster-worker-first-row">
          <td rowSpan={3} />
          <td rowSpan={3} />
          <td rowSpan={3} />
          <td rowSpan={3} />
          <td rowSpan={3} />
          <td rowSpan={3} />
          <td rowSpan={3} />
          <td rowSpan={3} />
          <td rowSpan={3} />
          <td rowSpan={3} />
          <td>健：</td>
          <td rowSpan={3} />
          <td rowSpan={3} />
          <td rowSpan={3} />
          <td rowSpan={3} />
        </tr>
  
        <tr>
          <td>年：</td>
        </tr>
  
        <tr>
          <td>雇：</td>
        </tr>
      </>
    );
  }
  
  function RosterNotes() {
    return (
      <div className="employee-roster-notes">
        <div>
          （注）＊1欄には、現場代理人・主任技術者・
          職長・安全衛生責任者等の記号を記入します。
        </div>
  
        <div>
          本名簿は確定時点で保存された情報を使用して
          作成しています。
        </div>
      </div>
    );
  }
  
  function chunk<T>(items: T[], size: number) {
    const result: T[][] = [];
  
    for (let index = 0; index < items.length; index += size) {
      result.push(items.slice(index, index + size));
    }
  
    return result;
  }
  
  function formatDate(value: string | null) {
    if (!value) {
      return "";
    }
  
    const [year, month, day] = value
      .slice(0, 10)
      .split("-");
  
    if (!year || !month || !day) {
      return value;
    }
  
    return `${year}/${month}/${day}`;
  }
  
  function formatBoolean(value: boolean | null) {
    if (value === null) {
      return "";
    }
  
    return value ? "有" : "無";
  }
  
  function formatNumber(value: number | null) {
    return value === null ? "" : String(value);
  }
  
  function formatBloodPressure(
    snapshot: EmployeeRosterSnapshot
  ) {
    const high = snapshot.bloodPressureHigh;
    const low = snapshot.bloodPressureLow;
  
    if (high === null && low === null) {
      return "";
    }
  
    return `${high ?? ""} ～ ${low ?? ""}`;
  }
  
  function formatInsurance(
    name: string | null,
    number: string | null
  ) {
    return joinText([name, number]);
  }
  
  function joinText(
    values: Array<string | null | undefined>
  ) {
    return values
      .map((value) => value?.trim() ?? "")
      .filter(Boolean)
      .join(" ");
  }