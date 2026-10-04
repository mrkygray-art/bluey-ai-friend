# Bluey 0.5.1 — Live Microphone Diagnostic

This build isolates the microphone signal before MediaRecorder/transcription.

## Added
- Live microphone level bar while Bluey listens.
- Bluey reacts directly to live microphone energy.
- Logs the selected microphone track label, state, muted/enabled flags, and browser track settings.
- Logs maximum live peak/RMS observed during the recording.
- Keeps native MediaRecorder and Play my recording from 0.5.0.

## Test
1. Tap Bluey.
2. Speak normally for 3–5 seconds.
3. Watch for `Microphone: hearing you` and movement in the level bar/Bluey.
4. Tap Bluey to stop.
5. Play the recording.
6. In the browser console copy `Bluey microphone track` and `Bluey live microphone summary`.

If livePeak/liveRms are zero, the browser microphone stream itself is silent. If they are healthy but playback is silent, the recording layer is the next target.
