import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  return NextResponse.json({
    ok: true,
    method: "POST",
    authHeader,
  });
}