# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Bluey is an AI companion for people who don't think of themselves as AI users: a friendly blue orb in a small digital world who helps people get better results from AI without teaching them prompt engineering ("teach without teaching"). Plain HTML/CSS/JS front end (no build step, no framework), Vercel serverless functions in `api/`, OpenAI API. Live at bluey-ai-friend.vercel.app; Vercel team `power-quote`, project `bluey-ai-friend`, deploys on push to `main`.

Development moved from ChatGPT to Claude Code on 2026-10-06. Earlier history (alpha numbers, "Add files via upload" commits, `codex/*` branches) came from ChatGPT/Codex and GitHub web uploads.

## Commands

- `npm install`, then `vercel dev` — serves the static app and the `/api` functions locally. Needs a local `.env` with `OPENAI_API_KEY` (copy `.env.example`; `.env` is git-ignored).
- There is no build, lint, or unit-test setup. The Brain Lab (below) is the test suite.

## Architecture

**Front end is a stack of patch layers.** `index.html` (~2,400 lines, holds the original app inline) loads `alpha7.css`…`alpha40.css` and `alpha7.js`…`alpha40.js` in order. `alpha40.js` then injects `alpha41.js`…`alpha46.js` (and `alpha13.js` also injects `alpha43.js`); `alpha46.js` / `index.html` pull in `alpha47-quiet-stage.js` and `alpha47-mobile-polish.css`. Each later layer overrides or monkey-patches earlier ones, so **a behavior can be defined in several files and the last loaded wins**. Before changing a behavior, grep every layer for it. Consolidating these layers is planned, one area at a time with testing, never a big-bang rewrite.

**API (`api/`, each file is a Vercel function; `_`-prefixed files are helpers, not routes):**
- `chat.js` — the brain. Big system prompt (character + "Bluey Intelligence" rules), OpenAI Responses API with a strict JSON schema returning `{reply, behavior, spellingSuggestion, brain}`. `brain` holds `mode` (DO/DISCOVER/GROW), goal/goalThread, `contextShifted`, readiness, promptQuality, `initiativeLevel` 0–4, opportunity rung/idea distance, environment, etc. The brain record is developer telemetry and must never be shown to users. Up to 5 images (data URLs, png/jpeg/webp/gif). Model from `BLUEY_MODEL`.
- `transcribe.js` (speech-to-text, 15 MB), `speech.js` (TTS, ≤4,096 chars), `document.js` (PDF/Word/Excel via pdfkit/docx/xlsx), `prompt-workshop.js`.
- `_limit.js` — best-effort in-memory per-IP hourly limit + daily cap, applied to all five endpoints. Resets per instance; the real backstop is the OpenAI account's monthly spend limit.

**Steer buttons** — `steer.js` + `steer.css` (loaded after `alpha40.js`). `chat.js` returns `brain.isDraft`; `steer.js` wraps `window.fetch` to read each `/api/chat` response (parsed before the caller gets it) and wraps `add()` to show Shorter / Warmer / More specific / Different angle under the latest draft only; a tap calls `send("Make it shorter.")` etc. Server side, `chat.js` detects a revision turn (latest user message starts with "make it/this/that", "shorter", "warmer", "try a different angle"…, right after an assistant message) and swaps the random reply-style nudge for an "edit your previous draft, keep every detail" nudge — the random nudges ("choose a fresh answer shape") made revisions start over and drop facts. Replies are capped at 4,000 output tokens; a cut-off reply returns a friendly 502. `steer.js` also adds a **More ▾** dropdown (formal, casual, simpler, bullets, plus two that prefill the composer) and, when `brain.assumption` is set, a "💭 …" line with **Fix that** (prefills "Actually, "). The revise-turn regex also matches "use simpler", "turn it into", "change it", "actually".

