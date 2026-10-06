// Light-bulb (💡) evaluation: does the better prompt really produce a much better result?
//
// For each vague request, with the background a real person would know:
//   A = Bluey's answer to the original words.
//   💡 = the better prompt Bluey suggests (brain.betterPrompt).
//   B = Bluey's answer to the 💡 prompt, with each [blank] filled with ONLY what that blank
//       asks for (10 words or fewer), the way a real person fills it in. If the 💡 asks for a
//       cosmetic detail like a name, that's all B gets, so a badly chosen blank shows up here.
// A separate judge call sees the person's real situation and the two answers in random
// order (it isn't told which came from the 💡), scores each 1-10, checks whether the
// 💡 prompt invented personal facts, and scores 1-5 whether the 💡 asks for the details that
// matter most (what, why, key numbers) rather than cosmetic ones (names, titles).
//
// Pass bar (set before any results were seen): the 💡 answer wins at least 80% of the
// comparisons, averages at least 1.5 points higher, no 💡 prompt invents facts, and the
// 💡 focus score averages at least 4 out of 5 (added Oct 6, 2026, after a real proposal
// 💡 asked only for names).
// Clear requests should get no 💡 at all.
//
// Run locally against `vercel dev` (it uses your OpenAI key from .env and costs a few cents):
//   node scripts/tip-eval.mjs [base-url]      default http://localhost:3000
// Not deployed (.vercelignore).
import fs from 'node:fs';

const BASE = process.argv[2] || 'http://localhost:3000';
const env = Object.fromEntries(fs.readFileSync(new URL('../.env', import.meta.url), 'utf8')
  .split(/\r?\n/).filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]));
const KEY = env.OPENAI_API_KEY;
const MODEL = env.BLUEY_JUDGE_MODEL || env.BLUEY_MODEL || 'gpt-6-luna';
if (!KEY) { console.error('OPENAI_API_KEY missing from .env'); process.exit(1); }

const VAGUE = [
  ['Write a toast for the wedding.', "It's my sister Maya's wedding to Jordan. I'm the maid of honor. We shared a tiny bedroom growing up and she always stole my sweaters. Guests are mostly family. I want it under two minutes, warm and a little funny."],
  ['Help me write a cover letter.', 'Applying for an entry-level marketing coordinator job at a local credit union. I have a communications degree, ran social media for a campus club (followers grew 40%), and worked two years as a bank teller.'],
  ['Make a workout plan.', "I'm 45 and out of shape, with a bad left knee. I have dumbbells at home and can do 3 days a week, 30 minutes each. I want to lose weight and feel stronger."],
  ['Plan a trip to Japan.', 'Two of us, 10 days in April, first time in Japan. We love food and temples, moderate budget, not into nightlife.'],
  ['Write a birthday message for my sister.', 'My sister Leah turns 30. She just started nursing school. We text each other in a jokey way.'],
  ['Give me dinner ideas.', 'Family of four with two picky kids, 30 minutes max on weeknights, no pork.'],
  ['Write a LinkedIn post about my new job.', "I'm starting as an IT support specialist at Riverside Hospital next Monday after three years at a retail store. I'm grateful to my old team and excited to work in healthcare."],
  ['Help me plan a garage sale.', 'This Saturday in a suburban neighborhood. Mostly kids toys and some furniture. I want to be done by noon.'],
  ['Write a complaint to my landlord.', "The heater in apartment 3B has been broken for 5 days. I've reported it twice by text. The landlord is Mr. Patel. I want it fixed by Friday."],
  ['Help me write a business proposal.', "I own John's Auto Body. I'm proposing to Mike Smith, fleet manager at Valley Plumbing, that we handle collision repair and paint touch-ups for their 12 service vans, with priority scheduling, a loaner van while theirs is in the shop, and a 10% fleet discount. About $18,000 a year. I want a signed agreement by the end of the month."],
  ['Explain the stock market.', "I'm 19, have never invested, and want to understand the basics so I can start a Roth IRA."],
];
const CLEAR = [
  'Write a two-sentence formal email to my manager Dana saying I am out sick today and will check messages tomorrow. Sign it Ky.',
  "What's 15% of 80?",
];

async function bluey(text, tries = 2) {
  const r = await fetch(`${BASE}/api/chat`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: text }] }) });
  const d = await r.json();
  if (r.status >= 500 && tries > 1) { await new Promise(res => setTimeout(res, 3000)); return bluey(text, tries - 1); } // provider hiccup: retry once
  if (!r.ok) throw new Error(`Bluey ${r.status}: ${d.error}`);
  return d;
}

async function openai(instructions, input, schema) {
  const r = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST', headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, instructions, input, max_output_tokens: 2000, text: { format: { type: 'json_schema', name: 'out', strict: true, schema } } }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(`OpenAI ${r.status}: ${d?.error?.message}`);
  const text = d.output_text || d.output?.flatMap(o => o.content || []).find(c => c.type === 'output_text')?.text;
  return JSON.parse(text);
}

const fillBlanks = (prompt, background) => openai(
  'Replace each [bracketed blank] in the prompt with what that blank asks for, taken from the background, the way a real person types it before sending: answer only what the blank asks, in 10 words or fewer, and do not add any other details from the background. Change nothing else in the prompt. If the background does not cover a blank, write a plausible short value.',
  `PROMPT:\n${prompt}\n\nBACKGROUND:\n${background}`,
  { type: 'object', additionalProperties: false, properties: { filled: { type: 'string' } }, required: ['filled'] },
).then(o => o.filled.replace(/^\s*PROMPT:\s*/i, ''));

