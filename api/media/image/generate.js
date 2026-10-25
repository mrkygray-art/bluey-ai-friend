// POST /api/media/image/generate — make a new picture for the signed-in person.
// Body: {prompt (their own words), expandedPrompt (the prompt Bluey wrote in chat), why, shape}.
// Header: Authorization: Bearer <Supabase access token>.
// Returns {creation: {id, type, url, downloadUrl, prompt, expandedPrompt, why, createdAt, ...}}.
import { overLimit } from "../../_limit.js";
import { MEDIA, IMAGE_SIZES } from "../../_media-config.js";
import { imageProvider, MediaError } from "../../_media-providers.js";
import { namesRealPerson } from "../../_media-check.js";
import { storeReady, tokenFrom, userIdFrom, reserveCreation, updateCreation, uploadFile, signedUrls, publicCreation } from "../../_media-store.js";
import { SAY, clean, photoPrompt } from "../../_media-words.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (overLimit(req, res, "media-image", 20, 300)) return;
  if (!process.env.OPENAI_API_KEY || !storeReady()) return res.status(501).json({ error: SAY.notReady });
  const userId = await userIdFrom(tokenFrom(req));
  if (!userId) return res.status(401).json({ error: SAY.signIn });

  const prompt = clean(req.body?.prompt, 1000);
  const expandedPrompt = clean(req.body?.expandedPrompt, 4000) || photoPrompt(prompt);
  const why = clean(req.body?.why, 500);
  const size = IMAGE_SIZES[req.body?.shape] || IMAGE_SIZES.square;
  if (!prompt && !clean(req.body?.expandedPrompt, 10)) return res.status(400).json({ error: SAY.empty });

  if (await namesRealPerson(`${prompt}\n${expandedPrompt}`)) return res.status(422).json({ error: SAY.realPerson, reason: "real-person" });

  const provider = imageProvider();
  let id;
  try {
    id = await reserveCreation(userId, { type: "image", limit: MEDIA.dailyImages, prompt, expandedPrompt, why, provider: provider.name, model: MEDIA.imageModel });
  } catch (_) { return res.status(503).json({ error: SAY.storeDown }); }
  if (!id) return res.status(429).json({ error: SAY.imageLimit(MEDIA.dailyImages), reason: "daily-limit" });

  try {
    const out = await provider.generate({ prompt: expandedPrompt, size, userId });
    const path = await uploadFile(userId, id, out.bytes, out.mime, "jpg");
    await updateCreation(userId, id, { status: "done", storage_path: path, model: out.model, cost_estimate: out.costEstimate });
    console.log("Bluey media made", JSON.stringify({ type: "image", provider: provider.name, model: out.model, cost: out.costEstimate }));
    const links = await signedUrls([path]);
    return res.status(200).json({ creation: publicCreation({ id, type: "image", parent_id: null, status: "done", prompt, expanded_prompt: expandedPrompt, why, storage_path: path, created_at: new Date().toISOString() }, links) });
  } catch (e) {
    const kind = e instanceof MediaError ? e.kind : "failed";
    try { await updateCreation(userId, id, { status: "failed", error: String(e?.message || "failed").slice(0, 300) }); } catch (_) {}
    return res.status(kind === "refused" ? 422 : kind === "busy" ? 503 : 502).json({ error: SAY[kind] || SAY.failed, reason: kind });
  }
}
