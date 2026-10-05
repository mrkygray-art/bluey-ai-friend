# Bluey 0.6.3 — Character Motion Pass

Built from the stable 0.6.2 voice baseline.

## Goal
Make Bluey feel less like a UI indicator and more like a lovable animated character through motion and timing.

## Character behavior
- Idle: uneven, gentle breathing/floating rather than mechanical bobbing.
- Listening: alert, eager motion that visibly reacts while the mic is active.
- Thinking: slower side-to-side pondering motion.
- Speaking/responding: conversational rhythmic motion.
- Attention: anticipation -> pop up -> overshoot -> settle.
- Happy reaction: a small celebratory bounce after conversational activity.
- Warmer randomized idle lines and playful thoughts.
- Existing “I'm busy / not now” back-off behavior remains.

## Important
The stable 0.6.2 click behavior, 0.5.5 cross-browser microphone capture, and 0.5.4 transcription path are preserved.

The character work uses general animation principles such as anticipation, squash/stretch, overshoot, asymmetry, and settle. It does not copy a specific studio character or animation.
