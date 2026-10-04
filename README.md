# Bluey 0.4.6

## Cross-browser microphone change
The repeated 1,063-byte WebM file showed that MediaRecorder was not producing a usable recording in our deployed path.

0.4.6 removes MediaRecorder from Bluey's microphone path.

New flow:
1. `getUserMedia()` captures the microphone.
2. Web Audio captures mono PCM samples.
3. Bluey creates a real WAV file in the browser.
4. The WAV is uploaded as `bluey.wav`.
5. Vercel sends that file to OpenAI transcription using the official OpenAI Node SDK.

This gives us a deterministic audio container rather than depending on browser WebM/Opus finalization.

The browser console logs:
- duration
- WAV byte size
- sample rate
- PCM chunk count

The Vercel `/api/transcribe` log should now show `audio/wav`, `bluey.wav`, and a file substantially larger than 1,063 bytes for a several-second recording.

## Vercel
Required: `OPENAI_API_KEY`
Optional: `BLUEY_MODEL`, `BLUEY_TRANSCRIBE_MODEL`
