// Picture previews for Sources: after a web search, read each source page's own preview image
// (og:image / twitter:image, the picture a link preview shows) so the Sources list can show a
// thumbnail. Only the pages Bluey actually used, only public http(s) addresses, a short time
// limit, and at most ~300 KB read per page. Never used for scam checks (chat.js skips it).
// The leading underscore keeps Vercel from serving this file as an endpoint.

const MAX_BYTES = 300 * 1024;
const UA = 'Mozilla/5.0 (compatible; BlueyPreview/1.0; +https://bluey-ai-friend.vercel.app)';

// Public hosts only: no localhost, private networks, or bare internal names.
export function isPublicHost(host) {
  const h = String(host || '').toLowerCase().replace(/^\[|\]$/g, '');
  if (!h || !h.includes('.') && !h.includes(':')) return false;
  if (/^(localhost|.*\.local|.*\.internal|.*\.localhost)$/.test(h)) return false;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) {
    const [a, b] = h.split('.').map(Number);
    if (a === 10 || a === 127 || a === 0 || a >= 224) return false;
    if (a === 169 && b === 254) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
    if (a === 100 && b >= 64 && b <= 127) return false;
  }
  if (h.includes(':')) {
    if (h === '::1' || h === '::' || /^f[cd]/.test(h) || /^fe80/.test(h)) return false;
  }
  return true;
}

async function readStart(response) {
  const reader = response.body?.getReader?.();
  if (!reader) return (await response.text()).slice(0, MAX_BYTES);
  const chunks = []; let size = 0;
  while (size < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value); size += value.length;
    // The preview tags live in <head>; stop once it's over.
    if (Buffer.concat(chunks).toString('utf8').includes('</head>')) break;
  }
  try { await reader.cancel(); } catch (_) {}
  return Buffer.concat(chunks).toString('utf8').slice(0, MAX_BYTES);
}

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#x2F;/gi, '/').replace(/&#47;/g, '/').replace(/&quot;/g, '"').trim();

export function findPreview(html, pageUrl) {
  const head = html.split(/<\/head>/i)[0];
  const metas = head.match(/<meta\b[^>]*>/gi) || [];
  const want = ['og:image:secure_url', 'og:image', 'og:image:url', 'twitter:image', 'twitter:image:src'];
  const found = {};
  for (const tag of metas) {
    const key = (tag.match(/\b(?:property|name)\s*=\s*["']([^"']+)["']/i) || [])[1];
    const content = (tag.match(/\bcontent\s*=\s*["']([^"']+)["']/i) || [])[1];
    if (key && content && want.includes(key.toLowerCase()) && !found[key.toLowerCase()]) found[key.toLowerCase()] = decode(content);
  }
  let src = want.map((k) => found[k]).find(Boolean);
  if (!src) src = decode((head.match(/<link\b[^>]*rel\s*=\s*["']image_src["'][^>]*href\s*=\s*["']([^"']+)["']/i) || [])[1] || '');
  if (!src) return null;
  try {
    const u = new URL(src, pageUrl);
    if (u.protocol !== 'https:' || !isPublicHost(u.hostname) || u.href.length > 600) return null;
    return u.href;
  } catch (_) { return null; }
}

async function previewFor(url, deadline) {
  let current = url;
  for (let hop = 0; hop < 4; hop++) {
    let u; try { u = new URL(current); } catch (_) { return null; }
    if (!/^https?:$/.test(u.protocol) || !isPublicHost(u.hostname)) return null;
    const left = deadline - Date.now(); if (left < 150) return null;
    const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), left);
    try {
      const r = await fetch(u.href, { redirect: 'manual', signal: ctrl.signal, headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' } });
      if (r.status >= 300 && r.status < 400 && r.headers.get('location')) { current = new URL(r.headers.get('location'), u.href).href; continue; }
      if (!r.ok || !/html/i.test(r.headers.get('content-type') || '')) return null;
      return findPreview(await readStart(r), u.href);
    } catch (_) { return null; } finally { clearTimeout(timer); }
  }
  return null;
}

// Adds `image` to each source that has a preview; never slows the reply by more than ~3 seconds.
export async function addPreviews(sources, timeoutMs = 3000) {
  const deadline = Date.now() + timeoutMs;
  const images = await Promise.all(sources.map((s) => previewFor(s.url, deadline).catch(() => null)));
  return sources.map((s, i) => (images[i] ? { ...s, image: images[i] } : s));
}
