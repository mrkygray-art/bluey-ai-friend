// Hand-off kit evaluation: does Bluey's super prompt get much better results than the person's
// own words, and does he pick a sensible platform?
//
// For each bigger request (with the background a real person would know):
//   A = a capable assistant's answer to the person's original words.
//   B = the same assistant's answer to Bluey's super prompt, with [blanks] filled from the
//       background (only what each blank asks, like a person would).
// The stand-in assistant is an OpenAI model with no Bluey instructions: we can't run Claude
// Code, Codex, or Gemini's video tool from a script, so this measures the prompt, not the
// platform. A blind judge scores A and B (1-10) and rates Bluey's platform choice (1-5).
// Platform-only jobs (an image, a video, a recurring task, a notebook of the person's PDFs) can't
// be done by a text stand-in, so for those the judge compares the two REQUESTS directly: which
// one, typed into the recommended platform, gets this person a better result. (Changed Oct 6,
// 2026 after the first runs: the stand-in said it "cannot schedule" and its code answers ran out
// of room, so those runs measured the stand-in, not the prompt. Those runs failed and are kept
// in the README.)
// Pass bar (set before any results were seen): super prompt wins at least 7 of 8, averages at
// least +1.5, platform choice averages at least 4 of 5, and no hand-off on the 2 controls.
// Run locally against `vercel dev`: node scripts/handoff-eval.mjs [base-url]. Not deployed.
import fs from 'node:fs';

const BASE = process.argv[2] || 'http://localhost:3000';
const env = Object.fromEntries(fs.readFileSync(new URL('../.env', import.meta.url), 'utf8').split(/\r?\n/).filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]));
const MODEL = env.BLUEY_JUDGE_MODEL || env.BLUEY_MODEL || 'gpt-6-luna';

const CASES = [
  ['Create a website for my dog-walking business.', 'Business: Paws & Go in Austin, TX (Zilker and Travis Heights). 30-minute walks for $25, puppy visits $20. Booking through a Calendly link. Friendly, local, trustworthy feel. I have photos of happy dogs.'],
  ['Build me a dashboard that tracks my small business sales from a spreadsheet.', 'My CSV has columns: date, product, quantity, unit price, region. 3 products, 4 regions, about 2,000 rows a year. I want monthly totals by region, top products, and a trend line. Used by me and my business partner, not technical.'],
  ['Make me a logo for my bakery called Sunny Crumbs.', 'Family-run bakery known for sourdough and cinnamon rolls. Cozy, warm feel; colors warm yellow and brown. Used on paper bags, a storefront sign, and Instagram.'],
  ["Every Monday morning, send me a summary of the week's AI news.", 'Mondays at 7 a.m. Pacific. Focus on voice AI and AI tools for small businesses. 5 short bullets, each with a link, plus one thing worth trying this week.'],
  ['Make me a short video intro for my YouTube channel.', 'Channel: "Fix It Friday", DIY home repair for beginners. Upbeat, about 6 seconds, show a wrench and a toolbox, end on the channel name.'],
  ['I want to study my 5 PDF chapters for my nursing exam.', 'Pharmacology chapters (cardiac drugs, antibiotics, pain management, insulin, anticoagulants). Exam in 2 weeks. I want practice questions with rationales and a quick-review sheet.'],
  ['Build me a Chrome extension that blocks distracting websites.', 'Block YouTube and Reddit from 9 to 5 on weekdays. Allow a 5-minute break with a password. I am not a programmer.'],
  ['Write a detailed research report comparing heat pumps and gas furnaces for my home.', 'A 1960s, 1,800 sq ft house in Columbus, Ohio, with single-pane windows. Current gas furnace is 20 years old. I care about cost over 15 years, comfort in January, and rebates.'],
];
const PLATFORM_ONLY = new Set(['Make me a logo for my bakery called Sunny Crumbs.', "Every Monday morning, send me a summary of the week's AI news.", 'Make me a short video intro for my YouTube channel.', 'I want to study my 5 PDF chapters for my nursing exam.']);
const CONTROLS = ['Write a short thank-you note to my neighbor.', 'Make me a grocery list for tacos.'];

async function bluey(text) {
  const r = await fetch(`${BASE}/api/chat`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: text }] }) });
  const d = await r.json(); if (!r.ok) throw new Error(`Bluey ${r.status}: ${d.error}`); return d;
}
async function openai(body) {
  for (let tries = 2; ; tries--) {
    const r = await fetch('https://api.openai.com/v1/responses', { method: 'POST', headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: MODEL, ...body }) });
    const d = await r.json();
    if (r.ok) return d.output_text || d.output?.flatMap(o => o.content || []).find(c => c.type === 'output_text')?.text || '';
    if (r.status >= 500 && tries > 1) { await new Promise(res => setTimeout(res, 3000)); continue; }
    throw new Error(`OpenAI ${r.status}: ${d?.error?.message}`);
  }
}
const json = schema => ({ format: { type: 'json_schema', name: 'o', strict: true, schema } });
const assistant = prompt => openai({ instructions: 'You are a capable AI assistant. Do what the request asks as well as you can in one reply. If it asks for software, give the complete working code and setup steps. If it asks for an image or video, write the detailed creative brief and shot list you would use.', input: prompt, max_output_tokens: 32000 });

