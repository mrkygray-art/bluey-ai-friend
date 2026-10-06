import { createClient } from "@supabase/supabase-js";

const TEST_OWNER = "brain-lab-alpha";

function client() {
  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) return null;
  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export async function loadMemories() {
  const db = client();
  if (!db) return [];
  const { data, error } = await db
    .from("bluey_memories")
    .select("id,memory_type,subject_key,fact,confidence,updated_at")
    .eq("owner_key", TEST_OWNER)
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return data || [];
}

export async function remember(brain) {
  if (!brain || brain.memoryAction !== "REMEMBER") return false;
  if (brain.memoryDurability !== "durable" || !brain.memoryCandidate) return false;
  if (!["PREFERENCE", "PROJECT", "PERSONAL_FACT"].includes(brain.memoryType)) return false;
  const db = client();
  if (!db) return false;

  const seed = brain.projectCandidate || brain.memoryCandidate || brain.memoryType;
  const subject = String(seed)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 80) || "memory";

  const { error } = await db.from("bluey_memories").insert({
    owner_key: TEST_OWNER,
    memory_type: brain.memoryType,
    subject_key: subject,
    fact: String(brain.memoryCandidate),
    confidence: Number(brain.memoryConfidence) || 0,
    status: "active"
  });
  if (error) throw error;
  return true;
}
