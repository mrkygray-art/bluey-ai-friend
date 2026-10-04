# Bluey 0.5.3 — Clean Voice Conversation Test

The microphone issue was isolated successfully in 0.5.2. This build returns Bluey to a clean user-facing experience.

## Changes
- Removes the large developer microphone diagnostic panel from the visible UI.
- Removes the visible playback test panel.
- Keeps live microphone analysis and detailed diagnostics in the browser console.
- Keeps the working native MediaRecorder capture pipeline.
- Keeps the normal listening message: “I’m listening. Tap Bluey when you’re done.”
- If no audio is detected, Bluey now suggests checking whether the microphone is muted.
- Restores the conversation area as the focus so speech transcription and Bluey’s answer are visible.

## Test
1. Make sure the microphone is not muted.
2. Tap Bluey.
3. Say: “Bluey, tell me something interesting about elephants.”
4. Tap Bluey again.
5. Confirm the spoken words appear as the user message.
6. Confirm Bluey answers.
7. If transcription fails, use the newest Vercel `/api/transcribe` error; the browser console also retains capture diagnostics.
