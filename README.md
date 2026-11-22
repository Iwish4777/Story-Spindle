# Story Spindle
# Story Spindle — Weave the threads of your story

**Story Spindle** is a browser-based, entirely AI-free workspace for developing and writing a novel. This themed release incorporates the supplied vintage spinning-wheel banner and complements it with parchment, warm walnut, bronze, and ink-inspired colors.

The app includes plot planning, character profiles, a worldbuilding encyclopedia, story ending, themes, chapter outlines, a manuscript editor, a word parking lot, a Strings inspiration notebook with rule-based pairing suggestions, a Story Trees visual connection explorer, daily writing/activity tracking, customizable goals, guided exercises, and rule-based continuity checks. It uses plain HTML, CSS, and JavaScript: **no AI, machine learning, third-party scripts, trackers, or accounts**. The optional Openverse image search and images selected from it use the internet; other features work locally.

## Open the app

1. Unzip `story-spindle-themed-build.zip`.
2. Open `index.html` in a modern desktop browser.
3. If the browser restricts saved data on `file://` URLs, serve the folder locally instead:

   ```bash
   cd story-spindle
   python3 -m http.server 8000
   ```

   Then visit `http://localhost:8000`.

You can deploy the same files to GitHub Pages or another static host. No build process is required. The banner and spinning-wheel mark are included; you don't need to add image files manually.

## The design

- `assets/story-spindle-banner.jpg`: the **original banner you supplied**, included as the dashboard's full-width visual (with no text overlay or forced crop).
- `assets/spindle-mark.PNG`: your custom Story Spindle PNG icon used for the sidebar, browser favicon, and Apple touch icon.
- `styles.css`: parchment backgrounds, walnut sidebar, bronze accents, high-contrast writing controls, and layouts for desktop/mobile.
- Body and writing fonts use locally installed system fonts, not web font services.

To change the banner later, replace `assets/story-spindle-banner.jpg` with another image at the same filename. A replacement with a similar 16:9 aspect ratio will work best.

## Saving and backups — important

Story Spindle currently saves automatically into **this browser's `localStorage`**, not to a cloud service. Download JSON backups frequently using **Back up** or **Project & backup**; a browser can clear site data or evict storage.

- The browser storage key remains `story-studio.v1` from the initial Story Studio build, deliberately unchanged so upgrading the design on the **same website address/origin** can retain existing work.
- Browser storage is scoped to the page's origin: opening a differently located file, changing hostnames, switching browsers, or moving between computers may not show the old projects. Use **Import a project** with a downloaded JSON backup when needed.
- Backup files from the previous Story Studio version remain compatible. The backup's internal format identifier is intentionally unchanged.
- Manuscript export downloads all drafted chapters as a `.txt` file.

This is a functional prototype, not a production-hardened manuscript storage system. Keep independent copies of anything you value.

## Writing tools added in November 2026

- **Live manuscript word counts:** Each chapter's count is displayed in the chapter outline and Writing desk. The Writing desk shows the overall manuscript total, updating as you type; Overview also shows the total. Only chapter `manuscript` fields are counted. Chapter titles, plot/outline notes, and any future separately stored table of contents or other front matter do not enter the total. If you manually type a heading or table of contents into a chapter manuscript box, it counts as manuscript text because the app cannot reliably guess the author's intent.
- **Word parking lot:** Each novel has a separate list of intriguing words or short expressions with definition and notes. The app counts exact case-insensitive matches in drafted manuscript text to help you find where a word has been used, but does not judge whether a use was intentional.
- **Strings:** Store brief snippets, freeform notes, and comma-separated tags. Manually link any two Strings and record connection notes. The "Possible pairings" section surfaces common tags and significant words; "Unexpected pairing" gives you unlinked, non-overlapping snippets to consider. No semantic inference, AI, or text generation is involved.
- All three features are per-project and included in local autosave and JSON backup/import. Previously saved projects are upgraded in place when loaded, preserving old sections and content.

## Story Trees — visual story connections

**Story Trees** is a new app tab that automatically visualizes existing project structures as a network.