const rows = [];
for (const [request, background] of CASES) {
  const d = await bluey(request);
  const h = d.handoff;
  if (!h) { rows.push({ request, handoff: null }); console.log(`-  no hand-off | ${request}`); continue; }
  let sent = h.prompt;
  // Like the app's tap card: answer each blank, then the script puts the answers in place, so the
  // whole prompt is always kept (a filler that rewrote the prompt once returned only the answers).
  const blanks = sent.match(/\[[^\]]+\]/g) || [];
  if (blanks.length) {
    const o = JSON.parse(await openai({ instructions: 'You are this person. For each numbered blank, answer only what it asks, from your situation, in 10 words or fewer. If your situation does not cover it, give a plausible short answer.', input: `BLANKS:\n${blanks.map((b, i) => `${i + 1}. ${b}`).join('\n')}\n\nYOUR SITUATION:\n${background}`, text: json({ type: 'object', additionalProperties: false, properties: { answers: { type: 'array', items: { type: 'string' } } }, required: ['answers'] }) }));
    blanks.forEach((b, i) => { sent = sent.split(b).join(String(o.answers[i] || '').trim() || b); });
  }
  const platformOnly = PLATFORM_ONLY.has(request);
  const [outA, outB] = platformOnly ? [request, sent] : await Promise.all([assistant(request), assistant(sent)]);
  const bFirst = Math.random() < 0.5;
  const v = JSON.parse(await openai({
    instructions: (platformOnly ? `Judge two REQUESTS a real person could type into ${h.platform}${h.feature ? ' (' + h.feature + ')' : ''}. Score each 1-10 for how good a result it would get this person, given their situation (as if you were them): specific, complete, and about what they actually need. Pick the better one.` : 'Judge two AI results for a real person. Score each 1-10 for how well it gets this person what they actually need, given their situation (as if you were them). Pick the better one.') + '  Separately rate 1-5 how sensible the recommended platform and feature are for this job (5 = clearly the right kind of tool, 1 = wrong kind of tool).',
    input: `REQUEST: ${request}\nTHEIR SITUATION: ${background}\nRECOMMENDED: ${h.platform}${h.feature ? ' / ' + h.feature : ''} because ${h.why}\n\nRESULT 1:\n${(bFirst ? outB : outA).slice(0, 12000)}\n\nRESULT 2:\n${(bFirst ? outA : outB).slice(0, 12000)}`,
    max_output_tokens: 2000,
    text: json({ type: 'object', additionalProperties: false, properties: { score1: { type: 'integer', minimum: 1, maximum: 10 }, score2: { type: 'integer', minimum: 1, maximum: 10 }, better: { type: 'string', enum: ['1', '2', 'tie'] }, platformFit: { type: 'integer', minimum: 1, maximum: 5 }, reason: { type: 'string' } }, required: ['score1', 'score2', 'better', 'platformFit', 'reason'] }),
  }));
  const sB = bFirst ? v.score1 : v.score2, sA = bFirst ? v.score2 : v.score1;
  const winner = v.better === 'tie' ? 'tie' : ((v.better === '1') === bFirst ? 'super prompt' : 'original');
  rows.push({ request, mode: platformOnly ? 'requests compared' : 'results compared', platform: h.platform, feature: h.feature, sA, sB, winner, fit: v.platformFit, reason: v.reason, prompt: h.prompt, sent });
  console.log(`${winner === 'super prompt' ? '✓' : '✗'}  ${sA} → ${sB}  winner ${winner} ${platformOnly ? '(requests)' : '(results)'} | ${h.platform}${h.feature ? ' · ' + h.feature : ''} fit ${v.platformFit}/5 | ${request.slice(0, 55)}\n     judge: ${v.reason.slice(0, 200)}`);
}
const controls = [];
for (const c of CONTROLS) { const d = await bluey(c); controls.push(!!d.handoff); console.log(`${d.handoff ? '✗ hand-off on a simple request' : '✓ no hand-off on a simple request'} | ${c}`); }
const judged = rows.filter(r => r.winner), wins = judged.filter(r => r.winner === 'super prompt').length;
const avg = judged.length ? judged.reduce((s, r) => s + r.sB - r.sA, 0) / judged.length : 0;
const fit = judged.length ? judged.reduce((s, r) => s + r.fit, 0) / judged.length : 0;
const pass = judged.length === CASES.length && wins >= 7 && avg >= 1.5 && fit >= 4 && !controls.some(Boolean);
console.log(`\nHand-off given on ${judged.length} of ${CASES.length} · super prompt won ${wins} of ${judged.length} · average ${avg >= 0 ? '+' : ''}${avg.toFixed(1)} · platform fit ${fit.toFixed(1)}/5 · hand-offs on simple requests ${controls.filter(Boolean).length} of ${CONTROLS.length}`);
console.log(`Pass bar (hand-off on all 8, ≥7 of 8 wins, ≥ +1.5, fit ≥ 4, none on simple requests): ${pass ? 'PASS' : 'FAIL'}`);
fs.writeFileSync(new URL('./handoff-eval-last.json', import.meta.url), JSON.stringify({ date: new Date().toISOString(), rows, controls, pass }, null, 2));
