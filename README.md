# Bluey 0.6.2 — JavaScript Startup Fix

## Root cause found
0.6.0 added the personality/state layer with a second declaration of:

`let idleStage = 0`

The original Bluey code already had an `idleStage` variable in the same script. JavaScript treats that as a parse-time SyntaxError (`Identifier 'idleStage' has already been declared`).

Because the browser could not parse the script, **none of Bluey's JavaScript initialized**, including the click/listen handler. That is why changing pointer/click behavior in 0.6.1 did not solve it.

## Fix
- Renamed the new personality timer state to `personalityIdleStage`.
- Preserved the original idle system.
- Preserved the 0.6 animation states.
- Preserved the proven 0.5.5 microphone and 0.5.4 transcription pipeline.
- Preserved stable click + keyboard activation.

## First test
1. Load 0.6.2.
2. Click Bluey once — it should immediately enter listening mode.
3. Speak.
4. Click Bluey again — transcription should run and Bluey should answer.
5. Then compare idle/listening/thinking movement in Chrome and Firefox.
