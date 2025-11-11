import { NextRequest, NextResponse } from "next/server";
import { runDailyAgent } from "@/lib/agent";
import { env } from "@/lib/env";
import { getLatestHistory } from "@/lib/history";

const validateSecret = (req: NextRequest) => {
  if (!env.DAILY_TRIGGER_SECRET) {
    return true;
  }
  const header = req.headers.get("authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  return token === env.DAILY_TRIGGER_SECRET;
};

export const GET = async () => {
  const latest = await getLatestHistory();
  return NextResponse.json({ ok: true, latest });
};

export const POST = async (req: NextRequest) => {
  if (!validateSecret(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const payload = await req
    .json()
    .catch(() => ({}) as Record<string, unknown>);

  const minViewCount =
    typeof payload?.minViewCount === "number" ? payload.minViewCount : undefined;
  const skipPosting =
    typeof payload?.skipPosting === "boolean" ? payload.skipPosting : false;

  const result = await runDailyAgent({
    minViewCount,
    skipPosting
  });

  return NextResponse.json({ ok: true, result });
};
