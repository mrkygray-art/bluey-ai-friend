# Bluey 0.5.0 — Microphone Capture Rebuild

The microphone path now uses the browser-native MediaRecorder instead of the custom zero-filled PCM/WAV path.

Acceptance test:
1. Tap Bluey and speak for 3–5 seconds.
2. Tap Bluey again.
3. Use Play my recording. Your voice should be clearly audible.
4. Bluey should transcribe the speech and answer.
5. Test Chrome and Firefox.

Bluey also subtly reacts to live microphone energy while listening. The playback diagnostic remains temporarily for testing.
