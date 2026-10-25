// Media providers behind one small interface, so a provider or model can be swapped in config
// (_media-config.js / env vars) without touching the routes.
//
// ImageProvider:
//   generate({prompt, size, userId}) -> {bytes: Buffer, mime, model, costEstimate}
//   edit({source: {bytes, mime}, instruction, mask?, userId}) -> same           (step 3)
// VideoProvider (step 4):
//   create({prompt, imageUrl?, durationSec?}) -> {jobId}
//   status(jobId) -> {state: queued|running|done|failed, progress?, url?, error?}
//   revise?({sourceVideoUrl, instruction}) -> {jobId}   only if the model can truly edit video
//
// Errors are thrown as MediaError with a `kind`: "refused" (the provider's content rules said no),
// "busy" (rate limit or overload), or "failed". Routes turn those into friendly words.
import { createHash } from "node:crypto";
import { MEDIA, IMAGE_RATES } from "./_media-config.js";

export class MediaError extends Error {
  constructor(kind, message) { super(message); this.kind = kind; }
}

// A stable, private id for the provider's abuse checks (a hash, never the account id itself).
const safetyId = userId => createHash("sha256").update("bluey-media:" + userId).digest("hex").slice(0, 64);

function imageCost(usage) {
  if (!usage) return null;
  const inText = usage.input_tokens_details?.text_tokens ?? 0;
  const inImage = usage.input_tokens_details?.image_tokens ?? 0;
  const out = usage.output_tokens ?? 0;
  return Math.round(((inText * IMAGE_RATES.textIn + inImage * IMAGE_RATES.imageIn + out * IMAGE_RATES.imageOut) / 1e6) * 10000) / 10000;
}

async function openaiError(r) {
  let err = {};
  try { err = (await r.json())?.error || {}; } catch (_) {}
  const code = String(err.code || err.type || "");
  console.error("Bluey media provider", "openai", r.status, code);
  if (/moderation|safety|content_policy/i.test(code)) return new MediaError("refused", "The picture service said no to this one.");
  if (r.status === 429 || r.status >= 500) return new MediaError("busy", "The picture service is busy.");
  return new MediaError("failed", "The picture service couldn't make this one.");
}

const openaiImage = {
  name: "openai",
  async generate({ prompt, size, userId }) {
    const model = MEDIA.imageModel;
    let r;
    try {
      r = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt, size, quality: MEDIA.imageQuality, n: 1, output_format: "jpeg", output_compression: 90, safety_identifier: safetyId(userId) }),
        signal: AbortSignal.timeout(170000),
      });
    } catch (e) {
      console.error("Bluey media provider", "openai", e?.name || "error");
      throw new MediaError("busy", "The picture service took too long.");
    }
    if (!r.ok) throw await openaiError(r);
    const data = await r.json();
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) throw new MediaError("failed", "The picture service sent back nothing.");
    return { bytes: Buffer.from(b64, "base64"), mime: "image/jpeg", model, costEstimate: imageCost(data.usage) };
  },
};

const IMAGE_PROVIDERS = { openai: openaiImage };

export function imageProvider() {
  const p = IMAGE_PROVIDERS[MEDIA.imageProvider];
  if (!p) throw new Error(`Unknown MEDIA_IMAGE_PROVIDER: ${MEDIA.imageProvider}`);
  return p;
}
