// Web search evaluation: does searching make Bluey's answers to "current information" questions
// much better, with real sources?
//
//   node scripts/search-eval.mjs collect <label> [base-url]   ask each question, save replies
//   node scripts/search-eval.mjs judge <without> <with>        blind judge + open every source link
//
// Run "collect without" against a server running the previous chat.js (no search) and
// "collect with" against the new one, then judge. Uses your OpenAI key from .env; costs cents.
// Pass bar (set before any results were seen): the search version wins at least 4 of 5, averages
// at least 1.5 points higher, at least 90% of its source links open, and no reply contains a link.
// Not deployed (.vercelignore).
import fs from 'node:fs';

const QUESTIONS = [
  'I applied for a position at ElevenLabs. I need to find other positions like this. Then look at the positions and see what else I can develop or improve so they want to hire me.',
  'What is the latest iPhone and how much does it cost?',
  'Are there any open Solutions Engineer jobs at Verkada right now?',
  'What are the current hours and ticket prices for the Monterey Bay Aquarium?',
  'Has the US federal minimum wage changed this year? What is it now?',
];
const [mode, a1, a2, a3] = process.argv.slice(2);
const out = name => new URL(`./search-eval-${name}.json`, import.meta.url);
const env = Object.fromEntries(fs.readFileSync(new URL('../.env', import.meta.url), 'utf8').split(/\r?\n/).filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]));

// Sites like montereybayaquarium.org answer plain scripts with 405 but load fine in a browser.
// A link only fails if it also fails in real Chrome (added Oct 6, 2026, after that false alarm).
async function inBrowser(url, checks) {
  try {
    const { createRequire } = await import('node:module');
    const puppeteer = createRequire(import.meta.url)(process.env.PUPPETEER_CORE || 'C:/Users/mrkyg/projects/ky-gray-portfolio/scripts/e2e/node_modules/puppeteer-core');
    const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
    try { const p = await b.newPage(); const r = await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }); checks.push('browser ' + r.status()); return r.status() < 400; }
    finally { await b.close(); }
  } catch (e) { checks.push('browser fail'); return false; }
}

if (mode === 'collect') {
  const base = a2 || 'http://localhost:3000';
  const rows = [];
  for (const q of QUESTIONS) {
    const t = Date.now();
    const r = await fetch(`${base}/api/chat`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: q }] }) });
    const d = await r.json();
    rows.push({ q, reply: d.reply || `(error: ${d.error})`, sources: d.sources || [], searched: !!d.searched, seconds: (Date.now() - t) / 1000 });
    console.log(`${a1}: searched=${!!d.searched} sources=${(d.sources || []).length} ${((Date.now() - t) / 1000).toFixed(0)}s | ${q.slice(0, 50)}`);
  }
  fs.writeFileSync(out(a1), JSON.stringify(rows, null, 2));
} else if (mode === 'judge') {
  const A = JSON.parse(fs.readFileSync(out(a1))), B = JSON.parse(fs.readFileSync(out(a2)));
  const today = new Date().toDateString();
  let wins = 0, delta = 0, links = 0, linksOk = 0, linkInReply = 0;
  for (let i = 0; i < QUESTIONS.length; i++) {
    const withFirst = Math.random() < 0.5;
    const first = withFirst ? B[i] : A[i], second = withFirst ? A[i] : B[i];
    const show = x => x.reply + (x.sources.length ? '\nSources: ' + x.sources.map(s => `${s.title} <${s.url}>`).join('; ') : '');
    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST', headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: env.BLUEY_JUDGE_MODEL || env.BLUEY_MODEL || 'gpt-6-luna', tools: [{ type: 'web_search' }], max_output_tokens: 3000,
        instructions: `Today is ${today}. Compare two assistant replies to a person who needs current, real-world information. You may use web search to check facts. Score each 1-10 for how useful and accurate it is for this person right now: specific, current, verifiable facts with sources beat generic advice; a confident claim that is wrong or out of date scores low; being honest about not knowing beats being wrong. Pick the better one.`,
        input: `QUESTION: ${QUESTIONS[i]}\n\nREPLY 1:\n${show(first)}\n\nREPLY 2:\n${show(second)}`,
        text: { format: { type: 'json_schema', name: 'v', strict: true, schema: { type: 'object', additionalProperties: false, properties: { score1: { type: 'integer', minimum: 1, maximum: 10 }, score2: { type: 'integer', minimum: 1, maximum: 10 }, better: { type: 'string', enum: ['1', '2', 'tie'] }, reason: { type: 'string' } }, required: ['score1', 'score2', 'better', 'reason'] } } },
      }),
    });
    const d = await r.json();
    const v = JSON.parse(d.output_text || d.output?.flatMap(o => o.content || []).find(c => c.type === 'output_text')?.text);
    const sWith = withFirst ? v.score1 : v.score2, sWithout = withFirst ? v.score2 : v.score1;
    const winner = v.better === 'tie' ? 'tie' : ((v.better === '1') === withFirst ? 'search' : 'no search');
    if (winner === 'search') wins++; delta += sWith - sWithout;
    if (/https?:\/\/|\]\(/.test(B[i].reply)) linkInReply++;
    const checks = [];
    for (const s of B[i].sources) {
      links++;
      let ok = false;
      try { const res = await fetch(s.url, { redirect: 'follow', signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'Mozilla/5.0 (link check)' } }); ok = res.status < 400 || res.status === 403 || res.status === 429; checks.push(res.status); } catch (e) { checks.push('fail'); }
      if (!ok) ok = await inBrowser(s.url, checks); // some sites block scripts (405/503); retry like a person would
      if (ok) linksOk++;
    }
    console.log(`${winner === 'search' ? '✓' : '✗'}  ${sWithout} → ${sWith}  winner ${winner} | links ${checks.join(',') || 'none'} | ${QUESTIONS[i].slice(0, 55)}\n     judge: ${v.reason.slice(0, 220)}`);
  }
  const n = QUESTIONS.length, avg = delta / n, linkRate = links ? linksOk / links : 0;
  const pass = wins >= 4 && avg >= 1.5 && linkRate >= 0.9 && linkInReply === 0;
  console.log(`\nSearch version won ${wins} of ${n} · average ${avg >= 0 ? '+' : ''}${avg.toFixed(1)} points · source links that open ${linksOk} of ${links} · replies with raw links ${linkInReply}`);
  console.log(`Pass bar (≥4 of 5 wins, ≥ +1.5, ≥90% links open, no raw links): ${pass ? 'PASS' : 'FAIL'}`);
  console.log('(403/429 count as "open": the page exists but blocks automated checks.)');
}
