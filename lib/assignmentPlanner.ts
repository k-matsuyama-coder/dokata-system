export const EQUIPMENT = [
    "BH",
    "ローラー",
    "グレーダー",
    "ブル",
    "クレーン",
    "解体",
  ] as const;
  
  export type Equipment = (typeof EQUIPMENT)[number];
  
  // 現場に必要な人数
  export type Requirements = {
    total: number;
    drivers: number;
    equipment: Record<Equipment, number>;
  };
  
  // 社員
  export type PlannerEmployee = {
    id: string;
    name: string;
    company_name: string | null;
  };
  
  // 社員ごとの対応重機・運転手可否
  export type Capability = {
    employee_id: string;
    equipment: Equipment[];
    can_drive: boolean;
  };
  
  // 現場と作業時間
  export type PlannerAssignment = {
    id: string;
    site_name: string | null;
    start_date: string | null;
    end_date: string | null;
    shift_type: string | null;
    start_time: string | null;
    end_time: string | null;
  };
  
  // 既存の配置・過去の配置実績
  export type PlannerMember = {
    assignment_id: string;
    employee_name: string;
    work_date: string;
  };
  
  // 配置候補の1人分
  export type ProposedMember = {
    employee_id: string;
    name: string;
    company: string;
    equipment: Equipment | null;
    driver: boolean;
    experience: number;
  };
  
  // 配置案・不足人数・除外理由
  export type Plan = {
    members: ProposedMember[];
    shortages: string[];
    excluded: {
      name: string;
      reason: string;
    }[];
  };

  // 人数の入力チェック
