import { NextRequest, NextResponse } from "next/server";
import { sendDueReminderBatch } from "@/lib/notifications";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const result = await sendDueReminderBatch();
    return NextResponse.json({ ok: true, ...result });
  } catch {
    console.error("Scheduled email batch failed.");
    return NextResponse.json({ error: "Scheduled email batch failed." }, { status: 503 });
  }
}
