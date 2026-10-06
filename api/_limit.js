// Best-effort request limits for the OpenAI-backed endpoints. They live in memory, so
// they reset when Vercel starts a new instance: they stop casual abuse and runaway
// loops, not a determined attacker. The real cap is the monthly spend limit on the
// OpenAI account. The leading underscore keeps Vercel from serving this file as an endpoint.
const buckets = new Map();

export function overLimit(req, res, name, perHour, perDay) {
  const now = Date.now();
  let b = buckets.get(name);
  if (!b) buckets.set(name, b = { ips: new Map(), day: { count: 0, reset: now + 86400000 } });
  if (now > b.day.reset) b.day = { count: 0, reset: now + 86400000 };
  const ip = String(req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
  const h = b.ips.get(ip);
  let blocked = b.day.count >= perDay;
  if (!blocked) {
    if (!h || now > h.reset) b.ips.set(ip, { count: 1, reset: now + 3600000 });
    else if (h.count >= perHour) blocked = true;
    else h.count++;
  }
  if (blocked) {
    res.status(429).json({ error: "Bluey needs a little rest after so many messages. Please try again later." });
    return true;
  }
  b.day.count++;
  return false;
}

// Web search budget (searches cost more than plain replies). Checked before a chat request
// offers the search tool; counted only when the model actually searched.
const searches = { ips: new Map(), day: { count: 0, reset: 0 } };
const SEARCHES_PER_VISITOR_PER_DAY = 15, SEARCHES_PER_DAY = 300;
const visitor = req => String(req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
function searchDay() {
  const now = Date.now();
  if (now > searches.day.reset) { searches.day = { count: 0, reset: now + 86400000 }; searches.ips.clear(); }
}
export function searchAllowed(req) {
  searchDay();
  return searches.day.count < SEARCHES_PER_DAY && (searches.ips.get(visitor(req)) || 0) < SEARCHES_PER_VISITOR_PER_DAY;
}
export function noteSearch(req) {
  searchDay();
  searches.day.count++;
  searches.ips.set(visitor(req), (searches.ips.get(visitor(req)) || 0) + 1);
}
