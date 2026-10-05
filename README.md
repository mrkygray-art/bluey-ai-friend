# Bluey 0.7.1 — First Meeting

## Goal
The relationship should begin naturally. Bluey's name is not permanently pasted onto the interface.

## First visit
Bluey notices the visitor, approaches through character motion, and changes the hero greeting:
1. “Oh! Hi there...”
2. “Hi! I'm Bluey. 💙”
3. “You can talk to me or type whenever you want. What should we do first?”

Bluey does **not** immediately ask for the visitor's name. Their name can arise naturally in conversation.

## Returning visits
Bluey recognizes that this browser has visited before and performs a short recognition animation with a randomized greeting such as:
- “Hey, you're back. Good to see you.”
- “Oh, hey! Good to see you again.”
- “There you are. What are we getting into today?”

The normal hero greeting returns afterward.

## Privacy / storage
Only a lightweight `bluey_met_v1=yes` flag is stored in localStorage. No visitor name or other personal information is silently persisted.

## Preserved
- Bluey 0.7 emotional/reaction states
- 0.6.4 seasonal wardrobe
- character motion
- Chrome/Firefox microphone capture
- stable transcription pipeline
- quiet/busy behavior
- conversational “Who is Bluey?” response
