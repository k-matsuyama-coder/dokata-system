import {
    ExpenseError,
    expenseJson,
    expenseError,
    getExpenseContext,
  } from "@/lib/expenseServer";
  
  export const runtime = "nodejs";
  export const dynamic = "force-dynamic";
  
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
  
  export async function POST(request: Request) {
    try {
      const { client, employee, organizationId } =
        await getExpenseContext(request);
  
      const body = await request.json().catch(() => null);
  
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        throw new ExpenseError("送信内容が不正です。");
      }
  
      if (
        typeof body.claimId !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          body.claimId
        )
      ) {
        throw new ExpenseError("申請IDが不正です。");
      }
  
      if (typeof body.updatedAt !== "string") {
        throw new ExpenseError(
          "申請一覧を再読み込みしてください。",
          409
        );
      }
  
      const expenseDate = readText(body.expenseDate, "利用日", 10);
      const dateTime = Date.parse(`${expenseDate}T00:00:00Z`);
  
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(expenseDate) ||
        !Number.isFinite(dateTime) ||
        new Date(dateTime).toISOString().slice(0, 10) !== expenseDate ||
        Number(expenseDate.slice(0, 4)) < 2000 ||
        Number(expenseDate.slice(0, 4)) > 9998
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
  
      const category = readText(body.category, "経費の種類", 50);
      const purpose = readText(body.purpose, "用途", 1000);
      const siteName = readText(body.siteName, "現場名", 200, false);
  
      // 管理者であっても、他人の申請は修正できない
      const { data: claim, error: claimError } = await client
        .from("expense_claims")
        .select("id, status, receipt_path, updated_at")
        .eq("id", body.claimId)
        .eq("organization_id", organizationId)
        .eq("employee_id", employee.id)
        .maybeSingle();
  
      if (claimError) {
        throw new ExpenseError("申請を取得できませんでした。", 500);
      }
  
      if (!claim) {
        throw new ExpenseError("修正できる申請がありません。", 404);
      }
  
      if (claim.status !== "returned") {
        throw new ExpenseError(
          "差し戻された申請だけ再申請できます。一覧を確認してください。",
          409
        );
      }
  
      if (claim.updated_at !== body.updatedAt) {
        throw new ExpenseError(
          "申請が更新されています。一覧を再読み込みしてください。",
          409
        );
      }
  
      const receiptPrefix =
        `${organizationId}/${employee.id}/${claim.id}/`;
  
      if (
        !claim.receipt_path ||
        !claim.receipt_path.startsWith(receiptPrefix) ||
        claim.receipt_path.includes("..")
      ) {
        throw new ExpenseError(
          "領収書写真を添付してから再申請してください。"
        );
      }
  
      const { data: updated, error: updateError } = await client
        .from("expense_claims")
        .update({
          expense_date: expenseDate,
          amount: body.amount,
          category,
          purpose,
          site_name: siteName || null,
          status: "submitted",
          return_reason: null,
          approved_by: null,
          approved_at: null,
          paid_by: null,
          paid_at: null,
          payment_date: null,
          payment_method: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", claim.id)
        .eq("organization_id", organizationId)
        .eq("employee_id", employee.id)
        .eq("status", "returned")
        .eq("updated_at", claim.updated_at)
        .select("id, status, updated_at")
        .maybeSingle();
  
      if (updateError) {
        throw new ExpenseError(
          "再申請を保存できませんでした。一覧を確認してください。",
          500
        );
      }
  
      if (!updated) {
        throw new ExpenseError(
          "別の操作で申請が更新されました。一覧を再読み込みしてください。",
          409
        );
      }
  
      return expenseJson({ claim: updated });
    } catch (error) {
      return expenseError(error);
    }
  }