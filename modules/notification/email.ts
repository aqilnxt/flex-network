import "server-only";

import { Resend } from "resend";
import { admin } from "@/lib/supabase/admin";

type SendEmailParams = {
  to: string;
  title: string;
  message: string;
  link: string;
};

const LOGO_MARK =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32"><rect width="32" height="32" rx="9" fill="#2447F9"/><path d="M9 22c0-6 4-6 7-6s7 0 7-6" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none"/><circle cx="23" cy="10" r="2.2" fill="#fff"/><circle cx="9" cy="22" r="2.2" fill="#fff"/></svg>',
  );

function renderHtml(p: SendEmailParams): string {
  const url = p.link.startsWith("http") ? p.link : `${process.env.NEXT_PUBLIC_APP_URL ?? "https://flex-network.vercel.app"}${p.link}`;
  return `<!doctype html>
<html lang="id">
  <body style="margin:0;padding:32px 16px;background:#F7F8FC;font-family:Inter,ui-sans-serif,system-ui,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #E4E8F7;border-radius:16px;">
      <tr>
        <td style="padding:32px 32px 8px;">
          <img src="${LOGO_MARK}" width="32" height="32" alt="Flex Network" style="display:block;"/>
          <h1 style="margin:20px 0 0;font-size:20px;line-height:1.3;color:#0D0907;font-weight:700;">${p.title}</h1>
          <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#34364A;">${p.message}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 32px 32px;">
          <a href="${url}" style="display:inline-block;background:#2447F9;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 20px;border-radius:12px;">Lihat di Flex Network</a>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 28px;">
          <p style="margin:0;font-size:12px;color:#5B5E73;">Email otomatis dari Flex Network. Tidak perlu balas.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function getRecipientEmail(userId: string): Promise<string | null> {
  const { data } = await admin
    .from("profile_private")
    .select("email")
    .eq("profile_id", userId)
    .maybeSingle();
  return data?.email ?? null;
}

export async function sendEmail(p: SendEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // mode in-app only
  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
  await resend.emails.send({
    from,
    to: p.to,
    subject: p.title,
    html: renderHtml(p),
  });
}
