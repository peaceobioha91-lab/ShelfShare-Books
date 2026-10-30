import { NextRequest, NextResponse } from "next/server";
import { Pool } from "@neondatabase/serverless";

export const runtime = "nodejs";

function pricingRedirect(request: NextRequest, result: "success" | "failed" | "unavailable") {
  const url = new URL("/pricing", request.url);
  url.searchParams.set("payment", result);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference");
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const connectionString = process.env.DATABASE_URL;
  if (!reference || !/^[A-Za-z0-9.=\-]{1,100}$/.test(reference)) return pricingRedirect(request, "failed");
  if (!secretKey?.startsWith("sk_test_") || !connectionString) return pricingRedirect(request, "unavailable");

  const pool = new Pool({ connectionString });
  try {
    const pending = await pool.query(
      `SELECT p.member_id::text AS member_id, p.plan, p.amount_kobo, p.status,
              m.email
       FROM membership_payments p JOIN members m ON m.id = p.member_id
       WHERE p.reference = $1 LIMIT 1`,
      [reference],
    );
    if (!pending.rows.length) return pricingRedirect(request, "failed");
    if (pending.rows[0].status === "success") return pricingRedirect(request, "success");
    if (pending.rows[0].status !== "pending") return pricingRedirect(request, "failed");

    const verificationResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
      cache: "no-store",
    });
    if (!verificationResponse.ok) return pricingRedirect(request, "failed");
    const verification = await verificationResponse.json() as {
      status?: boolean;
      data?: {
        status?: string;
        domain?: string;
        reference?: string;
        amount?: number;
        currency?: string;
        id?: number | string;
        customer?: { email?: string };
      };
    };
    const payment = verification.data;
    const expected = pending.rows[0] as { member_id: string; plan: "Basic" | "Standard"; amount_kobo: number; status: string; email: string };
    if (
      verification.status !== true || payment?.status !== "success" || payment.domain !== "test" ||
      payment.reference !== reference || payment.amount !== Number(expected.amount_kobo) || payment.currency !== "NGN" ||
      payment.customer?.email?.toLowerCase() !== expected.email.toLowerCase()
    ) return pricingRedirect(request, "failed");

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const lockedPayment = await client.query(
        "SELECT member_id::text AS member_id, plan, status FROM membership_payments WHERE reference = $1 FOR UPDATE",
        [reference],
      );
      const record = lockedPayment.rows[0] as { member_id: string; plan: "Basic" | "Standard"; status: string } | undefined;
      if (!record) {
        await client.query("ROLLBACK");
        return pricingRedirect(request, "failed");
      }
      if (record.status === "success") {
        await client.query("COMMIT");
        return pricingRedirect(request, "success");
      }
      if (record.status !== "pending" || record.member_id !== expected.member_id || record.plan !== expected.plan) {
        await client.query("ROLLBACK");
        return pricingRedirect(request, "failed");
      }
      const member = await client.query("UPDATE members SET plan = $2, paid_until = NOW() + INTERVAL '30 days' WHERE id = $1 AND role = 'member' RETURNING id", [record.member_id, record.plan]);
      if (!member.rows.length) {
        await client.query("ROLLBACK");
        return pricingRedirect(request, "failed");
      }
      await client.query(
        `UPDATE membership_payments SET status = 'success', paid_at = NOW(), paystack_transaction_id = $2
         WHERE reference = $1`,
        [reference, payment.id === undefined ? null : String(payment.id)],
      );
      await client.query("COMMIT");
      return pricingRedirect(request, "success");
    } catch {
      await client.query("ROLLBACK").catch(() => undefined);
      console.error("Paystack verification could not be applied.");
      return pricingRedirect(request, "unavailable");
    } finally {
      client.release();
    }
  } catch {
    console.error("Paystack callback verification failed.");
    return pricingRedirect(request, "unavailable");
  } finally {
    await pool.end();
  }
}