export function parseRequirements(value: unknown): Requirements {
    const input = value as Partial<Requirements> | null;
  
    const checkCount = (value: unknown, minimum = 0): number => {
      if (
        typeof value !== "number" ||
        !Number.isInteger(value) ||
        value < minimum ||
        value > 50
      ) {
        throw new Error(
          "人数は0〜50の整数で入力してください。合計は1人以上です。"
        );
      }
  
      return value;
    };
  
    if (
      !input ||
      typeof input !== "object" ||
      !input.equipment ||
      typeof input.equipment !== "object"
    ) {
      throw new Error("必要人数を入力してください。");
    }
  
    const equipment = Object.fromEntries(
      EQUIPMENT.map((type) => [
        type,
        checkCount(input.equipment?.[type] ?? 0),
      ])
    ) as Record<Equipment, number>;
  
    const total = checkCount(input.total, 1);
    const drivers = checkCount(input.drivers);
  
    const operatorCount = Object.values(equipment).reduce(
      (sum, count) => sum + count,
      0
    );
  
    if (operatorCount + drivers > total) {
      throw new Error(
        "OPと運転手の合計が必要人数を超えています。初版では兼任しません。"
      );
    }
  
    return { total, drivers, equipment };
  }
  
  // 日付の入力チェック
  export function validDate(date: string): boolean {
    return (
      /^\d{4}-\d{2}-\d{2}$/.test(date) &&
      Number.isFinite(Date.parse(date)) &&
      new Date(date).toISOString().slice(0, 10) === date
    );
  }
  
  // 作業時間を比較できる数値に変換
  export function workInterval(
    assignment: PlannerAssignment | undefined,
    date: string
  ): [number, number] {
    const base = Date.parse(`${date}T00:00:00Z`);
  
    const toMinutes = (time: string | null | undefined) => {
      const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(time ?? "");
  
      if (
        !match ||
        Number(match[1]) > 23 ||
        Number(match[2]) > 59
      ) {
        return null;
      }
  
      return Number(match[1]) * 60 + Number(match[2]);
    };
  
    const start = toMinutes(assignment?.start_time);
    const end = toMinutes(assignment?.end_time);
  
    // 時間が不明な場合は、当日と翌日を確保済みとして扱う
    if (start === null || end === null) {
      return [base, base + 2 * 86400000];
    }
  
    // 終了が開始以前なら、翌日にまたがる夜勤として扱う
    const endMinutes = end + (end <= start ? 1440 : 0);
  
    return [
      base + start * 60000,
      base + endMinutes * 60000,
    ];
  }
  
  // 条件から配置案を作成
  export function buildPlan(input: {
    employees: PlannerEmployee[];
    capabilities: Capability[];
    assignments: PlannerAssignment[];
    bookings: PlannerMember[];
    holidays: {
      employee_name: string;
      request_date: string;
    }[];
    history: PlannerMember[];
    assignmentId: string;
    date: string;
    requirements: Requirements;
  }): Plan {
    const {
      employees,
      capabilities,
      assignments,
      bookings,
      holidays,
      history,
      assignmentId,
      date,
    } = input;
  
    const requirements = parseRequirements(input.requirements);
  
    if (!validDate(date)) {
      throw new Error("日付が不正です。");
    }
  
    const target = assignments.find(
      (assignment) => assignment.id === assignmentId
    );
  
    if (!target) {
      throw new Error("現場が見つかりません。");
    }
  
    if (
      (target.start_date && date < target.start_date) ||
      (target.end_date && date > target.end_date)
    ) {
      throw new Error("工期外の日付です。");
    }
  
    const alreadyAssigned = bookings.some(
      (booking) =>
        booking.assignment_id === assignmentId &&
        booking.work_date === date
    );
  
    if (alreadyAssigned) {
      throw new Error(
        "この現場・日付は配置済みです。初版は未配置の現場のみ対象です。"
      );
    }
  
    const [targetStart, targetEnd] = workInterval(target, date);
  
    const assignmentMap = new Map(
      assignments.map((assignment) => [assignment.id, assignment])
    );
  
    const capabilityMap = new Map(
      capabilities.map((capability) => [
        capability.employee_id,
        capability,
      ])
    );
  
    const nameCounts = new Map<string, number>();
  
    employees.forEach((employee) => {
      nameCounts.set(
        employee.name,
        (nameCounts.get(employee.name) ?? 0) + 1
      );
    });
  
    const excluded: Plan["excluded"] = [];
  
    // 休み・重複配置・同姓同名の人を除外
    const eligible = employees.filter((employee) => {
      let reason = "";
  
      const hasHoliday = holidays.some((holiday) => {
        if (holiday.employee_name !== employee.name) {
          return false;
        }
  
        const holidayStart = Date.parse(
          `${holiday.request_date}T00:00:00Z`
        );
  
        return (
          holidayStart < targetEnd &&
          holidayStart + 86400000 > targetStart
        );
      });
  
      const hasOverlap = bookings.some((booking) => {
        if (booking.employee_name !== employee.name) {
          return false;
        }
  
        const [otherStart, otherEnd] = workInterval(
          assignmentMap.get(booking.assignment_id),
          booking.work_date
        );
  
        return targetStart < otherEnd && otherStart < targetEnd;
      });
  
      if (
        !employee.name.trim() ||
        (nameCounts.get(employee.name) ?? 0) > 1
      ) {
        reason = "同姓同名・氏名未設定のため個別確認が必要";
      } else if (hasHoliday) {
        reason = "休み希望あり";
      } else if (hasOverlap) {
        reason = "他の配置と時間が重複";
      }
  
      if (reason) {
        excluded.push({ name: employee.name, reason });
        return false;
      }
  
      return true;
    });
  
    // 同じ現場への過去の配置日数
    const experience = (name: string): number => {
      const dates = history
        .filter(
          (record) =>
            record.employee_name === name &&
            record.assignment_id === assignmentId &&
            record.work_date < date
        )
        .map((record) => record.work_date);
  
      return new Set(dates).size;
    };
  
    eligible.sort(
      (a, b) =>
        experience(b.name) - experience(a.name) ||
        a.name.localeCompare(b.name, "ja") ||
        a.id.localeCompare(b.id)
    );
  
    type Role = Equipment | "driver";
  
    const roles: Role[] = [];
  
    EQUIPMENT.forEach((type) => {
      for (let i = 0; i < requirements.equipment[type]; i++) {
        roles.push(type);
      }
    });
  
    for (let i = 0; i < requirements.drivers; i++) {
      roles.push("driver");
    }
  
    const canFillRole = (
      employee: PlannerEmployee,
      role: Role
    ): boolean => {
      const capability = capabilityMap.get(employee.id);
  
      if (role === "driver") {
        return capability?.can_drive === true;
      }
  
      return capability?.equipment.includes(role) === true;
    };
  
    // 対応できる人が少ない役割から割り当てる
    roles.sort(
      (a, b) =>
        eligible.filter((employee) => canFillRole(employee, a)).length -
        eligible.filter((employee) => canFillRole(employee, b)).length
    );
  
    const employeeRole = new Map<string, number>();
  
    // 多能工を別の役割へ移しながら、必要な役割を埋める
    const assignRole = (
      roleIndex: number,
      visited: Set<string>
    ): boolean => {
      for (const employee of eligible) {
        if (
          visited.has(employee.id) ||
          !canFillRole(employee, roles[roleIndex])
        ) {
          continue;
        }
  
        visited.add(employee.id);
  
        const previousRole = employeeRole.get(employee.id);
  
        if (
          previousRole === undefined ||
          assignRole(previousRole, visited)
        ) {
          employeeRole.set(employee.id, roleIndex);
          return true;
        }
      }
  
      return false;
    };
  
    const shortages: string[] = [];
  
    roles.forEach((role, index) => {
      if (!assignRole(index, new Set())) {
        const label = role === "driver" ? "運転手" : `${role} OP`;
        shortages.push(`${label}が1人不足`);
      }
    });
  
    const selected = eligible.filter((employee) =>
      employeeRole.has(employee.id)
    );
  
    // 残りの人数を一般作業員で埋める
    for (const employee of eligible) {
      if (
        selected.length < requirements.total &&
        !employeeRole.has(employee.id)
      ) {
        selected.push(employee);
      }
    }
  
    if (selected.length < requirements.total) {
      shortages.push(
        `合計人数が${requirements.total - selected.length}人不足`
      );
    }
  
    const members: ProposedMember[] = selected.map((employee) => {
      const roleIndex = employeeRole.get(employee.id);
      const role = roleIndex === undefined ? null : roles[roleIndex];
  
      return {
        employee_id: employee.id,
        name: employee.name,
        company: employee.company_name ?? "所属会社未設定",
        equipment: role && role !== "driver" ? role : null,
        driver: role === "driver",
        experience: experience(employee.name),
      };
    });
  
    return { members, shortages, excluded };
  }