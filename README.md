# Bluey 0.6.1 — Orb Click Fix

Hotfix for 0.6.0.

The new state animations moved the actual orb button. Bluey was still wired to start listening on `pointerup`; in some browsers the animated button can move between pointer-down and pointer-up, so the activation event is lost.

## Fix
- Uses the stable `click` event to activate Bluey.
- Keeps keyboard Enter/Space activation.
- Removes inline transform press behavior that competed with state animations.
- Keeps all 0.6 meaningful-state movement and personality features.
- Does not change the working microphone/transcription pipeline.

Test: click Bluey once -> listening; click again -> stop/transcribe.
