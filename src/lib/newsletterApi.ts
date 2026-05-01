import { supabase } from "@/integrations/supabase/client";

export type NewsletterSource = "hero" | "newsletter_section" | "footer";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type SubscribeResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "duplicate" | "unknown" };

export async function subscribeEmail(
  rawEmail: string,
  source: NewsletterSource,
): Promise<SubscribeResult> {
  const email = rawEmail.trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 255) {
    return { ok: false, reason: "invalid" };
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("newsletter_subscribers")
      .insert({ email, source });
    if (error) {
      // Postgres unique violation
      if (error.code === "23505" || /duplicate|unique/i.test(error.message ?? "")) {
        return { ok: false, reason: "duplicate" };
      }
      console.error("[subscribeEmail]", error);
      return { ok: false, reason: "unknown" };
    }
    return { ok: true };
  } catch (e) {
    console.error("[subscribeEmail]", e);
    return { ok: false, reason: "unknown" };
  }
}
