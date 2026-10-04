# Bluey 0.4.1

Connected-brain prototype.

## Vercel
Required environment variable:
- `OPENAI_API_KEY`

Optional:
- `BLUEY_MODEL` — defaults to `gpt-6-luna`.

0.4.1 adds:
- Responses API structured JSON output for reply + behavior
- clearer server/API error reporting
- corrected transcription request with `gpt-transcribe`
- persistent animated Bluey stage
- cross-browser microphone capture via MediaRecorder

Never put API keys in client-side JavaScript or GitHub.
