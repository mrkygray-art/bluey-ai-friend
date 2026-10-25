// Where creations live: the `creations` table and the private `creations` storage bucket
// (supabase/media_v1.sql). People can only read their own rows; every write happens here, on the
// server, with the secret key, after the person's sign-in token has been checked. That keeps the
// daily limits honest: nobody can delete or edit their own rows to reset them.
// Never log prompts or file contents; errors log only the path and a status code.

import { MEDIA } from "./_media-config.js";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://pmvgicmongeqlgzfmqmj.supabase.co";
// The browser (publishable) key, only to ask Supabase Auth who a token belongs to.
const PUBLISHABLE = process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_lCmANKdoQ8nfVUG2820oVg_mb6jdei5";
const BUCKET = "creations";

const secret = () => process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
export const storeReady = () => !!secret();

// New sb_secret_ keys go only in the apikey header; an older service_role JWT also needs Bearer.
function serverHeaders(extra = {}) {
  const k = secret();
  return { apikey: k, ...(k.startsWith("sb_") ? {} : { Authorization: `Bearer ${k}` }), ...extra };
}

async function call(path, { method = "GET", body, headers = {}, raw = false, timeout = 8000 } = {}) {
  const r = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: serverHeaders(raw ? headers : { "Content-Type": "application/json", ...headers }),
    body: body === undefined ? undefined : raw ? body : JSON.stringify(body),
    signal: AbortSignal.timeout(timeout),
  });
  const text = await r.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (_) { data = null; }
  if (!r.ok) {
    console.error("Bluey media store", method, path.split("?")[0].replace(/[0-9a-f-]{36}/g, ":id"), r.status);
    const e = new Error("store"); e.status = r.status; throw e;
  }
  return data;
}

// The caller's access token ("Authorization: Bearer ...").
export function tokenFrom(req) {
  const t = String(req.headers?.authorization || "").replace(/^Bearer\s+/i, "");
  return t && t.length <= 4096 && !/\s/.test(t) ? t : "";
}

// Who is signed in with this token, from Supabase Auth itself. Returns the user id or "".
export async function userIdFrom(token) {
  if (!token) return "";
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: PUBLISHABLE, Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(4000) });
    if (!r.ok) return "";
    const u = await r.json();
    return typeof u?.id === "string" ? u.id : "";
  } catch (_) { return ""; }
}

// Start a creation if the person is under today's limit. Returns the new id, or "" at the limit.
export async function reserveCreation(userId, { type, limit, parentId = null, prompt, expandedPrompt, why, provider, model }) {
  const id = await call("/rest/v1/rpc/reserve_creation", {
    method: "POST",
    body: { p_user: userId, p_type: type, p_limit: limit, p_parent: parentId, p_prompt: prompt, p_expanded: expandedPrompt, p_why: why, p_provider: provider, p_model: model },
  });
  return typeof id === "string" ? id : "";
}

export async function updateCreation(userId, id, fields) {
  await call(`/rest/v1/creations?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(userId)}`, { method: "PATCH", body: fields, headers: { Prefer: "return=minimal" } });
}

export async function getCreation(userId, id) {
  if (!/^[0-9a-f-]{36}$/i.test(String(id || ""))) return null;
  const rows = await call(`/rest/v1/creations?id=eq.${id}&user_id=eq.${encodeURIComponent(userId)}&status=neq.deleted&select=*`);
  return rows?.[0] || null;
}

export async function listCreations(userId, limit = 60) {
  return (await call(`/rest/v1/creations?user_id=eq.${encodeURIComponent(userId)}&status=neq.deleted&order=created_at.desc&limit=${limit}&select=*`)) || [];
}

export async function uploadFile(userId, id, bytes, mime, ext) {
  const path = `${userId}/${id}.${ext}`;
  await call(`/storage/v1/object/${BUCKET}/${path}`, { method: "POST", body: bytes, raw: true, headers: { "Content-Type": mime, "x-upsert": "false", "cache-control": "31536000" }, timeout: 30000 });
  return path;
}

// Short-lived links to private files: {path: {url, downloadUrl}}. The download link adds a file
// name so the browser saves the file instead of opening it.
export async function signedUrls(paths) {
  const list = paths.filter(Boolean);
  if (!list.length) return {};
  const rows = await call(`/storage/v1/object/sign/${BUCKET}`, { method: "POST", body: { expiresIn: MEDIA.linkSeconds, paths: list } });
  const out = {};
  for (const r of Array.isArray(rows) ? rows : []) {
    if (!r?.signedURL || r.error) continue;
    const url = `${SUPABASE_URL}/storage/v1${r.signedURL.startsWith("/") ? "" : "/"}${r.signedURL}`;
    out[r.path] = { url, downloadUrl: `${url}&download=${encodeURIComponent("bluey-" + r.path.split("/").pop())}` };
  }
  return out;
}

async function removeFiles(paths) {
  const list = paths.filter(Boolean);
  if (list.length) await call(`/storage/v1/object/${BUCKET}`, { method: "DELETE", body: { prefixes: list } });
}

// Delete: the file goes and the words are cleared; the row stays (status deleted) only so the
// daily limit still counts it. Returns how many were deleted.
export async function deleteCreations(userId, ids /* array, or "all" */) {
  const filter = ids === "all" ? "" : `&id=in.(${ids.filter(i => /^[0-9a-f-]{36}$/i.test(i)).join(",")})`;
  if (ids !== "all" && filter === "&id=in.()") return 0;
  const rows = await call(`/rest/v1/creations?user_id=eq.${encodeURIComponent(userId)}&status=neq.deleted${filter}&select=id,storage_path,thumb_path`);
  if (!rows?.length) return 0;
  await removeFiles(rows.flatMap(r => [r.storage_path, r.thumb_path]));
  await call(`/rest/v1/creations?user_id=eq.${encodeURIComponent(userId)}&id=in.(${rows.map(r => r.id).join(",")})`, {
    method: "PATCH",
    body: { status: "deleted", deleted_at: new Date().toISOString(), prompt: "", expanded_prompt: "", why: "", storage_path: null, thumb_path: null, error: null },
    headers: { Prefer: "return=minimal" },
  });
  return rows.length;
}

// What the browser gets for one creation (never the user id or storage paths).
export function publicCreation(row, links = {}) {
  return {
    id: row.id, type: row.type, parentId: row.parent_id || null, status: row.status,
    prompt: row.prompt, expandedPrompt: row.expanded_prompt, why: row.why,
    url: links[row.storage_path]?.url || null, downloadUrl: links[row.storage_path]?.downloadUrl || null,
    createdAt: row.created_at,
  };
}
