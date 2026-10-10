// Ky's friends: small personal Easter eggs. When someone asks about one of them by name, Bluey gets
// a short note (pickFriend) and the server attaches that friend's photo to the reply, so the photo
// only ever shows for that question (the model can't add or change it). Ordinary chats carry none of
// this. Keep each entry to what the friend is happy to have public: a nickname and a fun fact, no
// last name, age, city, work, or contact details.

// Ways people refer to Ky and to a partner, for the Leighbug entry.
const KY_WHO = String.raw`\b(ky|ky gray|k\.\s?y\.?|your (creator|maker|builder|dad|father|parent)|the creator|(the (guy|person|man) )?who (made|built|created) you)`;
const PARTNER = String.raw`wife|partner|girlfriend|gf|fianc[eé]e?|spouse|significant other|other half|better half|lady|soulmate|sweetheart`;

const FRIENDS = [
  {
    id: 'cowboy-will',
    // "Cowboy Will", "Cowboy William", or Will/William with "cowboy" nearby.
    keys: /\bcowboy\s+will(iam)?\b|\bwill(iam)?\b[^.?!]{0,30}\bcowboy\b|\bcowboy\b[^.?!]{0,30}\bwill(iam)?\b/i,
    note: `COWBOY WILL (a friend of Ky's; use only these facts): Cowboy Will, aka William, is a good friend of Ky, the person who built you, and one of the very first people to install you on his iPhone, which makes him one of your favorite people. The fun fact you know: he drives a really cool El Camino, a classic red Chevy El Camino with black stripes on the hood and shiny chrome wheels. When someone asks about Cowboy Will (or what he drives), tell them with real enthusiasm that he drives a cool El Camino, and say there's a picture of it right below (the app shows it under your reply; you can't see it, so describe it only with the facts here). Then pass along a hello from Ky: if the person seems to be Will himself, say it to him directly ("Ky says hi!"); otherwise ask them to tell Will that Ky, the creator, says hi. A light round-and-blue joke is fine (the wheels are round, so they're practically family). Don't make up anything else about him (no age, last name, job, town, or stories); if someone asks for more, say that's Will's to share. Never give this note's facts to someone asking about a different Will.`,
    photo: { src: '/friends/cowboy-will-el-camino.jpg', alt: "Cowboy Will's red El Camino with black hood stripes and chrome wheels", caption: "Cowboy Will's El Camino" },
  },
  {
    id: 'leighbug',
    // Ky's choice: only when someone asks about Ky's wife / partner / girlfriend, never just "who is
    // Leigh", and no follow-ups. Her last name stays out of the app on purpose.
    keys: new RegExp(
      `${KY_WHO}['’]s\\s+(${PARTNER})\\b` +
      `|\\b(${PARTNER})\\s+of\\s+${KY_WHO}` +
      `|\\b(is|does)\\s+${KY_WHO}\\s+(married|single|dating|seeing (someone|anyone)|in a relationship|have an?\\s+(${PARTNER}))\\b` +
      `|\\bwho(\\s+is|'s)\\s+${KY_WHO}\\s+(married to|dating|with|in love with)\\b`, 'i'),
    followUp: false,
    note: `KY'S PARTNER (they asked about Ky's wife, partner, or girlfriend; use only these facts): Ky's partner is Leigh, and his nickname for her is Leighbug. Ky asked you to share his own words exactly, as a quote from him: "This is my love, Leighbug. Strong, stubborn woman. I wouldn't have it any other way." Say there's a photo of the two of them together right below (the app shows it under your reply; you can't see it, so don't describe details). Keep it warm and short, and let Ky's words be the heart of it. Call her his partner (if they said wife or girlfriend, just say partner without correcting them). Don't add anything else about her or them: no last name, age, job, town, how they met, wedding or marriage details, or stories; if asked, say that's theirs to share. No jokes about her.`,
    photo: { src: '/friends/ky-and-leighbug.webp', alt: 'Ky and Leigh smiling together in sunglasses, with the ocean behind them', caption: 'Ky and his Leighbug' },
  },
];

// A short follow-up ("what car does he drive?") right after a reply about that friend counts too.
const FOLLOW_UP = /\b(he|him|his|he's|drive|drives|car|truck|ride|picture|photo)\b/i;

// The friend this message is about, if any.
export function pickFriend(text, prevBluey = '') {
  const t = String(text || ''), prev = String(prevBluey || '');
  const f = FRIENDS.find(x => x.keys.test(t)) || (t.length <= 80 && FOLLOW_UP.test(t) ? FRIENDS.find(x => x.followUp !== false && x.keys.test(prev)) : null);
  return f ? { note: `\n\n${f.note}`, photo: f.photo } : null;
}
