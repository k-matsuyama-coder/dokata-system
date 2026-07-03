import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function verifyLineSignature(body: string, signature: string | null) {
  if (!signature) return false;

  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  if (!channelSecret) {
    throw new Error("LINE_CHANNEL_SECRET is not set");
  }

  const hash = crypto
    .createHmac("SHA256", channelSecret)
    .update(body)
    .digest("base64");

  return hash === signature;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-line-signature");

  if (!verifyLineSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const data = JSON.parse(body);
  console.log("LINE webhook:", JSON.stringify(data, null, 2));

  return NextResponse.json({ ok: true });
}