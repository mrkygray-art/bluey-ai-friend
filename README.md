# Bluey 0.4

First connected-brain prototype.

## Vercel setup
1. Deploy this folder to Vercel.
2. Add `OPENAI_API_KEY` as a Vercel environment variable.
3. Optional: set `BLUEY_MODEL`; default is `gpt-6-luna`.
4. Redeploy after adding the environment variable.

## What works
- Persistent animated Bluey stage
- Typed conversation with real LLM through a server-side endpoint
- LLM-selected behavior state
- Cross-browser microphone capture using MediaRecorder
- Server-side transcription endpoint
- Browser speech output as a temporary voice layer

Do not put the OpenAI API key in index.html or client-side JavaScript.
