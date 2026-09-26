import {
    ExpenseError,
    expenseJson,
    expenseError,
    getExpenseContext,
  } from "@/lib/expenseServer";
  
  export const runtime = "nodejs";
  export const dynamic = "force-dynamic";
  
  function validDate(value: unknown): value is string {
    if (
      typeof value !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
      return false;
    }
  
    const time = Date.parse(`${value}T00:00:00Z`);
  
    return (
      Number.isFinite(time) &&
      new Date(time).toISOString().slice(0, 10) === value
    );
  }
  
  export async function POST(request: Request) {
    try {
      const {
        client,
        employee,
        organizationId,
        companyName,
        isAdmin,
      } = await getExpenseContext(request);
  
      if (!isAdmin) {
        throw new ExpenseError(
          "承認・精算は管理者のみ操作できます。",
          403
        );
      }
  
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
  
      if (!["approve", "return", "pay"].includes(body.action)) {
        throw new ExpenseError("操作の指定が不正です。");
      }
  
      if (typeof body.updatedAt !== "string") {
        throw new ExpenseError(
          "申請一覧を再読み込みしてから操作してください。",
          409
        );
      }
  
      // 自社に所属する申請者の経費だけ取得する
      const { data: claim, error: claimError } = await client
        .from("expense_claims")
        .select(`
          id,
          employee_id,
          status,
          receipt_path,
          updated_at,
          applicant:employees!expense_claims_employee_id_fkey!inner(
            organization_id,
            company_name
          )
        `)
        .eq("id", body.claimId)
        .eq("organization_id", organizationId)
        .eq("applicant.organization_id", organizationId)
        .eq("applicant.company_name", companyName)
        .maybeSingle();
  
      if (claimError) {
        throw new ExpenseError(
          "申請を取得できませんでした。",
          500
        );
      }
  
      if (!claim) {
        throw new ExpenseError(
          "操作できる申請がありません。",
          404
        );
      }
  
      if (claim.updated_at !== body.updatedAt) {
        throw new ExpenseError(
          "申請内容が更新されています。一覧を再読み込みしてください。",
          409
        );
      }
  
      if (claim.status === "paid") {
        throw new ExpenseError(
          "精算済みの申請は変更できません。",
          409
        );
      }
  
      const now = new Date().toISOString();
      const changes: Record<string, string | null> = {
        updated_at: now,
      };
  
      if (body.action === "approve") {
        if (claim.status !== "submitted") {
          throw new ExpenseError(
            "申請中の経費だけ承認できます。",
            409
          );
        }
  
        const receiptPrefix =
          `${organizationId}/${claim.employee_id}/${claim.id}/`;
  
        if (
          !claim.receipt_path ||
          !claim.receipt_path.startsWith(receiptPrefix) ||
          claim.receipt_path.includes("..")
        ) {
          throw new ExpenseError(
            "領収書の添付が完了していません。申請者に確認してください。",
            409
          );
        }
  
        changes.status = "approved";
        changes.approved_by = employee.id;
        changes.approved_at = now;
        changes.return_reason = null;
      }
  
      if (body.action === "return") {
        if (!["submitted", "approved"].includes(claim.status)) {
          throw new ExpenseError(
            "この申請は差し戻しできません。",
            409
          );
        }
  
        const reason =
          typeof body.reason === "string" ? body.reason.trim() : "";
  
        if (!reason || reason.length > 1000) {
          throw new ExpenseError(
            "差し戻し理由を1〜1000文字で入力してください。"
          );
        }
  
        changes.status = "returned";
        changes.return_reason = reason;
        changes.approved_by = null;
        changes.approved_at = null;
      }
  
      if (body.action === "pay") {
        if (claim.status !== "approved") {
          throw new ExpenseError(
            "承認済みの経費だけ精算できます。",
            409
          );
        }
  
        if (!validDate(body.paymentDate)) {
          throw new ExpenseError("正しい精算日を入力してください。");
        }
  
        if (!["bank_transfer", "cash"].includes(body.paymentMethod)) {
          throw new ExpenseError("支払方法を選択してください。");
        }
  
        changes.status = "paid";
        changes.paid_by = employee.id;
        changes.paid_at = now;
        changes.payment_date = body.paymentDate;
        changes.payment_method = body.paymentMethod;
      }
  
      // 読み取り後に別の人が更新していた場合も上書きしない
      const { data: updated, error: updateError } = await client
        .from("expense_claims")
        .update(changes)
        .eq("id", claim.id)
        .eq("organization_id", organizationId)
        .eq("status", claim.status)
        .eq("updated_at", claim.updated_at)
        .select("id, status, updated_at")
        .maybeSingle();
  
      if (updateError) {
        throw new ExpenseError(
          "保存できませんでした。一覧を再読み込みして確認してください。",
          500
        );
      }
  
      if (!updated) {
        throw new ExpenseError(
          "他の操作で申請が更新されました。一覧を再読み込みしてください。",
          409
        );
      }
  
      return expenseJson({ claim: updated });
    } catch (error) {
      return expenseError(error);
    }
  }