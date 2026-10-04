# Bluey 0.4.3

## New in 0.4.3
- Bluey's temporary stage/status language is blue.
- User input/transcribed speech is muted gray.
- Bluey's substantive answers remain near-black for readability.
- Gentle inactivity engagement:
  - first a random silent Bluey nudge
  - later, one short spoken check-in
  - subsequent personality thoughts stay silent
- If the user says they're busy/working on something else, Bluey suppresses future idle voice prompts for that session.
- Saying "I'm back", "ready now", or similar re-enables voice check-ins.
- Random Bluey personality lines are intentionally calm rather than notification-like.

## Future feature
A simple “Who is Bluey?” experience explaining why Bluey exists, what Bluey can do, and the design philosophy: AI without needing to learn AI.

## Vercel
Required: `OPENAI_API_KEY`
Optional: `BLUEY_MODEL`, `BLUEY_TRANSCRIBE_MODEL`
