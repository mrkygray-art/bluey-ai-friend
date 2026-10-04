# Bluey 0.4.9 — Audio Diagnostic

This release diagnoses the remaining voice transcription issue without changing Bluey's normal personality/UI.

- Measures PCM peak, RMS, silence %, clipping %, and sample count on Vercel.
- Logs `Bluey audio diagnostic` with `audioStatus`.
- Adds a temporary **Play my recording** control after a voice recording so you can hear exactly what Bluey captured.
- Keeps the 0.4.8 WAV validation and transcription-response diagnostics.

Test: tap Bluey, speak for 3–5 seconds, tap again, play the recording, then inspect the newest Vercel `/api/transcribe` log.
