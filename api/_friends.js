// Ky's friends: small personal Easter eggs. When someone asks about one of them by name, Bluey gets
// a short note (pickFriend) and the server attaches that friend's photo to the reply, so the photo
// only ever shows for that question (the model can't add or change it). Ordinary chats carry none of
// this. Keep each entry to what the friend is happy to have public: a nickname and a fun fact, no
// last name, age, city, work, or contact details.

// Ways people refer to Ky and to a partner, for the Leighbug entry.
const KY_WHO = String.raw`\b(ky|ky gray|k\.\s?y\.?|your (creator|maker|builder|dad|father|parent)|the creator|(the (guy|person|man) )?who (made|built|created) you)`;
// Ky's mom: Kathy Biagi.
const KATHY = String.raw`\b(kathy|kathleen|kathryn|katherine)\s+biagi\b`;
// Ky's dad: Jim Gray, Judge Jim Gray, James Gray (James P. Gray).
const JIM = String.raw`\b(judge\s+)?(jim|jimmy|james)\s+(p\.?\s+)?gray\b`;
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
    // Seen in Bluey's last reply: "show me another one" right after it counts as asking again.
    shown: /\bleighbug\b/i,
    note: `KY'S PARTNER (they asked about Ky's wife, partner, or girlfriend; use only these facts): Ky's partner is Leigh (it rhymes with "sleigh"), and his nickname for her is Leighbug. Ky asked you to share his own words exactly, as a quote from him: "This is my love, Leighbug. Strong, stubborn woman. I wouldn't have it any other way." Say there's a photo right below (the app shows one of several photos Ky shared, with an "Another photo" button; you can't see them, so don't describe details). Keep it warm and short, and let Ky's words be the heart of it. Call her his partner (if they said wife or girlfriend, just say partner without correcting them). Don't add anything else about her or them: no last name, age, job, town, how they met, wedding or marriage details, or stories; if asked, say that's theirs to share. No jokes about her.`,
    more: `They asked for another photo of Ky and Leighbug. Say here's another one in one short, warm line (don't repeat Ky's whole quote, and don't describe the photo; you can't see it).`,
    photos: [
      { src: '/friends/ky-and-leighbug.webp', alt: 'Ky and Leigh smiling together in sunglasses, with the ocean behind them', caption: 'Ky and his Leighbug' },
      { src: '/friends/leighbug-dinner.jpg', alt: 'Ky and Leigh smiling at a dinner table', caption: 'Ky and Leighbug, dinner out' },
      { src: '/friends/leighbug-road-trip.jpg', alt: 'Ky and Leigh grinning in sunglasses on a road trip, Leigh driving', caption: 'Road trip with Leighbug at the wheel' },
      { src: '/friends/leighbug-aladdin.jpg', alt: 'Ky and Leigh with a golden lamp in front of an Aladdin musical poster', caption: 'Ky and Leighbug at Aladdin' },
      { src: '/friends/leighbug-mirror.jpg', alt: 'Leigh smiling in a green flowered dress and tall black boots', caption: 'Leighbug, all dressed up' },
      { src: '/friends/leighbug-horns.jpg', alt: 'Leigh smiling in big black costume horns and red lipstick', caption: 'Leighbug in her costume horns' },
      { src: '/friends/leighbug-halloween.jpg', alt: 'Ky in a curly wig and suspenders making a silly face next to Leigh in horns and wings', caption: 'Ky and Leighbug, dressed up for Halloween' },
    ],
  },
  {
    id: 'mary',
    // Only when the question ties Mary to Ky ("Ky's friend Mary Miller", "Mary Miller ... Ky"): a
    // plain "who is Mary Miller" is usually about someone else (there's a congresswoman by that name).
    keys: new RegExp(
      `${KY_WHO}['’]s\\s+((dear|best|good|old|close)\\s+)?friends?\\s+mary\\b` +
      `|\\bmary\\s+miller\\b[^.?!]{0,40}${KY_WHO}\\b|${KY_WHO}\\b[^.?!]{0,40}\\bmary\\s+miller\\b`, 'i'),
    followUp: false,
    note: `KY'S DEAR FRIEND MARY (they asked about Ky's friend Mary; use only these facts): Mary is one of Ky's dearest friends. Ky asked you to share his own message to Mary, word for word, as a quote from him: "My dear friend. You kept me going. All our weird convos kept me afloat. Love you... Hooker." ("Hooker" is Ky's affectionate inside-joke nickname for Mary, and Mary is in on it; quote it as written, don't explain it, comment on it, or use it yourself.) Say there's a photo of Ky and Mary right below (the app shows it; you can't see it, so don't describe details). Keep it warm and short, and let Ky's words be the heart of it. Call her Mary (no last name). Don't add anything else about Mary: no age, job, town, how they met, or stories; if asked, say that's Mary's to share.`,
    photos: [
      { src: '/friends/ky-and-mary.jpg', alt: 'Mary and Ky grinning and pointing at each other in a goofy selfie', caption: 'Ky and Mary' },
    ],
  },
  {
    id: 'dad',
    // Only when the question ties Jim Gray to Ky ("Does Ky know Jim Gray / Judge Jim Gray / James
    // Gray?"): those names alone usually mean the public figure (or the film director).
    keys: new RegExp(`${JIM}[^?!]{0,60}${KY_WHO}\\b|${KY_WHO}\\b[^?!]{0,60}${JIM}`, 'i'),
    followUp: false,
    shown: /proud to be your son/i,
    note: `KY'S DAD (they asked whether Ky knows Jim Gray; use only these facts): Judge Jim Gray (James Gray) is Ky's dad. Ky asked you to share his own words, exactly, as a quote from him: "This is my Dad, who means the world to me. He and my Mom adopted me during the Vietnam War. Words can't express the connection and love I have for you. Proud to be your son." Say yes warmly (he doesn't just know him, that's his dad), share Ky's words as the heart of the answer, and say there are photos right below (the app shows them with an "Another photo" button; you can't see them, so don't describe details). Don't add anything else about Jim Gray, Ky's mom, the adoption, or the family (no career details, politics, places, or stories), and don't search the web for this answer. If they ask for more, say that's Ky's family's to share.`,
    more: `They asked for another photo of Ky's dad, Jim Gray. Say here's another one in one short, warm line (don't repeat Ky's whole quote, and don't describe the photo; you can't see it).`,
    photos: [
      { src: '/friends/dad-jim-gray-courtroom.jpg', alt: 'Judge Jim Gray speaking into a microphone in a wood-paneled courtroom', caption: "Ky's dad, Judge Jim Gray" },
      { src: '/friends/dad-jim-gray-speaking.jpg', alt: 'Jim Gray in a suit giving a talk at a college podium', caption: 'Jim Gray, speaking' },
      { src: '/friends/dad-jim-gray-hiking.jpg', alt: 'Jim Gray and family smiling together in hiking gear in a red-rock canyon', caption: 'A family hike' },
    ],
  },
  {
    id: 'mom',
    // Only when the question ties Kathy Biagi to Ky ("Does Ky know Kathy Biagi?").
    keys: new RegExp(`${KATHY}[^?!]{0,60}${KY_WHO}\\b|${KY_WHO}\\b[^?!]{0,60}${KATHY}`, 'i'),
    followUp: false,
    shown: /become the man I am today/i,
    note: `KY'S MOM (they asked whether Ky knows Kathy Biagi; use only these facts): Kathy is Ky's mom. Ky asked you to share his own words, exactly, as a quote from him: "This is my Mom. Thank you for helping me become the man I am today. I am so happy we have the relationship we have. I love you." Say yes warmly (he doesn't just know her, that's his mom), share Ky's words as the heart of the answer, and say there are photos right below (the app shows them with an "Another photo" button; you can't see them, so don't describe details). Call her Kathy or Ky's mom. Don't add anything else about her or the family (no age, job, town, other names, or stories), and don't search the web for this answer. If they ask for more, say that's Ky's family's to share.`,
    more: `They asked for another photo of Ky's mom, Kathy. Say here's another one in one short, warm line (don't repeat Ky's whole quote, and don't describe the photo; you can't see it).`,
    photos: [
      { src: '/friends/mom-kathy-painting.jpg', alt: 'Kathy smiling on a sofa, holding up a framed painting of sailboats', caption: "Ky's mom, Kathy" },
      { src: '/friends/mom-kathy-family-dinner.jpg', alt: 'Kathy, Ky, and family smiling around a table at an outdoor restaurant', caption: 'Family dinner' },
      { src: '/friends/mom-kathy-patio.jpg', alt: 'Kathy smiling with her hands on the shoulders of a man seated on a sunny garden patio', caption: 'Kathy on the patio' },
      { src: '/friends/mom-kathy-dressed-up.jpg', alt: 'Kathy in a blue dress, smiling with family at a dressed-up evening event', caption: 'All dressed up with family' },
    ],
  },
];

// A short follow-up ("what car does he drive?") right after a reply about that friend counts too.
const FOLLOW_UP = /\b(he|him|his|he's|drive|drives|car|truck|ride|picture|photo)\b/i;
// "Show me another one" / "more pictures" right after a friend's photo.
const MORE = /\b(another|more|next|different|other|new)\b[^.?!]{0,20}\b(one|ones|pics?|pictures?|photos?)\b|\bshow me (more|another)\b/i;

// The friend this message is about, if any. Each friend has photos (Will's one photo counts as a
// list of one); the browser picks which to show and rotates through them.
export function pickFriend(text, prevBluey = '') {
  const t = String(text || ''), prev = String(prevBluey || ''), short = t.length <= 80;
  let f = FRIENDS.find(x => x.keys.test(t)), more = false;
  if (!f && short && MORE.test(t)) { f = FRIENDS.find(x => (x.shown || x.keys).test(prev)); more = !!f; }
  if (!f && short && FOLLOW_UP.test(t)) f = FRIENDS.find(x => x.followUp !== false && x.keys.test(prev));
  if (!f) return null;
  const photos = f.photos || [f.photo];
  return { note: `\n\n${more && f.more ? f.more : f.note}`, id: f.id, photos, photo: photos[0], more };
}
