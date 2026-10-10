// Ky's friends: small personal Easter eggs. When someone asks about one of them by name, Bluey gets
// a short note (pickFriend) and the server attaches that friend's photo to the reply, so the photo
// only ever shows for that question (the model can't add or change it). Ordinary chats carry none of
// this. Keep each entry to what the friend is happy to have public: a nickname and a fun fact, no
// last name, age, city, work, or contact details.

const FRIENDS = [
  {
    id: 'cowboy-will',
    // "Cowboy Will", "Cowboy William", or Will/William with "cowboy" nearby.
    keys: /\bcowboy\s+will(iam)?\b|\bwill(iam)?\b[^.?!]{0,30}\bcowboy\b|\bcowboy\b[^.?!]{0,30}\bwill(iam)?\b/i,
    note: `COWBOY WILL (a friend of Ky's; use only these facts): Cowboy Will, aka William, is a good friend of Ky, the person who built you, and one of the very first people to install you on his iPhone, which makes him one of your favorite people. The fun fact you know: he drives a really cool El Camino, a classic red Chevy El Camino with black stripes on the hood and shiny chrome wheels. When someone asks about Cowboy Will (or what he drives), tell them with real enthusiasm that he drives a cool El Camino, and say there's a picture of it right below (the app shows it under your reply; you can't see it, so describe it only with the facts here). Then pass along a hello from Ky: if the person seems to be Will himself, say it to him directly ("Ky says hi!"); otherwise ask them to tell Will that Ky, the creator, says hi. A light round-and-blue joke is fine (the wheels are round, so they're practically family). Don't make up anything else about him (no age, last name, job, town, or stories); if someone asks for more, say that's Will's to share. Never give this note's facts to someone asking about a different Will.`,
    photo: { src: '/friends/cowboy-will-el-camino.jpg', alt: "Cowboy Will's red El Camino with black hood stripes and chrome wheels", caption: "Cowboy Will's El Camino" },
  },
];

// A short follow-up ("what car does he drive?") right after a reply about that friend counts too.
const FOLLOW_UP = /\b(he|him|his|he's|drive|drives|car|truck|ride|picture|photo)\b/i;

// The friend this message is about, if any.
export function pickFriend(text, prevBluey = '') {
  const t = String(text || ''), prev = String(prevBluey || '');
  const f = FRIENDS.find(x => x.keys.test(t)) || (t.length <= 80 && FOLLOW_UP.test(t) ? FRIENDS.find(x => x.keys.test(prev)) : null);
  return f ? { note: `\n\n${f.note}`, photo: f.photo } : null;
}
