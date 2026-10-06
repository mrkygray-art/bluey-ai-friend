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

const CONCEPTS = [
  ["organize","organized","organizing","organization","organizer","keeping","track"],
  ["tool","tools","wrench","wrenches","drill","drills","garage","workshop","equipment","gear"],
  ["meal","meals","food","dinner","lunch","breakfast","recipe","recipes","cooking"],
  ["book","books","reading","library","novel","novels"],
  ["project","projects","building","build","making","thing"]
];

function expandedWords(value) {
  const base = words(value);
  const expanded = new Set(base);
  for (const group of CONCEPTS) {
    if (group.some(word => base.has(word))) for (const word of group) expanded.add(word);
  }
  return expanded;
}

function relevance(memory, query) {
  const q = expandedWords(query);
  const subject = String(memory.subject_key || "").replace(/_/g, " ");
  const text = expandedWords(subject + " " + String(memory.fact || ""));
  let score = 0;
  for (const word of q) if (word.length > 2 && text.has(word)) score += 3;
  const rawQuery = String(query || "").toLowerCase();
  if (subject && rawQuery.includes(subject.toLowerCase())) score += 12;
  if (memory.memory_type === "PREFERENCE") {
    const wantsPreference = /\b(prefer|preference|answer me|respond|response|style|concise|short|simple|detailed|format|tone)\b/i.test(rawQuery);
    if (!wantsPreference) return 0;
    score += 9;
  }
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
  const positive = ranked.filter(x => x.score > 0);
  if (!positive.length) return [];

  const top = positive[0].score;
  const exactSubject = positive.filter(x => String(query || "").toLowerCase().includes(String(x.memory.subject_key || "").replace(/_/g, " ").toLowerCase()));

  // An explicitly named subject is decisive. For indirect references, preserve
  // every plausible contender near the top score. Concept expansion can make
  // one related memory score artificially higher, so use a wider ambiguity
  // band rather than silently choosing it.
  if (exactSubject.length) return exactSubject.slice(0, 3).map(x => x.memory);
  const close = positive.filter(x => x.score >= Math.max(3, top * 0.35));

  // If an indirect query has multiple positive project matches, preserve them.
  // Ambiguity should be resolved conversationally, not by an arbitrary score gap.
  const projectMatches = positive.filter(x => x.memory.memory_type === "PROJECT");
  if (projectMatches.length > 1) return projectMatches.slice(0, 4).map(x => x.memory);

  return close.slice(0, 4).map(x => x.memory);
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