**Preferences** — `preferences.js` + `.css`. `brain.preferenceNoticed` → "Remember this for next time?" card; saved list (max 8, localStorage `bluey-preferences`) is added to every `/api/chat` body as `preferences`; `chat.js` sanitizes (strings, ≤120 chars, ≤8) and appends them to the instructions as style preferences only. **Remembered ▾** in the session tools lists/forgets them (full-width card on phones). Bluey must never claim cross-device memory.

**Greetings** — `greetings.js` redefines `blueyFirstMeet` / `blueyReturningMeet` (index.html calls them 420 ms after load): ~30 returning lines, weekday lines, July 7 birthday line, no repeat of the last 8 (localStorage `bluey-greeting-recent`). Time-of-day lines stay in the status line (`blueyTimeRitual`). The original first-meeting intro never showed (it searched for the default greeting text after it had changed); `greetings.js` sets it directly.

**Greeting placement** — `follow-copy.css` + `follow-copy.js` (all screen sizes) make `.stage-copy` (greeting + status) a fit-to-text column that follows the orb's live position every animation frame, as Bluey drifts left/right and forward/back (the orb's size changes); it flips above him if there's no room below and stays on screen near edges. Selectors start with `body .app .stage` to beat the older phone stack in an `index.html` `@media(max-width:700px)` block (which used `!important` top/left/right) and `alpha47-mobile-polish.css` (injected late by `alpha46.js`).

**Light bulb (💡)** — `tips.js` + `tips.css`. `chat.js` returns `brain.betterPrompt` / `brain.betterPromptWhy` (rules under "BETTER PROMPT"); the server drops a 💡 with more than two `[blanks]` and strips "first-time" when the user didn't say it. `tips.js` puts a 💡 under the user's message, opens a card with added words highlighted (`<mark>`) and blanks styled; **Try it** sends, **Use it** (has blanks) fills the composer and selects the first blank, and a capture-phase form `submit` listener blocks sending while a chosen prompt's blanks remain. Hides `#bluey-prompt-start` (old Build prompt). **The real test is `scripts/tip-eval.mjs`** (local only, `.vercelignore`d; reads `.env`): A/B per vague request with hidden background, blanks filled from it, blind pairwise judge (scores + invented-facts with a required quote). Blanks are filled with only what each asks for (≤10 words), like a real user; the judge also scores `tipFocus` 1–5 (substance vs. names). Pass bar: ≥80% wins, ≥ +1.5 avg, 0 invented, focus ≥ 4, no 💡 on clear requests. The averages can hide a single bad 💡 (the old rule passed overall while its proposal 💡 scored 3/5), so add targeted Brain Lab cases like `tip-proposal` for known failures. Restart `vercel dev` between runs (the per-IP limiter counts test calls). Brain Lab cases `tip-vague`, `tip-personal`, `tip-trip`, `tip-proposal` (blanks must not be only names), plus `tip:false` on the clear-email, small-talk, and steer-shorter cases.

