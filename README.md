# Bluey 0.4.7

Transcription-only diagnostic/fix release.

## What changed
- Validates the generated WAV before OpenAI receives it.
- Checks RIFF/WAVE markers, PCM format, mono channel count, sample rate, byte rate, block alignment, 16-bit depth, and data chunk.
- Logs the validated WAV properties in Vercel.
- Uses the OpenAI SDK `toFile()` helper to create a clean `bluey.wav` upload rather than passing Formidable's temporary file metadata.
- No intentional UI/personality changes.

## Acceptance test
Tap Bluey → speak → tap again → your transcript appears in gray → Bluey answers → answer is spoken.

## Vercel
Required: `OPENAI_API_KEY`
Optional: `BLUEY_MODEL`, `BLUEY_TRANSCRIBE_MODEL`
