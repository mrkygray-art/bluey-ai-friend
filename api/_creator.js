// Bluey knows his creator only when Ky is signed in. account.js sends the signed-in session's
// access token with each /api/chat request; here we ask Supabase Auth whose token it is and compare
// that account's confirmed email with the BLUEY_CREATOR_EMAIL secret (Vercel env; never commit it).
// Signed out, a different account, an expired token, or Supabase unreachable: not the creator.
// The Brain Lab can't sign in, so on `vercel dev` only (VERCEL_ENV "development") a `creator` code
// matching BLUEY_CREATOR_CODE still counts. Production and preview deployments ignore it.
import { timingSafeEqual } from "node:crypto";

// The same project and browser (publishable) key as account.js; neither is secret.
const SUPABASE_URL = process.env.SUPABASE_URL || "https://pmvgicmongeqlgzfmqmj.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_lCmANKdoQ8nfVUG2820oVg_mb6jdei5";

function labCode(given) {
  if (process.env.VERCEL_ENV !== "development") return false;
  const secret = String(process.env.BLUEY_CREATOR_CODE || "");
  return secret.length >= 8 && typeof given === "string" && given.length === secret.length && timingSafeEqual(Buffer.from(given), Buffer.from(secret));
}

export async function isCreator(body) {
  if (labCode(body?.creator)) return true;
  const want = String(process.env.BLUEY_CREATOR_EMAIL || "").trim().toLowerCase();
  const token = typeof body?.accessToken === "string" ? body.accessToken : "";
  if (!want || !token || token.length > 4096) return false;
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(4000) });
    if (!r.ok) return false;
    const u = await r.json();
    return !!u?.email_confirmed_at && String(u.email || "").trim().toLowerCase() === want;
  } catch (_) {
    return false;
  }
}
