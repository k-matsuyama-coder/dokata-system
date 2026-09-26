import {
    ExpenseError,
    expenseJson,
    expenseError,
    getExpenseContext,
  } from "@/lib/expenseServer";
  
  export const runtime = "nodejs";
  export const dynamic = "force-dynamic";
  
  const fields = `
    id,
    employee_id,
    expense_date,
    amount,
    category,
    purpose,
    site_name,
    status,
    return_reason,
    payment_date,
    payment_method,
    created_at,
    updated_at
  `;
  
  function readText(
    value: unknown,
    label: string,
    maxLength: number,
    required = true
  ) {
    if (value == null && !required) return "";
  
    if (typeof value !== "string") {
      throw new ExpenseError(`${label}を入力してください。`);
    }
  
    const text = value.trim();
  
    if ((required && !text) || text.length > maxLength) {
      throw new ExpenseError(
        `${label}は${maxLength}文字以内で入力してください。`
      );
    }
  
    return text;
  }
  
  // 月別の一覧。50件ずつ取得する
  export async function GET(request: Request) {
    try {
      const context = await getExpenseContext(request);
      const {
        client,
        employee,
        organizationId,
        companyName,
        isAdmin,
      } = context;
  
      const params = new URL(request.url).searchParams;
      const month = params.get("month") ?? "";
      const pageText = params.get("page") ?? "0";
      const scope = params.get("scope") ?? "mine";
  
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
        throw new ExpenseError("対象月を指定してください。");
      }
  
      if (!/^\d{1,5}$/.test(pageText)) {
        throw new ExpenseError("ページ番号が不正です。");
      }
  
      if (!["mine", "company"].includes(scope)) {
        throw new ExpenseError("一覧の指定が不正です。");
      }
  
      if (scope === "company" && !isAdmin) {
        throw new ExpenseError("管理者のみ利用できます。", 403);
      }
  
      const [year, monthNumber] = month.split("-").map(Number);
  
      if (year < 2000 || year > 9998) {
        throw new ExpenseError("対象年が不正です。");
      }
  
      const nextMonth =
        monthNumber === 12
          ? `${year + 1}-01-01`
          : `${year}-${String(monthNumber + 1).padStart(2, "0")}-01`;
  
      let query = client
        .from("expense_claims")
        .select(`
          ${fields},
          applicant:employees!expense_claims_employee_id_fkey!inner(
            name,
            company_name,
            organization_id
          )
        `)
        .eq("organization_id", organizationId)
        .eq("applicant.organization_id", organizationId)
        .eq("applicant.company_name", companyName)
        .gte("expense_date", `${month}-01`)
        .lt("expense_date", nextMonth);
  
      if (scope === "mine") {
        query = query.eq("employee_id", employee.id);
      }
  
      const offset = Number(pageText) * 50;
  
      const { data, error } = await query
        .order("expense_date", { ascending: false })
        .order("id", { ascending: false })
        .range(offset, offset + 50);
  
      if (error) {
        throw new ExpenseError("経費一覧を取得できませんでした。", 500);
      }
  
      const rows = data ?? [];
  
      return expenseJson({
        claims: rows.slice(0, 50),
        hasMore: rows.length > 50,
      });
    } catch (error) {
      return expenseError(error);
    }
  }
  
  // 自分の経費申請を登録する
  export async function POST(request: Request) {
    try {
      const { client, employee, organizationId } =
        await getExpenseContext(request);
  
      const body = await request.json().catch(() => null);
  
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        throw new ExpenseError("申請内容が不正です。");
      }
  
      // 画面側で発行したIDを再送にも使い、二重登録を防ぐ
      if (
        typeof body.id !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          body.id
        )
      ) {
        throw new ExpenseError("申請IDが不正です。画面を開き直してください。");
      }
  
      const date = readText(body.expenseDate, "利用日", 10);
  
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(Date.parse(`${date}T00:00:00Z`)) ||
        new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date
      ) {
        throw new ExpenseError("正しい利用日を入力してください。");
      }
  
      if (
        typeof body.amount !== "number" ||
        !Number.isSafeInteger(body.amount) ||
        body.amount <= 0
      ) {
        throw new ExpenseError("金額は1円以上の整数で入力してください。");
      }
  
      const values = {
        id: body.id,
        organization_id: organizationId,
        employee_id: employee.id,
        expense_date: date,
        amount: body.amount,
        category: readText(body.category, "経費の種類", 50),
        purpose: readText(body.purpose, "用途", 1000),
        site_name: readText(body.siteName, "現場名", 200, false) || null,
      };
  
      const { data, error } = await client
        .from("expense_claims")
        .insert({
          ...values,
          status: "submitted",
        })
        .select(fields)
        .single();
  
      if (!error) {
        return expenseJson({ claim: data }, 201);
      }
  
      if (error.code === "23505") {
        const { data: existing, error: readError } = await client
          .from("expense_claims")
          .select(fields)
          .eq("id", values.id)
          .eq("organization_id", organizationId)
          .eq("employee_id", employee.id)
          .single();
  
        if (readError || !existing) {
          throw new ExpenseError("申請IDを確認できませんでした。", 409);
        }
  
        const sameContent =
          existing.expense_date === values.expense_date &&
          Number(existing.amount) === values.amount &&
          existing.category === values.category &&
          existing.purpose === values.purpose &&
          existing.site_name === values.site_name;
  
        if (!sameContent) {
          throw new ExpenseError(
            "この申請は既に登録されています。一覧を確認してください。",
            409
          );
        }
  
        return expenseJson({ claim: existing });
      }
  
      throw new ExpenseError("経費申請を保存できませんでした。", 500);
    } catch (error) {
      return expenseError(error);
    }
  }