# Bluey 0.4.2

Bluey is a simple, friendly AI companion designed to make AI approachable without making the user learn AI terminology.

## 0.4.2
- Rebuilt microphone transcription pipeline.
- Browser records audio with `MediaRecorder`.
- Vercel parses the upload with `formidable`.
- Server constructs a fresh multipart request to OpenAI.
- Default transcription model: `gpt-4o-mini-transcribe`.
- Friendly user-facing API/transcription errors; detailed errors remain in Vercel logs.
- Cleaner conversation flow.
- LLM still returns both Bluey's answer and hidden behavior state.

## Vercel environment variables
Required:
- `OPENAI_API_KEY`

Optional:
- `BLUEY_MODEL` (defaults to `gpt-6-luna`)
- `BLUEY_TRANSCRIBE_MODEL` (defaults to `gpt-4o-mini-transcribe`)

Never expose API keys in client-side JavaScript or commit them to GitHub.
