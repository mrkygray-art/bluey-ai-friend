// GET    /api/media/library            the signed-in person's creations, newest first, with fresh links
// DELETE /api/media/library?id=<id>    delete one (the file is removed and its words cleared)
// DELETE /api/media/library?all=1      delete all of them (used by Delete my account)
// Header: Authorization: Bearer <Supabase access token>.
import { overLimit } from "../_limit.js";
import { storeReady, tokenFrom, userIdFrom, listCreations, deleteCreations, signedUrls, publicCreation } from "../_media-store.js";
import { SAY } from "../_media-words.js";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "DELETE") return res.status(405).json({ error: "Method not allowed" });
  if (overLimit(req, res, "media-library", 120, 5000)) return;
  if (!storeReady()) return res.status(501).json({ error: SAY.notReady });
  const userId = await userIdFrom(tokenFrom(req));
  if (!userId) return res.status(401).json({ error: SAY.signIn });
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method === "DELETE") {
      const all = req.query?.all === "1";
      const id = String(req.query?.id || "");
      if (!all && !id) return res.status(400).json({ error: "Missing id" });
      const deleted = await deleteCreations(userId, all ? "all" : [id]);
      if (!all && !deleted) return res.status(404).json({ error: SAY.notFound });
      return res.status(200).json({ deleted });
    }
    const rows = await listCreations(userId);
    const links = await signedUrls(rows.map(r => r.storage_path));
    return res.status(200).json({ creations: rows.filter(r => r.status !== "failed").map(r => publicCreation(r, links)) });
  } catch (_) {
    return res.status(503).json({ error: SAY.storeDown });
  }
}
