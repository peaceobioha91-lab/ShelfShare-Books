import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { Pool } from "@neondatabase/serverless";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

const planAmounts = { Basic: 150_000, Standard: 250_000 } as const;

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin || !request.headers.get("content-type")?.startsWith("application/json")) {
    return NextResponse.json({ error: "Request could not be verified." }, { status: 403 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Log in or create an account to choose a membership plan." }, { status: 401 });
  if (user.role !== "member") return NextResponse.json({ error: "Librarian accounts don’t need a member plan." }, { status: 403 });

  let body: { plan?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Choose a membership plan." }, { status: 400 }); }
  const plan = body.plan === "Basic" || body.plan === "Standard" ? body.plan : null;
  if (!plan) return NextResponse.json({ error: "Choose a valid membership plan." }, { status: 400 });

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey?.startsWith("sk_test_")) return NextResponse.json({ error: "Paystack test checkout is not configured." }, { status: 503 });
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return NextResponse.json({ error: "Checkout is temporarily unavailable." }, { status: 503 });

  const reference = `shelfshare-${randomUUID()}`;
  const amount = planAmounts[plan];
  const pool = new Pool({ connectionString });
  try {
    await pool.query(
      `INSERT INTO membership_payments (member_id, plan, amount_kobo, reference)
       VALUES ($1, $2, $3, $4)`,
      [user.id, plan, amount, reference],
    );
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        amount,
        currency: "NGN",
        reference,
        callback_url: `${request.nextUrl.origin}/api/paystack/callback`,
        metadata: { member_id: user.id, plan },
      }),
      cache: "no-store",
    });
    const result = await response.json() as { status?: boolean; message?: string; data?: { authorization_url?: string; reference?: string } };
    if (!response.ok || result.status !== true || !result.data?.authorization_url || result.data.reference !== reference) {
      await pool.query("UPDATE membership_payments SET status = 'failed' WHERE reference = $1 AND status = 'pending'", [reference]);
      return NextResponse.json({ error: "Paystack couldn’t start checkout. Please try again." }, { status: 502 });
    }
    return NextResponse.json({ authorizationUrl: result.data.authorization_url });
  } catch {
    await pool.query("UPDATE membership_payments SET status = 'failed' WHERE reference = $1 AND status = 'pending'", [reference]).catch(() => undefined);
    console.error("Paystack initialization failed.");
    return NextResponse.json({ error: "Checkout is temporarily unavailable. Please try again." }, { status: 503 });
  } finally {
    await pool.end();
  }
}
