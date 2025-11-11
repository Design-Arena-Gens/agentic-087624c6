import { NextResponse } from "next/server";
import { getRecentHistory } from "@/lib/history";

export const GET = async () => {
  const history = await getRecentHistory(30);
  return NextResponse.json({ ok: true, history });
};
