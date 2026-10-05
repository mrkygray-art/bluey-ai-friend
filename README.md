# Bluey 1.0 Alpha 36 — A Helpful Friend With Real Tools

Bluey now has a world and a life, not just an interface.

This bundle carries forward the Bluey world, its tools and interaction features, adds a guided prompt-building loop, and includes a persistent lower-right version label.

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

## Bluey 1.0 Alpha 7 — Helpful tools, still Bluey

- **Create real files:** ask Bluey to create an Excel spreadsheet (`.xlsx`), Word document (`.docx`) or PDF. A download link appears in the conversation.
- **Ask about photos:** use the blue **Add photos** arrow to attach up to five pictures. Bluey can describe them, read visible text, and use the photos in a generated Word document or PDF.
- **Choose how Bluey sounds:** Voice and Sounds switches are independent and saved on the device. Voice turns speech on or off; Sounds controls Bluey's short electronic chirps and beeps.
- **Spelling help:** the composer enables the device's spelling suggestions, and Bluey may offer a clickable correction when a typo clearly changes meaning.
- **Adaptive clarification:** Bluey asks for useful missing details conversationally, then makes a practical first version.
- **Temporary room props:** interactive items fade away after a short visit, and room changes clear the old scene.

The document endpoint uses the existing `OPENAI_API_KEY` and optional `BLUEY_MODEL` settings. Production installs the `docx`, `pdfkit` and `xlsx` package dependencies from `package.json`.

## Bluey 1.0 Alpha 8 — The stage is Bluey's world

- Office, Arcade, and other visible room objects render inside the stage rather than the scrolling conversation.
- Bluey can swoosh side to side through the stage during a quiet moment. Tapping Bluey or the stage brings him front and center for a playful bounce before he waits for the next instruction.
- Short chirps line up with listening, travel, happy, unsure, upload, and response movement cues. The Sounds control remains independent from Voice.
- Stage movement pauses when the page is hidden, while Bluey is speaking, or during a response.

## Bluey 1.0 Alpha 9 — Fresh answers, familiar Bluey

- A rotating, device-local response collection gives fresh replies to common character questions, greetings, room visits, jokes, fun facts, and AI-coaching questions. It avoids the last few answers for that topic.
- Clicked and asked-about room objects get rotating conversational lead-ins and varied follow-up framing.
- The AI uses the conversation to avoid repeating recent wording, examples, and jokes. It can answer repeat questions from a new angle without changing facts.
- A gentle per-turn style nudge helps Bluey vary his answer shape while keeping requested formats and serious answers clear.
- The existing Alpha 7 and Alpha 8 document tools, photo support, voice and sound controls, room stage, and motion are retained.

## Bluey 1.0 Alpha 10 — Photos and a ready-to-chat screen

- The message box, photo button, and voice/sound controls remain available after a refresh, before the first message.
- Selected photos show a thumbnail and can be removed before sending. Bluey keeps recent photos available for follow-up questions during the same page session.
- Photo replies now confirm how many images reached the vision request. If the count does not match, Bluey shows an error and keeps the selected images so they can be retried.
- The chat endpoint attaches supported image data to the latest user message and returns the accepted image count.
- Alpha 7 document creation, Alpha 8 stage behavior, and Alpha 9 response variation are retained.

## Bluey 1.0 Alpha 11 — A visible version and spoken replies

- A small, pale “Bluey 1.0 Alpha 11” label stays in the lower-right corner on desktop and mobile.
- All assistant chat messages, including local character replies and file-creation confirmations, use the Voice setting. Existing direct speech calls are deduplicated so a reply is not restarted twice.
- The browser speech engine is resumed on the user's send action and when Bluey speaks, improving playback reliability on mobile browsers.
- Alpha 10's refresh-ready composer, photo preview and image-receipt confirmation remain included, along with Alpha 7–9 tools and character features.


## Bluey 1.0 Alpha 12 — Photo handoff diagnostics

