// Media creation settings. Everything here can be changed with env vars in Vercel, so swapping a
// model or a daily limit never needs a code change. Provider code lives in _media-providers.js.

const num = (v, d) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : d; };

export const MEDIA = {
  // Pictures: OpenAI Image API. Model names checked against developers.openai.com on 2026-10-25:
  // gpt-image-2.5-flare = fast everyday generation, gpt-image-2.5-sunburst = best for precise edits.
  imageProvider: process.env.MEDIA_IMAGE_PROVIDER || "openai",
  imageModel: process.env.MEDIA_IMAGE_MODEL || "gpt-image-2.5-flare",
  imageEditModel: process.env.MEDIA_IMAGE_EDIT_MODEL || "gpt-image-2.5-sunburst",
  imageQuality: process.env.MEDIA_IMAGE_QUALITY || "medium", // low | medium | high | xhigh | max | auto

  // Per signed-in person, in any 24 hours. Failed tries don't count; deleted ones do.
  dailyImages: num(process.env.MEDIA_DAILY_LIMIT_IMAGE, 10),
  dailyVideos: num(process.env.MEDIA_DAILY_LIMIT_VIDEO, 2),

  // How long a link to a private file works before the app asks for a new one.
  linkSeconds: 60 * 60,
};

// US dollars per million tokens, for the cost estimate saved with each creation. GPT Image 2.5
// (both models), from the image generation guide on 2026-10-25.
export const IMAGE_RATES = { textIn: 5, imageIn: 8, imageOut: 30 };

// Picture shapes the brain can ask for, mapped to sizes the models accept.
export const IMAGE_SIZES = { square: "1024x1024", wide: "1536x1024", tall: "1024x1536" };
