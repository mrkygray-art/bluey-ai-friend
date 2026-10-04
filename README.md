# Bluey 0.5.4 — OpenAI Upload Fix

The microphone/browser capture path is intentionally unchanged from 0.5.3.

## Server-side change
`/api/transcribe` now:
- reads the uploaded browser recording into bytes,
- normalizes its audio MIME type,
- constructs an explicit OpenAI SDK `File` with filename + MIME metadata using `toFile`,
- sends that file to the transcription endpoint,
- logs the first eight file bytes (signature) plus upload metadata for diagnosis.

This targets the remaining `400 Unsupported file format` error without changing the now-proven microphone capture path.

## Test
Tap Bluey, speak for 3–5 seconds, tap again, and confirm your speech appears in the conversation.
If it fails, copy the newest `Bluey transcription upload prepared` and `Bluey transcription server error` log entries.
