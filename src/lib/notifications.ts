import "server-only";
import { neon } from "@neondatabase/serverless";
import { Resend } from "resend";

type EmailPayload = { to: string; subject: string; html: string; text: string; idempotencyKey: string };

function emailConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const appUrl = process.env.APP_URL;
  if (!apiKey || !from || !appUrl) return null;
  try {
    return { resend: new Resend(apiKey), from, appUrl: new URL(appUrl).origin };
  } catch {
    return null;
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

async function deliver(payload: EmailPayload) {
  const config = emailConfig();
  if (!config) return false;
  try {
    const { error } = await config.resend.emails.send({
      from: config.from,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    }, { idempotencyKey: payload.idempotencyKey });
    return !error;
  } catch {
    return false;
  }
}

async function sendWaitlistHoldEmailInternal(waitlistId: string) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || !emailConfig()) return false;
  const sql = neon(connectionString);
  const claimed = await sql`
    UPDATE waitlist w SET email_claimed_at = NOW()
    FROM members m, books b
    WHERE w.id = ${waitlistId} AND w.member_id = m.id AND w.book_id = b.id
      AND w.notified = FALSE AND w.email_sent_at IS NULL AND w.hold_until > NOW()
      AND (w.email_claimed_at IS NULL OR w.email_claimed_at < NOW() - INTERVAL '15 minutes')
    RETURNING w.id::text AS id, w.hold_until::text AS hold_until,
              m.name AS member_name, m.email, b.id::text AS book_id, b.title
  `;
  const entry = claimed[0] as { id: string; hold_until: string; member_name: string; email: string; book_id: string; title: string } | undefined;
  if (!entry) return false;

  const config = emailConfig()!;
  const bookUrl = `${config.appUrl}/catalogue/${encodeURIComponent(entry.book_id)}`;
  const name = escapeHtml(entry.member_name);
  const title = escapeHtml(entry.title);
  const holdTime = new Date(entry.hold_until);
  const formattedHold = new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }).format(holdTime);
  const sent = await deliver({
    to: entry.email,
    subject: `A copy of ${entry.title} is ready for you`,
    text: `Hello ${entry.member_name}, a copy of ${entry.title} is ready. Please borrow it before ${formattedHold}: ${bookUrl}`,
    html: `<p>Hello ${name},</p><p>A copy of <strong>${title}</strong> is ready for you. It is held until <strong>${escapeHtml(formattedHold)}</strong>.</p><p><a href="${bookUrl}">Open the book page to request it</a>.</p><p>If you no longer need it, you can leave your queue from My waitlist.</p>`,
    idempotencyKey: `waitlist-hold/${entry.id}/${holdTime.getTime()}`,
  });
  if (sent) {
    await sql`UPDATE waitlist SET notified = TRUE, email_sent_at = NOW(), email_claimed_at = NULL WHERE id = ${entry.id} AND hold_until = ${entry.hold_until}`;
  } else {
    await sql`UPDATE waitlist SET email_claimed_at = NULL WHERE id = ${entry.id} AND hold_until = ${entry.hold_until}`;
  }
  return sent;
}

export async function sendWaitlistHoldEmail(waitlistId: string) {
  try { return await sendWaitlistHoldEmailInternal(waitlistId); } catch { return false; }
}

async function sendDueReminderInternal(loanId: string) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || !emailConfig()) return false;
  const sql = neon(connectionString);
  const claimed = await sql`
    UPDATE loans SET reminder_claimed_at = NOW()
    WHERE id = ${loanId} AND returned_at IS NULL AND reminder_sent_at IS NULL
      AND ((due_at >= NOW() + INTERVAL '2 days' AND due_at < NOW() + INTERVAL '3 days')
        OR (reminder_claimed_at IS NOT NULL AND due_at > NOW() AND due_at < NOW() + INTERVAL '2 days'))
      AND (reminder_claimed_at IS NULL OR reminder_claimed_at < NOW() - INTERVAL '15 minutes')
    RETURNING id::text AS id, due_at::text AS due_at
  `;
  if (!claimed.length) return false;
  const loan = await sql`
    SELECT l.id::text AS id, l.due_at::text AS due_at,
           m.name AS member_name, m.email, b.title
    FROM loans l JOIN members m ON m.id = l.member_id JOIN books b ON b.id = l.book_id
    WHERE l.id = ${loanId} AND l.returned_at IS NULL
  `;
  const entry = loan[0] as { id: string; due_at: string; member_name: string; email: string; title: string } | undefined;
  if (!entry) {
    await sql`UPDATE loans SET reminder_claimed_at = NULL WHERE id = ${loanId} AND reminder_sent_at IS NULL`;
    return false;
  }

  const config = emailConfig()!;
  const name = escapeHtml(entry.member_name);
  const title = escapeHtml(entry.title);
  const dueDate = new Date(entry.due_at);
  const formattedDue = new Intl.DateTimeFormat("en-NG", { dateStyle: "long", timeZone: "Africa/Lagos" }).format(dueDate);
  const loansUrl = `${config.appUrl}/member/loans`;
  const sent = await deliver({
    to: entry.email,
    subject: `Due date reminder: ${entry.title}`,
    text: `Hello ${entry.member_name}, ${entry.title} is due back on ${formattedDue}. View your loans: ${loansUrl}`,
    html: `<p>Hello ${name},</p><p><strong>${title}</strong> is due back on <strong>${escapeHtml(formattedDue)}</strong>.</p><p><a href="${loansUrl}">View your loans</a> or visit Ekenwan Community Library to return it.</p>`,
    idempotencyKey: `due-reminder/${entry.id}/${dueDate.getTime()}`,
  });
  if (sent) {
    await sql`UPDATE loans SET reminder_sent_at = NOW(), reminder_claimed_at = NULL WHERE id = ${loanId} AND returned_at IS NULL`;
  }
  return sent;
}

export async function sendDueReminder(loanId: string) {
  try { return await sendDueReminderInternal(loanId); } catch { return false; }
}

export async function sendDueReminderBatch() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || !emailConfig()) throw new Error("Email or database configuration is missing.");
  const sql = neon(connectionString);
  const dueLoans = await sql`
    SELECT id::text AS id FROM loans
    WHERE returned_at IS NULL AND reminder_sent_at IS NULL
      AND ((due_at >= NOW() + INTERVAL '2 days' AND due_at < NOW() + INTERVAL '3 days')
        OR (reminder_claimed_at IS NOT NULL AND due_at > NOW() AND due_at < NOW() + INTERVAL '2 days'))
      AND (reminder_claimed_at IS NULL OR reminder_claimed_at < NOW() - INTERVAL '15 minutes')
    ORDER BY due_at ASC LIMIT 200
  ` as Array<{ id: string }>;
  const pendingWaitlist = await sql`
    SELECT id::text AS id FROM waitlist
    WHERE hold_until > NOW() AND notified = FALSE AND email_sent_at IS NULL
      AND (email_claimed_at IS NULL OR email_claimed_at < NOW() - INTERVAL '15 minutes')
    ORDER BY hold_until ASC LIMIT 200
  ` as Array<{ id: string }>;

  let remindersSent = 0;
  let waitlistEmailsSent = 0;
  for (const loan of dueLoans) if (await sendDueReminder(loan.id)) remindersSent += 1;
  for (const entry of pendingWaitlist) if (await sendWaitlistHoldEmail(entry.id)) waitlistEmailsSent += 1;
  return { remindersSent, waitlistEmailsSent, remindersScanned: dueLoans.length, waitlistScanned: pendingWaitlist.length };
}
