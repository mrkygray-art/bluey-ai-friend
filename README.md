# Bluey 0.6.0 — Personality & Meaningful Motion

Built from the working Bluey 0.5.5 cross-browser voice baseline.

## New
- Explicit cross-browser orb animation states: idle, listening, thinking, speaking, attention.
- Chrome and Firefox now use the same CSS/JS animation system rather than relying on incidental browser animation differences.
- Idle check-ins after about one minute.
- A second, less intrusive personality/fun thought after longer inactivity.
- Bluey backs off when the user says they are busy, working on something else, asks for time, or says not now.
- Foundation for the future “Who is Bluey?” feature through `window.blueyAbout`.
- Respects the operating system/browser reduced-motion preference.

## Protected
The working 0.5.5 microphone capture and 0.5.4 server transcription architecture are preserved.

## Test
1. Chrome: voice conversation still transcribes and answers.
2. Firefox: voice conversation still transcribes and answers.
3. Watch Bluey while idle, listening, and thinking; motion should now be obvious in both browsers.
4. Leave Bluey untouched for ~1 minute and confirm a gentle check-in appears.
5. Tell Bluey “I'm working on something else” and confirm it backs off.
