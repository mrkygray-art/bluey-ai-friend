import { inspectMemories } from "./_memory.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const memories = await inspectMemories();
    const grouped = { active: [], superseded: [], forgotten: [] };
    for (const memory of memories) {
      if (grouped[memory.status]) grouped[memory.status].push(memory);
    }
    return res.status(200).json({ memories, grouped, total: memories.length });
  } catch (error) {
    console.error("Bluey memory inspection error", error);
    return res.status(500).json({ error: error?.message || "Could not inspect memory store" });
  }
}
