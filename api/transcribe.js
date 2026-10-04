import formidable from "formidable";
import fs from "fs";

export const config = { api: { bodyParser: false } };

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({
      multiples: false,
      maxFiles: 1,
      maxFileSize: 20 * 1024 * 1024,
      allowEmptyFiles: false,
    });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

function firstFile(value) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.OPENAI_API_KEY) {
    console.error("Bluey transcription: OPENAI_API_KEY missing");
    return res.status(503).json({ error: "Transcription is temporarily unavailable" });
  }

  let tempPath;
  try {
    const { files } = await parseForm(req);
    const audio = firstFile(files.audio);
    if (!audio?.filepath) return res.status(400).json({ error: "No audio received" });

    tempPath = audio.filepath;
    const bytes = await fs.promises.readFile(audio.filepath);
    if (!bytes.length) return res.status(400).json({ error: "Empty audio received" });

    const mime = audio.mimetype || "audio/webm";
    const original = audio.originalFilename || (mime.includes("mp4") ? "bluey.m4a" : "bluey.webm");

    const body = new FormData();
    body.append("file", new Blob([bytes], { type: mime }), original);
    body.append("model", process.env.BLUEY_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe");
    body.append("response_format", "json");

    const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body,
    });

    const raw = await r.text();
    let data = {};
    try { data = JSON.parse(raw); } catch {}

    if (!r.ok) {
      console.error("OpenAI transcription error", r.status, raw);
      return res.status(r.status).json({ error: "Transcription is temporarily unavailable" });
    }

    const text = typeof data.text === "string" ? data.text.trim() : "";
    if (!text) return res.status(422).json({ error: "No speech detected" });

    return res.status(200).json({ text });
  } catch (e) {
    console.error("Bluey transcription server error", e);
    return res.status(500).json({ error: "Transcription is temporarily unavailable" });
  } finally {
    if (tempPath) fs.promises.unlink(tempPath).catch(() => {});
  }
}