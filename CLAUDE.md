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

**State:** chat history and preferences in `localStorage` only. No accounts.

**Brain Lab** — `brain-lab.html` + `brain-eval.js` (cases, deterministic scoring, expectations) + `brain-lab-v2.js` (runner). On `main`: 15 cases. It calls the real `/api/chat`, so every run costs money. `vercel.json` redirects `/brain-lab.html` to `/` on `*.vercel.app` hosts; it works under `vercel dev`. `alpha44.js` has a world (room travel) regression runner.

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
