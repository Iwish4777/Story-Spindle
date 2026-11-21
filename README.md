# Story-Spindle
Writing workshop
README
# Story Spindle — Weave the threads of your story

**Story Spindle** is a browser-based, entirely AI-free workspace for developing and writing a novel. This themed release incorporates the supplied vintage spinning-wheel banner and complements it with parchment, warm walnut, bronze, and ink-inspired colors.

The app includes plot planning, character profiles, a worldbuilding encyclopedia, story ending, themes, chapter outlines, a manuscript editor, guided exercises, and rule-based continuity checks. It uses plain HTML, CSS, and JavaScript: **no AI, machine learning, third-party scripts, trackers, accounts, or network requests**.

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
- `styles.css` — responsive design
- `assets/story-spindle-banner.jpg` — supplied banner
- `assets/spindle-mark.PNG` — user-supplied PNG brand icon

## Future improvements

A more resilient local storage system, versioned backups/undo, optional offline PWA installation, accessibility testing, structured world-rule checks, and timeline visualization would all be good next steps—without adding AI.
