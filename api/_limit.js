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