- **Story elements:** Main and supporting characters, chapter outlines, plot events, knowledge milestones/revelations, worldbuilding entries, themes, saved Strings, and a story ending when present.
- **Automatic edges:** Chapter character assignments, recorded first appearances, plot-to-chapter assignments, revelation-to-character and revelation-to-chapter links, facts used in chapters, and saved String connections.
- **Literal matching:** Worldbuilding entry names in a chapter's *location* field; theme names in a chapter's *theme/purpose* field; and character names in other characters' *relationship notes*. These are labeled as text matches or mentions, not as confirmed story relationships.
- **Manual edges:** Create a link between any two entries with a relationship label and notes. The dashed edges are saved in `storyTreeLinks` and included in local storage and JSON exports/imports.
- **Explore:** Click or keyboard-select an SVG node to focus on its direct connections. Filter by section, jump to a source editing section, or view the entire network. A broad overview displays at most 72 entries to maintain readability; the focus menu can reach entries beyond the preview limit.
- **AI-free:** All nodes and automatic links come from explicitly saved fields and deterministic text matching. The app does not attempt to understand full manuscript prose or infer implicit meaning or relationships.

The diagram updates when you open it after editing story details. Deleting an underlying entry hides its old graph connections; a manual connection to a deleted entry is left in the connection list, labeled as a deleted entry, so it can be removed deliberately.

## Progress dashboard and writing goals

The homepage includes a dedicated manuscript word-count card, word/milestone progress, chapters with writing started, today's words added and tracked minutes, seven-day activity, consecutive-day streak, and a quick view of goals. Word-count badges on the Writing page sit at the bottom-right of the chapter editor with chapter, total manuscript, and character counts.

Use **Goals** for built-in daily word targets (250/500/1000 words), writing-time targets (15/30/60 minutes), and creative milestones such as finishing a scene, improving dialogue, or planning a chapter. You can create a custom **daily word**, **daily time**, or **manual completion** goal. Daily goals refresh based on your device's local date; individual milestone goals stay checked when completed.

- **Daily words added** is measured from positive whole-word changes to chapter manuscript fields in the current browser. It's not a historical word-count delta: deleting and retyping words may increase the activity count. Word counts in the manuscript themselves always reflect the actual current text.
- **Writing time** is recorded only while the writer manually starts a timer and the browser tab is visible. The timer pauses if the tab is hidden, on closing the browser, or when switching novels. It may count pauses when the tab is visible because it cannot determine whether the writer is actively composing. Timed sessions are saved locally; automatically recorded time is rounded down to full minutes for display; the minute-based goal can complete as soon as its full target duration is reached. If a browser closes unexpectedly, up to a few seconds of unsaved timer time may be lost.
- Activity history starts with this feature; **no past sessions are guessed**, and no cloud analytics or third-party tracking occurs. Use JSON backups to preserve goals and activity. As with the rest of Story Spindle, switching browsers or clearing site data can lose local progress.

## What the AI-free continuity checker checks

- Chapter sequence and numeric story-day ordering, with flashback exceptions.
- Character appearances tagged earlier than their recorded introduction.
- Manually tracked knowledge milestones referenced before they are learned.
- User-defined watched phrases in manuscript text.
- Simple possible eye/hair-color mismatches in sentences mentioning a character.

It cannot reliably interpret unrestricted prose. Every result is a **possible** issue for the author to review; it may miss contradictions or flag descriptions of another character. No generated text or AI analysis is used.

## Files

- `index.html` — app shell
- `app.js` — data, screens, guided exercises, rule-based checks, saves, imports, exports
- `spindle-features.js` — Word parking lot, Strings, and deterministic pairing suggestions
- `spindle-progress.js` — Daily writing activity, manual timers, milestones, goal presets, and progress dashboard
- `spindle-trees.js` — Visual relationship map, deterministic auto-links, and saved custom connections
- `styles.css` — responsive design
- `assets/story-spindle-banner.jpg` — supplied banner
- `assets/spindle-mark.PNG` — user-supplied PNG brand icon

## Future improvements

A more resilient local storage system, versioned backups/undo, optional offline PWA installation, accessibility testing, structured world-rule checks, and timeline visualization would all be good next steps—without adding AI.
