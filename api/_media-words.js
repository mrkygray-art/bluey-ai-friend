// What Bluey says when making a picture or video doesn't go to plan, plus small text helpers
// shared by the media routes. Plain, warm, short (see Tone in CLAUDE.md).

export const SAY = {
  notReady: "Making pictures isn't switched on here yet.",
  signIn: "I make pictures for people who are signed in, so I can keep them safe for you. Tap the blue + and choose Sign in, then ask me again.",
  empty: "Tell me what you'd like a picture of, and I'll paint it.",
  realPerson: "I don't make pictures of real people, like famous folks or anyone by name. I'd love to make a made-up character instead. Want to try that?",
  imageLimit: n => `That's all the pictures I can make today (${n} a day). My paintbrush needs a rest! Come back tomorrow and we'll make more.`,
  videoLimit: n => `That's all the videos I can make today (${n} a day). Videos take a lot out of me! Come back tomorrow for more.`,
  refused: "My picture maker said no to that one. It has rules about what it will make. Want to try a different idea?",
  busy: "My picture maker is very busy right now. Give it a minute and try again? That one didn't count toward today's pictures.",
  failed: "Something went wrong while I was making that. It didn't count toward today's pictures, so try again in a moment.",
  storeDown: "I couldn't reach the place I keep your pictures just now. Please try again in a moment.",
  notFound: "I couldn't find that picture. It may have been deleted.",
};

export const clean = (v, max) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

// Used only when a request comes without the prompt Bluey wrote in chat.
export const photoPrompt = words => `A photorealistic photograph of ${words}. Natural light, true-to-life colors and textures, sharp focus, shot on a full-frame camera with a 50mm lens. A real photograph, not an illustration or painting.`;
