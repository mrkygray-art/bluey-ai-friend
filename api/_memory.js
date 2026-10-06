import { createClient } from "@supabase/supabase-js";

const TEST_OWNER = "brain-lab-alpha";

function client() {
  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret) { console.error("Bluey memory config missing", { hasUrl: !!url, hasSecret: !!secret }); return null; }
  return createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
}

function key(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 80);
}

function words(value) {
  return new Set(String(value || "").toLowerCase().match(/[a-z0-9]+/g) || []);
}

function relevance(memory, query) {
  const q = words(query);
  const subject = String(memory.subject_key || "").replace(/_/g, " ");
  const text = words(subject + " " + String(memory.fact || ""));
  let score = 0;
  for (const word of q) if (word.length > 2 && text.has(word)) score += 3;
  if (subject && String(query || "").toLowerCase().includes(subject.toLowerCase())) score += 12;
  if (memory.memory_type === "PREFERENCE") score += 1;
  return score;
}

export async function loadMemories(query = "") {
  const db = client();
  if (!db) return [];
  const { data, error } = await db.from("bluey_memories")
    .select("id,memory_type,subject_key,fact,confidence,updated_at")
    .eq("owner_key", TEST_OWNER).eq("status", "active")
    .order("updated_at", { ascending: false }).limit(100);
  if (error) throw error;
  const all = data || [];
  if (!String(query || "").trim()) return all.slice(0, 12);
  const ranked = all.map(memory => ({ memory, score: relevance(memory, query) }))
    .sort((a,b) => b.score - a.score);
  const relevant = ranked.filter(x => x.score > 0).slice(0, 8).map(x => x.memory);
  return relevant;
}

export async function remember(brain) {
  if (!brain || !["REMEMBER","UPDATE","FORGET"].includes(brain.memoryAction)) return false;
  if (brain.memoryDurability !== "durable") return false;
  if (brain.memoryAction !== "FORGET" && !brain.memoryCandidate) return false;
  if (!["PREFERENCE","PROJECT","PERSONAL_FACT"].includes(brain.memoryType)) return false;
  const db = client();
  if (!db) throw new Error("Persistent memory environment variables are unavailable");

  const subject = key(brain.memorySubject || brain.projectCandidate || brain.memoryCandidate || brain.memoryType) || "memory";

  if (brain.memoryAction === "FORGET") {
    if (!brain.memorySubject) throw new Error("FORGET requires memorySubject so Bluey does not forget unrelated memories");
    const { data: matches, error: findError } = await db.from("bluey_memories")
      .select("id,subject_key").eq("owner_key", TEST_OWNER)
      .eq("memory_type", brain.memoryType).eq("status", "active");
    if (findError) throw findError;
    const target = (matches || []).find(m => m.subject_key === subject || m.subject_key.includes(subject) || subject.includes(m.subject_key));
    if (!target) throw new Error("No matching active memory found for FORGET target: " + subject);
    const { error: forgetError } = await db.from("bluey_memories")
      .update({ status: "forgotten" }).eq("id", target.id).eq("owner_key", TEST_OWNER);
    if (forgetError) throw forgetError;
    console.log("Bluey memory forgotten", { type: brain.memoryType, subject });
    return true;
  }

  if (brain.memoryAction === "UPDATE") {
    const prior = key(brain.memoryReplacesSubject);
    if (!prior) throw new Error("UPDATE requires memoryReplacesSubject so Bluey does not overwrite unrelated memories");

    const { data: matches, error: findError } = await db.from("bluey_memories")
      .select("id,subject_key")
      .eq("owner_key", TEST_OWNER).eq("memory_type", brain.memoryType).eq("status", "active");
    if (findError) throw findError;

    const target = (matches || []).find(m => m.subject_key === prior || m.subject_key.includes(prior) || prior.includes(m.subject_key));
    if (!target) throw new Error("No matching active memory found for UPDATE target: " + prior);

    const { data: inserted, error: insertError } = await db.from("bluey_memories").insert({
      owner_key: TEST_OWNER, memory_type: brain.memoryType, subject_key: subject,
      fact: String(brain.memoryCandidate), confidence: Number(brain.memoryConfidence) || 0,
      status: "active", supersedes_id: target.id
    }).select("id").single();
    if (insertError) throw insertError;

    const { error: supersedeError } = await db.from("bluey_memories")
      .update({ status: "superseded" }).eq("id", target.id).eq("owner_key", TEST_OWNER);
    if (supersedeError) {
      await db.from("bluey_memories").delete().eq("id", inserted.id);
      throw supersedeError;
    }
    console.log("Bluey memory updated", { type: brain.memoryType, from: prior, to: subject });
    return true;
  }

  const { error } = await db.from("bluey_memories").insert({
    owner_key: TEST_OWNER, memory_type: brain.memoryType, subject_key: subject,
    fact: String(brain.memoryCandidate), confidence: Number(brain.memoryConfidence) || 0, status: "active"
  });
  if (error) throw error;
  console.log("Bluey memory stored", { type: brain.memoryType, subject });
  return true;
}


export async function inspectMemories() {
  const db = client();
  if (!db) throw new Error("Persistent memory environment variables are unavailable");
  const { data, error } = await db.from("bluey_memories")
    .select("id,memory_type,subject_key,fact,confidence,status,created_at,updated_at")
    .eq("owner_key", TEST_OWNER)
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data || [];
}
