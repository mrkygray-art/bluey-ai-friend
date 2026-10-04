# Bluey 0.4.8

Transcription response diagnostic/normalization release.

## What changed
- Keeps the validated WAV pipeline from 0.4.7 unchanged.
- Logs the safe JavaScript shape of the OpenAI transcription response.
- Normalizes several possible text-bearing response shapes.
- If no transcript is found, logs a short redacted response preview.
- No intentional UI, motion, personality, microphone, or WAV changes.

## Acceptance test
Tap Bluey → speak → tap Bluey again → spoken words appear in gray → Bluey answers → Bluey speaks the answer.

## Vercel logs
Look for:
- `Bluey WAV validated`
- `Bluey transcription response shape`
- `Bluey transcription success`

If normalization still fails, copy the `response shape` and `returned no normalized text` entries.
