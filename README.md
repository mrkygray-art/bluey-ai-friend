# Bluey 1.0 Alpha 2 — The Living World

Bluey now has a world and a life, not just an interface.

## Six connected systems
- **Character Engine:** existing personality, body language, comedy, dancing and lore.
- **World Engine:** Home, Archive, Observatory, Workshop, Library, Arcade, Quiet Place and The Edge.
- **Life Engine:** journal, adventures, digital finds and idle thoughts.
- **Story Engine:** first interactive branching Bluey story.
- **Play Engine:** Mystery Object game and physical celebration.
- **Surprise Engine:** rare Orbit visits, discoveries and thoughts.

## New things to try
- “Show me your world.”
- “Take me to the Observatory.”
- “Take me to The Archive.”
- “Tell me a story.”
- “Play Mystery Object.”
- “Show me your journal.”
- “Do you dream?”
- “Teach me about black holes.”
- “Teach me about orbit.”
- “What's beyond The Edge?”
- “What do you do here?”

## Design principle
Bluey's digital home stays visually simple. Places are atmospheric states rather than cluttered rooms. Objects, discoveries and surprises appear temporarily, keeping Bluey himself at the center.

## Existing systems preserved
Voice/transcription, Chrome/Firefox microphone behavior, holidays, birthday, seasonal rare scenes, Character Engine, dances, collections, Pixel One, marbles, imagination and personality canon remain in place.

## Alpha 2 — Environmental Storytelling
- Each world now has a small visual vocabulary rather than becoming a conventional room.
- Library: books/bookmark.
- Archive: floppy disk, 404 and hourglass.
- Observatory: sparse stars/orbital marks.
- Workshop: gear and geometric build pieces.
- Arcade: pixel shapes and a subtle HIGH SCORE cue.
- Quiet Place: intentionally minimal.
- The Edge: remains dramatically sparse.
- Arrival copy is location-specific.
- “Where are we?” is now location-aware.
- Rare location-specific physical gags added.

### Thinking travel
Bluey distinguishes **conversation** from **thinking**. Casual conversation leaves him where he is. More substantial “how/why/explain/debug/build/solve” questions can trigger a brief visual trip from Home to the Library or Workshop while he works on the answer, followed by a return Home. This is presentation behavior only and does not replace the normal answer pipeline.


## 1.0 Alpha 4 — Learning Through Friendship
- Clearer stage clues: Library books, Workshop/office screen + gear, Arcade joystick + star, Observatory telescope + star, Archive floppy + 404.
- “Show me your office” now physically takes Bluey to his Workshop/office and leaves the stage there.
- Invisible request coach asks one natural clarifying question only when it materially improves an underspecified task.
- Work visualization shows simple GOAL/AUDIENCE, OPTIONS/CRITERIA, or GOAL/BUILD chips during thinking trips. These are task-state cues, not private reasoning.
- Recovery behavior turns “that isn't what I wanted” into a friendly idea/tone/details refinement.
- Lightweight local relationship progress records wins, revisions, questions and place visits.
- Rare travel overshoot adds fallible physical comedy without making every trip a gag.
- Server character canon now explicitly treats the Workshop as Bluey's office and reinforces teaching-without-teaching.


## Bluey 1.0 Alpha 5 — Growing Together

This build reconnects Bluey's character/world work to the original mission: help ordinary people get better results from AI without turning the experience into a prompting course.

### Invisible Prompt Coach
Bluey now notices several underspecified task patterns and asks one natural, useful question before doing low-quality generic work:
- email → audience + desired action
- resume → target role + strongest relevant achievement
- comparison → decision criteria
- vacation → destination + budget + pace
- design improvement → current artifact + reference
- long-document summary → what the user actually needs to find

### Work Visualization
The Workshop and Library can briefly surface task-level concepts such as GOAL, AUDIENCE, CRITERIA, SOURCES, CHECK and RETRY. These are not hidden reasoning or chain-of-thought; they are simple visual teaching cues.

### Mistakes & Recovery
When the user says a result missed, Bluey wobbles and asks whether the idea, tone or details were wrong instead of blindly regenerating.

### Verification Habit
Requests to verify or double-check send Bluey to the Library and reinforce checking important claims rather than trusting first-pass output.

### Growing Together
Successful “that worked” moments are stored locally. The Workshop can acquire a few temporary keepsakes representing things Bluey and the user have accomplished together. No XP bar, streak pressure or gamified score is shown.

Try:
- “Bluey, write me an email.”
- “Make me a resume.”
- “Compare these two.”
- “Plan a vacation.”
- “That’s not what I wanted.”
- “Double-check the important parts.”
- “That worked!”
- “Show me what we’ve done together.”
- “Show me your office.”


## Bluey 1.0 Alpha 6 — Curiosity Is The Interface

### World Object Engine
Meaningful objects shown in Bluey's locations are now queryable. Users can ask naturally about the wrench, box, telescope, floppy disk, books, gear, cloud, cable, and other visible props. Answers deepen through follow-up curiosity rather than dumping a lesson up front.

Design rule: **if you can see it, you can ask Bluey about it.**

Objects can have:
- a short Bluey-style explanation
- a deeper factual/AI-literacy layer
- a rabbit-hole invitation
- lore/history
- uncertainty when Bluey genuinely does not know

### Discoverable rooms
Bluey's world now includes:
- Garage — experiments, prototypes, unfinished ideas
- Attic — old technology and memories
- Closet — holiday costumes and appearance
- Backyard — seasons, nature and weather
- Basement — cables and mysteries

These rooms are discovered conversationally rather than through a giant navigation menu.

### Hunch Engine expansion
Well-specified task requests can receive subtle positive reinforcement instead of Bluey constantly correcting the user.

### Task specification visualization
“Bluey, show me what you heard” uses Workshop tokens to show task-level concepts such as GOAL, AUDIENCE, TONE, CONSTRAINTS, CRITERIA and MATERIAL. This is task specification, not private chain-of-thought.
