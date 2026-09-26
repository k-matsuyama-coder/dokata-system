import { randomUUID } from "node:crypto";
import {
  ExpenseError,
  expenseJson,
  expenseError,
  getExpenseContext,
} from "@/lib/expenseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "expense-receipts";
const MAX_SIZE = 3 * 1024 * 1024;

type Context = Awaited<ReturnType<typeof getExpenseContext>>;

function validateId(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value
    )
  ) {
    throw new ExpenseError("申請IDが不正です。");
  }

  return value;
}

// 申請と申請者の所属会社を確認
async function getClaim(context: Context, id: string) {
  const {
    client,
    employee,
    organizationId,
    companyName,
    isAdmin,
  } = context;

  let query = client
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
    .eq("id", id)
    .eq("organization_id", organizationId)
    .eq("applicant.organization_id", organizationId)
    .eq("applicant.company_name", companyName);

  if (!isAdmin) {
    query = query.eq("employee_id", employee.id);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new ExpenseError("申請情報を確認できませんでした。", 500);
  }

  if (!data) {
    throw new ExpenseError("閲覧できる申請がありません。", 404);
  }

  return data;
}

// 拡張子ではなく、ファイルの内容で画像形式を確認
function imageFormat(bytes: Uint8Array) {
  if (
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return { extension: "jpg", contentType: "image/jpeg" };
  }

  const png = [137, 80, 78, 71, 13, 10, 26, 10];

  if (png.every((value, index) => bytes[index] === value)) {
    return { extension: "png", contentType: "image/png" };
  }

  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return { extension: "webp", contentType: "image/webp" };
  }

  throw new ExpenseError(
    "JPEG・PNG・WebP形式の領収書写真を選択してください。"
  );
}

// 本人または自社管理者に、短時間だけ有効な閲覧URLを返す
export async function GET(request: Request) {
  try {
    const context = await getExpenseContext(request);
    const id = validateId(
      new URL(request.url).searchParams.get("claimId")
    );

    const claim = await getClaim(context, id);

    if (!claim.receipt_path) {
      throw new ExpenseError("領収書はまだ添付されていません。", 404);
    }

    const prefix =
      `${context.organizationId}/${claim.employee_id}/${claim.id}/`;

    if (
      !claim.receipt_path.startsWith(prefix) ||
      claim.receipt_path.includes("..")
    ) {
      throw new ExpenseError("領収書の保存先を確認できません。", 403);
    }

    const { data, error } = await context.client.storage
      .from(BUCKET)
      .createSignedUrl(claim.receipt_path, 60);

    if (error || !data?.signedUrl) {
      throw new ExpenseError("領収書を開けませんでした。", 500);
    }

    return expenseJson({ url: data.signedUrl });
  } catch (error) {
    return expenseError(error);
  }
}

// 申請者本人が領収書を添付する
export async function POST(request: Request) {
  try {
    const context = await getExpenseContext(request);
    const { client, employee, organizationId } = context;

    const form = await request.formData().catch(() => null);

    if (!form) {
      throw new ExpenseError("送信内容を読み取れませんでした。");
    }

    const id = validateId(form.get("claimId"));
    const file = form.get("file");

    if (!(file instanceof File) || file.size === 0) {
      throw new ExpenseError("領収書写真を選択してください。");
    }

    if (file.size > MAX_SIZE) {
      throw new ExpenseError("写真は3MB以下にしてください。");
    }

    const claim = await getClaim(context, id);

    const expectedUpdatedAt = form.get("updatedAt");

    if (
      expectedUpdatedAt !== null &&
      expectedUpdatedAt !== claim.updated_at
    ) {
      throw new ExpenseError(
        "申請が更新されています。一覧を再読み込みしてください。",
        409
      );
    }

    if (claim.employee_id !== employee.id) {
      throw new ExpenseError(
        "領収書を変更できるのは申請した本人だけです。",
        403
      );
    }

    if (!["submitted", "returned"].includes(claim.status)) {
      throw new ExpenseError(
        "承認後の領収書は変更できません。",
        409
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const format = imageFormat(bytes);

    const prefix = `${organizationId}/${employee.id}/${id}/`;
    const path = `${prefix}${randomUUID()}.${format.extension}`;

    const { error: uploadError } = await client.storage
      .from(BUCKET)
      .upload(path, bytes, {
        contentType: format.contentType,
        upsert: false,
      });

    if (uploadError) {
      throw new ExpenseError("領収書を保存できませんでした。", 500);
    }

    // 確認後に承認・編集されていたら上書きしない
    const { data: updated, error: updateError } = await client
      .from("expense_claims")
      .update({
        receipt_path: path,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("organization_id", organizationId)
      .eq("employee_id", employee.id)
      .eq("status", claim.status)
      .eq("updated_at", claim.updated_at)
      .select("id, updated_at")
      .maybeSingle();

    if (updateError || !updated) {
      await client.storage.from(BUCKET).remove([path]);

      throw new ExpenseError(
        "申請が更新されたか、保存に失敗しました。一覧を確認して再度お試しください。",
        409
      );
    }

    // 差し替え前の写真を削除
    if (
      claim.receipt_path &&
      claim.receipt_path.startsWith(prefix) &&
      !claim.receipt_path.includes("..")
    ) {
      await client.storage
        .from(BUCKET)
        .remove([claim.receipt_path]);
    }

    return expenseJson({
        ok: true,
        updatedAt: updated.updated_at,
      });
  } catch (error) {
    return expenseError(error);
  }
}