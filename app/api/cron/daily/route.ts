import { NextRequest, NextResponse } from "next/server";
import { runDailyAgent } from "@/lib/agent";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

const isAuthorized = (req: NextRequest): boolean => {
  if (!env.DAILY_TRIGGER_SECRET) {
    return true;
  }
  const provided =
    req.nextUrl.searchParams.get("secret") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    "";
  return provided === env.DAILY_TRIGGER_SECRET;
};

export const GET = async (req: NextRequest) => {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await runDailyAgent();
  return NextResponse.json({ ok: true, result });
};
