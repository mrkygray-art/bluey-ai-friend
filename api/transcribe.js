import formidable from "formidable";
import fs from "fs";
import OpenAI from "openai";

export const config = { api: { bodyParser: false } };

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({
      multiples: false,
      maxFiles: 1,
      maxFileSize: 20 * 1024 * 1024,
      allowEmptyFiles: false
    });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

function firstFile(v) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.OPENAI_API_KEY) {
    console.error("Bluey transcription: OPENAI_API_KEY missing");
    return res.status(503).json({ error: "Transcription temporarily unavailable" });
  }

  let tempPath;
  try {
    const { fields, files } = await parseForm(req);
    const audio = firstFile(files.audio);
    const durationMs = Array.isArray(fields.duration_ms) ? fields.duration_ms[0] : fields.duration_ms;
    if (!audio?.filepath) {
      console.error("Bluey transcription: no audio file in multipart upload", Object.keys(files || {}));
      return res.status(400).json({ error: "No audio received" });
    }

    tempPath = audio.filepath;
    const stat = await fs.promises.stat(tempPath);
    console.log("Bluey transcription upload", {
      bytes: stat.size,
      mimetype: audio.mimetype,
      filename: audio.originalFilename,
      durationMs: durationMs || null
    });
    if (stat.size < 500) return res.status(400).json({ error: "Audio recording was too short" });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const result = await client.audio.transcriptions.create({
      file: fs.createReadStream(tempPath),
      model: process.env.BLUEY_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe",
      response_format: "json"
    });

    const text = typeof result?.text === "string" ? result.text.trim() : "";
    if (!text) {
      console.error("Bluey transcription: API returned no text", result);
      return res.status(422).json({ error: "No speech detected" });
    }

    console.log("Bluey transcription success", { characters: text.length });
    return res.status(200).json({ text });
  } catch (e) {
    console.error("Bluey transcription server error", {
      name: e?.name,
      message: e?.message,
      status: e?.status,
      code: e?.code,
      type: e?.type
    });
    return res.status(e?.status || 500).json({
      error: "Transcription temporarily unavailable"
    });
  } finally {
    if (tempPath) fs.promises.unlink(tempPath).catch(() => {});
  }
}