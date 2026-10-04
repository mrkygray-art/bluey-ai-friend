# Bluey 0.4.4

## Fixes
- Rebuilt speech transcription using the official OpenAI Node SDK.
- Keeps browser audio upload parsing with Formidable.
- Adds useful transcription diagnostics to Vercel Function Logs without exposing technical errors to users.
- “I didn't catch that” now clears automatically after about 7 seconds.
- A new idle/personality nudge clears any stale status message before appearing.
- User activity also clears old temporary status messages.
- Browser title is explicitly `Bluey 0.4.4`.

## Visual language
- Blue = Bluey's temporary voice/status/personality language
- Muted gray = the user's typed or transcribed words
- Near-black = Bluey's substantive answer

## Vercel
Required: `OPENAI_API_KEY`
Optional: `BLUEY_MODEL`, `BLUEY_TRANSCRIBE_MODEL`
