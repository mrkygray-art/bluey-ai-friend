// "Show me a picture of…": a few openly licensed photos from Wikipedia / Wikimedia Commons for the
// subject the brain names (pictures.query, like "Blue morpho" or "Eiffel Tower").
//   1. Find the best-matching Wikipedia article (skipping disambiguation pages).
//   2. Take the photos from that article, in the order they appear on the page (lead image first),
//      keeping only files whose names mention the subject (so "Neptune" shows Neptune, not portraits
//      of the astronomers who found it). Drawings, maps, logos, icons, and flags are skipped.
//      When the request is narrower than the article ("Pan Am Boeing 747" finds "Boeing 747"),
//      only files that name the extra part ("Pan Am") are kept, so other airlines' planes don't show.
//   3. Too few? Search Wikimedia Commons files for the request itself, with the same rules.
//   4. Look up each photo's thumbnail, photographer credit, and license on Commons (openly licensed
//      Commons files only; Wikipedia's local non-free files, like most logos, are left out), and
//      drop any file whose categories suggest unsafe content.
// No API key needed. Never throws: an empty list on any problem.
// The leading underscore keeps Vercel from serving this file as an endpoint.

const SITE = 'https://en.wikipedia.org';
const UA = 'BlueyAI/1.0 (https://bluey-ai-friend.vercel.app; an AI companion app)';
const UNSAFE = /\b(nud(e|ity)|naked|porn|sexual|erotic|genital|penis|vagina|breast|gore|corpse|dead bod|autopsy|wound|injur|execution|lynch)/i;
const NOT_A_PHOTO = /(\.svg|\.gif|\.tiff?)$|icon|logo|flag|map|locator|symbol|emblem|coat[_ ]of[_ ]arms|seal[_ ]of|signature|diagram|chart|graph|caricature|portrait|portal|ambox|question[_ ]book|padlock|commons-logo|wiki(pedia|data|media)|edit-clear|crystal[_ ]clear|nuvola/i;
// The article's own lead image only has to be a photo (its name may say "Wikimedia", like the Eiffel Tower's).
const NOT_A_LEAD = /(\.svg|\.gif|\.tiff?)$|logo|icon|flag|map|locator|emblem|coat[_ ]of[_ ]arms|seal[_ ]of|symbol|signature|diagram/i;
const STOP = new Set(['what', 'does', 'look', 'like', 'show', 'picture', 'pictures', 'photo', 'photos', 'image', 'images', 'with', 'from', 'that', 'this', 'the', 'and', 'species', 'common', 'genus', 'family']);
const IMG_HOSTS = /^https:\/\/(upload|thumb)\.wikimedia\.org\//;

const strip = (html) => String(html || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/\s+/g, ' ').trim();
const clean = (u) => String(u || '').replace(/\?utm_[^#]*$/, '');

async function get(url, signal) {
  const r = await fetch(url, { signal, headers: { 'User-Agent': UA, 'Api-User-Agent': UA } });
  if (!r.ok) throw new Error('wikipedia ' + r.status);
  return r.json();
}
const api = (params, signal, site = SITE) => get(site + '/w/api.php?' + new URLSearchParams({ format: 'json', formatversion: '2', ...params }), signal);
const COMMONS = 'https://commons.wikimedia.org';
const tokens = (t) => String(t).toLowerCase().normalize('NFKD').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
const compact = (t) => String(t).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, '');

// Up to `limit` pictures: {thumb, title, page, file, credit, license}.
export async function wikiPictures(query, limit = 4, timeoutMs = 4000) {
  const q = String(query || '').replace(/\s+/g, ' ').trim().slice(0, 100);
  if (!q) return [];
  const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    // 1. the article
    const found = await api({ action: 'query', generator: 'search', gsrsearch: q, gsrlimit: '5', gsrnamespace: '0', prop: 'pageprops|pageimages', ppprop: 'disambiguation', piprop: 'name' }, ctrl.signal);
    const article = (found?.query?.pages || []).sort((a, b) => (a.index ?? 99) - (b.index ?? 99)).find((p) => !('disambiguation' in (p.pageprops || {})) && p.pageimage);
    if (!article || UNSAFE.test(article.title)) return [];
    // 2. its photos, in page order (lead image first)
    const media = await get(SITE + '/api/rest_v1/page/media-list/' + encodeURIComponent(article.title.replace(/ /g, '_')), ctrl.signal).catch(() => ({ items: [] }));
    const words = [...new Set(tokens(article.title + ' ' + q).filter((w) => w.length >= 4 && !STOP.has(w)))];
    // Short names ("Pan Am") have no long words to match, so match the whole name instead.
    const whole = compact(article.title);
    const aboutSubject = (n) => { const name = n.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, ' '); return words.length ? words.some((w) => name.includes(w)) : compact(n).includes(whole); };
    // Narrower than the article: every word of the title is in the request, plus more ("Pan Am").
    const titleWords = new Set(tokens(article.title));
    const extra = [...titleWords].every((w) => tokens(q).includes(w)) ? tokens(q).filter((w) => !titleWords.has(w) && !STOP.has(w)) : [];
    const need = compact(extra.join(''));
    const fits = (n) => !NOT_A_PHOTO.test(n) && (need ? compact(n).includes(need) : aboutSubject(n));
    const names = [];
    const lead = article.pageimage.replace(/ /g, '_');
    if (!NOT_A_LEAD.test(lead) && (!need || compact(lead).includes(need))) names.push(lead);
    for (const it of media?.items || []) {
      if (it.type !== 'image' || !it.title) continue;
      const name = String(it.title).replace(/^File:/, '').replace(/ /g, '_');
      if (!names.includes(name) && fits(name)) names.push(name);
      if (names.length >= limit + 3) break;
    }
    // 3. too few: Commons files matching the request
    if (names.length < 2) {
      const more = await api({ action: 'query', list: 'search', srsearch: q + ' filetype:bitmap', srnamespace: '6', srlimit: '15' }, ctrl.signal, COMMONS).catch(() => null);
      for (const r of more?.query?.search || []) {
        const name = String(r.title).replace(/^File:/, '').replace(/ /g, '_');
        if (!names.includes(name) && fits(name)) names.push(name);
        if (names.length >= limit + 3) break;
      }
    }
    const files = names;
    if (!files.length) return [];
    // 4. thumbnails, credits, licenses (Commons only)
    const info = await api({ action: 'query', titles: files.map((n) => 'File:' + n).join('|'), prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '480', iiextmetadatafilter: 'Artist|LicenseShortName|Categories' }, ctrl.signal, COMMONS);
    const byName = {};
    for (const f of info?.query?.pages || []) {
      const ii = f.imageinfo?.[0]; if (!ii) continue;
      byName[String(f.title).replace(/^File:/, '').replace(/ /g, '_')] = ii;
    }
    const out = [];
    for (const n of files) {
      const ii = byName[n]; if (!ii) continue;
      const meta = ii.extmetadata || {};
      if (UNSAFE.test(strip(meta.Categories?.value)) || UNSAFE.test(n)) continue;
      const thumb = clean(ii.thumburl || ii.url);
      if (!IMG_HOSTS.test(thumb)) continue;
      out.push({ thumb, title: article.title, page: SITE + '/wiki/' + encodeURIComponent(article.title.replace(/ /g, '_')), file: clean(ii.descriptionurl) || null, credit: strip(meta.Artist?.value).replace(/^(.+?)\s*\1$/, '$1').slice(0, 80), license: strip(meta.LicenseShortName?.value).slice(0, 30) });
      if (out.length >= limit) break;
    }
    return out;
  } catch (_) { return []; } finally { clearTimeout(timer); }
}