- The screenshot showed the Alpha 11 page retained the photo, but the live chat server did not return the image receipt fields. This indicates the page and `/api/chat` were out of sync.
- The chat endpoint now reports how many photo uploads arrived, how many passed image validation, and its photo API version. The page gives a specific message when the live endpoint is outdated or rejects an image.
- To deploy photo support, upload the complete Alpha 12 project, including the `api` folder and `api/chat.js`, then redeploy. Updating only `index.html` and browser scripts will leave the photo API on its older version.
- Alpha 10 composer and preview fixes, Alpha 11 voice routing and version badge, and the earlier document, stage, and response features remain included.

## Bluey 1.0 Alpha 13 — Mobile voice check

- Turning Voice on plays a short test line so the user can confirm audio on the current device.
- Speech playback errors are shown in the page with practical phone volume and text-to-speech checks instead of only going to the browser console.
- The existing Alpha 12 photo API handoff and photo analysis remain included. Deploy the full bundle so the updated page, `alpha13.js`, and `api/chat.js` are all live together.

## Bluey 1.0 Alpha 14 — Prompt Workshop

- Users can start from the **Build prompt** button beside Add photos or ask naturally for help writing, creating, or improving a prompt. Requests about getting better results with AI also open the workshop.
- Bluey first suggests a practical approach, then asks up to three targeted questions total when the answers would improve the prompt. He skips questions that are not needed and drafts using clearly marked assumptions when appropriate.
- The prompt card offers editable Quick, Balanced, and Detailed versions, with copy and try actions.
- After trying the prompt, users can say what they want changed; Bluey refines the prompt using that feedback and the latest result.
- A small, optional coaching note points out one useful prompting choice without turning the conversation into a lesson.
- Bluey speaks as himself (“I” and “me”) instead of describing himself as AI; his welcome and capability wording use his name and first-person voice.
- Prompt Workshop uses the new `/api/prompt-workshop` endpoint and the existing `OPENAI_API_KEY` and optional `BLUEY_MODEL` configuration. Deploy the whole project, including `api/prompt-workshop.js`, `alpha15.js`, and `alpha15.css`.
- Alpha 13 voice test and diagnostics, Alpha 12 photo analysis and receipt checks, document creation, stage interactions, and response variety are retained.

## Bluey 1.0 Alpha 15 — Bluey speaks as Bluey

- In the Prompt Workshop, Bluey suggests a practical approach first, then asks up to three targeted questions total when they will improve the prompt. He asks fewer when enough is already clear.
- Requests like “Teach me how to get better results from AI” now open the Prompt Workshop, where Bluey answers from his own point of view and helps tailor a prompt.
- Bluey uses first-person wording (“I” and “me”) instead of describing himself as AI. Direct questions about AI still get a clear, honest answer.
- Chat replies use plain text so Markdown markers such as literal asterisks do not appear in the conversation.
- Alpha 14's editable prompt drafts, copy and try actions, and refine loop remain included.


## Bluey 1.0 Alpha 36 — Voice that works on phones

- Spoken replies are generated by the server and played through the phone's audio system. This avoids relying on a phone having a browser speech voice installed. The browser's speech engine remains a fallback.
- The Voice control now runs a real spoken test; each reply has a **Play again** button. Muting Voice stops an active reply. Sound effects remain a separate setting.
- A short audio unlock begins on the Send tap to support mobile browser playback rules. Voice errors are surfaced in the page instead of silently showing Voice: On.
- Text conversations are saved on the current device and restored after refresh. **New chat** clears the local conversation, and **Save chat** downloads a plain text transcript. Copy and replay controls are available below Bluey's replies.
- Ctrl/Command + Enter sends the current message. Touch targets and focus indicators are improved for mobile and keyboard use.
- This bundle keeps photo analysis, Word/PDF/Excel creation, voice transcription, the interactive stage, prompt workshop, and Bluey's first-person personality.

### Alpha 36 voice deployment

Upload the complete bundle, including `api/speech.js`, `alpha36.js`, and `alpha36.css`, then redeploy. The speech function uses the existing `OPENAI_API_KEY`; optional settings are `BLUEY_SPEECH_MODEL` (defaults to `gpt-4o-mini-tts`) and `BLUEY_SPEECH_VOICE` (defaults to `coral`). Spoken replies use the OpenAI speech endpoint, so speech usage is billed separately from text chat. Keep the API key in the hosting provider's server-side environment settings; never put it in browser code.