const judge = (original, background, better, first, second) => openai(
  'You compare two AI assistant replies for a real person. Judge only how well each reply serves what this person actually needs, given their situation, as if you were them. A reply that only asks questions scores lower than one that delivers a useful result, unless the questions are truly necessary. Score each 1 to 10 and pick the better one. Separately, check the IMPROVED PROMPT: does it state something about their own life, plans, or situation (names, dates, places, relationships, memories, experience level like "first-time", who is coming, budget) that is not in the ORIGINAL REQUEST? Choices about the output (length, tone, format, number of ideas, a schedule for the plan) are not facts about the person, and [bracketed blanks] are fine. Set inventedFacts to true only if you can quote such an invented statement, and quote it at the start of your reason. Finally, score tipFocus from 1 to 5: of the details the IMPROVED PROMPT adds or asks for (its [blanks]), are they the ones that matter most for a great result given their situation (what they want, the problem or goal, key numbers like price, budget, deadline), rather than cosmetic details (names, titles, labels)? 5 = exactly the most important missing details; 1 = only cosmetic details.',
  `ORIGINAL REQUEST: ${original}\nTHEIR SITUATION (what they know but did not say): ${background}\nIMPROVED PROMPT: ${better}\n\nREPLY 1:\n${first}\n\nREPLY 2:\n${second}`,
  { type: 'object', additionalProperties: false, properties: {
    score1: { type: 'integer', minimum: 1, maximum: 10 }, score2: { type: 'integer', minimum: 1, maximum: 10 },
    better: { type: 'string', enum: ['1', '2', 'tie'] }, inventedFacts: { type: 'boolean' }, tipFocus: { type: 'integer', minimum: 1, maximum: 5 }, reason: { type: 'string' } },
    required: ['score1', 'score2', 'better', 'inventedFacts', 'tipFocus', 'reason'] },
);

const rows = [];
for (const [original, background] of VAGUE) {
  const a = await bluey(original);
  const tip = a.brain?.betterPrompt;
  if (!tip) { rows.push({ original, tip: null }); console.log(`-  no 💡   | ${original}`); continue; }
  const sent = /\[[^\]]+\]/.test(tip) ? await fillBlanks(tip, background) : tip;
  const b = await bluey(sent);
  const bFirst = Math.random() < 0.5;
  const j = await judge(original, background, tip, bFirst ? b.reply : a.reply, bFirst ? a.reply : b.reply);
  const scoreA = bFirst ? j.score2 : j.score1, scoreB = bFirst ? j.score1 : j.score2;
  const winner = j.better === 'tie' ? 'tie' : ((j.better === '1') === bFirst ? '💡' : 'original');
  rows.push({ original, tip, why: a.brain?.betterPromptWhy, sent, scoreA, scoreB, winner, invented: j.inventedFacts, focus: j.tipFocus, reason: j.reason, replyA: a.reply, replyB: b.reply });
  console.log(`${winner === '💡' ? '✓' : '✗'}  ${scoreA} → ${scoreB}  winner ${winner}  focus ${j.tipFocus}/5${j.inventedFacts ? '  INVENTED FACTS' : ''} | ${original}\n     💡 ${tip}\n     sent: ${sent}`);
}
const controls = [];
for (const c of CLEAR) { const d = await bluey(c); controls.push(!!d.brain?.betterPrompt); console.log(`${d.brain?.betterPrompt ? '✗ 💡 offered on a clear request' : '✓ no 💡 on a clear request'} | ${c}`); }

const judged = rows.filter(r => r.tip);
const wins = judged.filter(r => r.winner === '💡').length;
const avgDelta = judged.length ? judged.reduce((s, r) => s + (r.scoreB - r.scoreA), 0) / judged.length : 0;
const invented = judged.filter(r => r.invented).length;
const avgFocus = judged.length ? judged.reduce((s, r) => s + r.focus, 0) / judged.length : 0;
const pass = judged.length > 0 && wins / judged.length >= 0.8 && avgDelta >= 1.5 && invented === 0 && avgFocus >= 4 && !controls.some(Boolean);
console.log(`\n💡 offered on ${judged.length} of ${VAGUE.length} vague requests`);
console.log(`💡 answer won ${wins} of ${judged.length} (${judged.length ? Math.round(100 * wins / judged.length) : 0}%) · average ${avgDelta >= 0 ? '+' : ''}${avgDelta.toFixed(1)} points · invented facts ${invented} · focus ${avgFocus.toFixed(1)}/5 · 💡 on clear requests ${controls.filter(Boolean).length} of ${CLEAR.length}`);
console.log(`Pass bar (≥80% wins, ≥ +1.5 points, 0 invented, focus ≥ 4/5, no 💡 on clear requests): ${pass ? 'PASS' : 'FAIL'}`);
fs.writeFileSync(new URL('./tip-eval-last.json', import.meta.url), JSON.stringify({ date: new Date().toISOString(), model: MODEL, rows, controls, wins, judged: judged.length, avgDelta, invented, avgFocus, pass }, null, 2));