**Bottom controls** — `controls.js` + `.css`: `#bluey-voice` and `#bluey-sounds` are moved (not copied) into a "🔊 Sound ▾" / "🔇 Muted ▾" pill menu, so all code that finds them by id still works; a MutationObserver keeps the pill label in sync. "Save chat" (alpha36's export button, found by its aria-label) is hidden in CSS; its code stays.

**Brain first** — `brain-first.js` (loaded last; re-installs itself every 300 ms because alpha40 loads alpha41–47 later and they re-wrap `send`). Every message goes to `/api/chat` via its own `askBrain` (same steps as the original send, but shows friendly 429 / "too long" messages), keeping alpha7's document and photo routes. `isLocalAction` keeps only app actions on the old chain: "where are we?" / "go home" (anchored), room travel (`TRAVEL`: travel verb + room word), stage objects (whole-word match on `BLUEY_OBJECTS` names, on-stage labels, alpha42 aliases), the story/guessing games (and replies while one runs), dancing, a ≤6-word follow-up on a tapped object, the open prompt workshop, and photo-only sends. Task words (`TASK`) or >10 words always go to the brain and end any game/story/object focus. The ~40 canned text replies in the old layers are now unreachable for normal messages; the brain has the lore. Object matching in index.html `findVisibleObject`, alpha42 `resolveObject`, alpha45 `inferPurpose` is whole-word (`hasWord`/`hasWord42`/`hasWord45`; distinct names because the files share global scope). alpha37's "where are we" no longer jumps to the Workshop. `chat.js` tells the brain it can't move Bluey on screen (Brain Lab case `no-fake-travel`). **Don't add new keyword intercepts** — put behavior in the brain (`chat.js`). Test routing with a browser script that counts `/api/chat` requests per message; the Brain Lab can't see this (it calls the API directly).

**State:** chat history and preferences in `localStorage` only. No accounts.

**Brain Lab** — `brain-lab.html` + `brain-eval.js` (cases, deterministic scoring, expectations) + `brain-lab-v2.js` (runner). On `main`: 32 cases (6 draft steering; plus stated guesses, small first versions, preferences noticed / not noticed / followed). Cases can carry `preferences` (sent in the request body by the runner). It calls the real `/api/chat`, so every run costs money. `vercel.json` redirects `/brain-lab.html` to `/` on `*.vercel.app` hosts; it works under `vercel dev`. `alpha44.js` has a world (room travel) regression runner.

## Branches

- `main` — production, frozen Alpha 47 baseline plus fixes.
- `brain-lab-v23-real-human` — newest brain + memory beta, ~74 commits ahead of `main` (and `main` is ~7 ahead of it). Has a Supabase memory store (`api/_memory.js`, table `bluey_memories`, single test owner `brain-lab-alpha`, needs `SUPABASE_URL` + secret key), a 7-test **Memory Gate** in its `brain-lab.html` (recall by name and by loose description, latest truth after correction, forgotten stays forgotten, irrelevant memory suppressed, preference vs. subject, unrelated memory survives renames/forgets), and 19 regression cases in `brain-eval.js`.
- Other branches are older experiments. Merging the beta into `main` is an open decision; don't do it without the user.

## Rules

- **Numbers must come from the code.** Count test cases from `brain-eval.js` / `brain-lab.html`, never from UI labels or commit messages. Example: the beta lab's label says "39 tests" but only 19 cases exist in any branch; the 20 "real-human" scenarios were never committed. Public text (README, portfolio) currently says 39 by the user's choice; don't repeat it in new text, and don't "fix" it unasked.
- **Every brain change ships with Brain Lab cases committed to the repo**, so published claims can be checked.
- **Cost:** never expose a way for visitors to trigger many paid calls (keep the Brain Lab blocked on deployments, keep `_limit.js` on every OpenAI endpoint). Running the lab locally costs a few cents per run; say so before running it.
- **Honesty is a product feature:** Bluey must never claim a memory, file, image, account, or capability that doesn't exist. Keep the "not in this alpha" statements in `chat.js` true.
- **Tone:** UI copy is plain, warm, short, for first-time and hesitant AI users. No jargon, no lectures about prompting.
- **README is public** (github.com/mrkygray-art/bluey-ai-friend) and read by recruiters. Update it in the same commit as any visible change, and keep every claim true to the code. The same project is described in the portfolio (`~/projects/ky-gray-portfolio`: `#bluey` in `index.html`, `[proj-bluey]` in `api/_askky-knowledge.js`) and the GitHub profile README (repo `mrkygray-art/mrkygray-art`); tell the user when those may need updating, don't edit them unasked.
- **One source of truth:** changes go through this local repo. If GitHub has commits you don't (web uploads), `git pull` before editing.

## Cleanup candidates (not done yet; ask first)

- `alpha14.js` / `alpha14.css` are not loaded by anything.
- Root `document.js` and `transcribe.js` are stale copies of `api/` code (served as static files, unused).
- `index.html.tmp` is a stray upload.
- The "Build prompt" button is still in `index.html` although commit 5749900 says it was removed.
