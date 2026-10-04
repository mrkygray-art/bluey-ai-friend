# Bluey 0.5.2 — Self-Diagnosing Microphone Build

Temporary developer build for isolating the silent microphone issue.

## Changes
- Adds an on-screen Developer Mic Diagnostic panel.
- Shows selected device, track state, enabled/muted state, sample rate and channel count.
- Shows live peak and RMS values.
- Shows final recording duration, byte size, and MIME type.
- Gives a clear microphone-audio detected / no-audio result.
- Does NOT call the transcription API when the live signal is effectively silent.
- Keeps playback available for testing when a usable signal is detected.

## Test
Tap Bluey, speak normally for 5 seconds, and tap Bluey again.
Take a screenshot of the Developer Mic Diagnostic panel after the recording.
