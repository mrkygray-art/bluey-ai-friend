# Bluey 0.5.5 — Firefox Voice Compatibility

Chrome's full voice pipeline is already confirmed working. This build preserves that path and adds browser-aware recording for Firefox.

- Chromium prefers WebM/Opus.
- Firefox prefers Ogg/Opus when supported.
- Upload filename matches the actual recorded container.
- The 0.5.4 server-side OpenAI upload fix remains unchanged.
- Microphone mute/audio diagnostics remain hidden in the UI.
- Console logs the selected recorder format and upload handoff.

Test Chrome first to confirm no regression, then Firefox.
If Firefox fails, capture the newest:
`Bluey recorder selection`
`Bluey upload handoff`
`Bluey transcription upload prepared`
`Bluey transcription server error`
