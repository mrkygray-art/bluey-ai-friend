// A quick second look at a picture or video prompt before anything is made: no real,
// identifiable people (the owner's rule until there's a written policy). The brain already
// follows this rule in chat; this check also covers requests that skip the chat.
// Fails open (logs and allows) if the check itself can't run, because the provider's own content
// rules still apply.

const CHECK = `You review prompts for a picture and video maker. Answer realPerson true when the prompt asks for the likeness of a specific real, identifiable person: a celebrity, politician, athlete, public figure, historical figure, or any person named as a real individual (for example "my neighbor Dave Smith"). Answer false for made-up or generic people ("a farmer", "an old woman reading", "a girl named Lily" in a story), fictional characters, and people only mentioned in passing without showing them. Also answer false when the prompt only edits a photo the user uploaded of themselves or people they know, without naming a public figure.`;

function outputText(data) {
  if (typeof data?.output_text === "string" && data.output_text) return data.output_text;
  for (const item of data?.output || []) for (const c of item?.content || []) if (typeof c?.text === "string") return c.text;
  return "";
}

export async function namesRealPerson(text) {
  try {
    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.MEDIA_CHECK_MODEL || process.env.BLUEY_MODEL || "gpt-6-luna",
        instructions: CHECK,
        input: String(text).slice(0, 4000),
        max_output_tokens: 600,
        text: { format: { type: "json_schema", name: "media_check", strict: true, schema: { type: "object", additionalProperties: false, properties: { realPerson: { type: "boolean" } }, required: ["realPerson"] } } },
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) { console.error("Bluey media check", r.status); return false; }
    return JSON.parse(outputText(await r.json()) || "{}").realPerson === true;
  } catch (e) {
    console.error("Bluey media check", e?.name || "error");
    return false;
  }
}
