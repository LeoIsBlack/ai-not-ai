# AI not AI — portfolio site

Single-page portfolio for an AI video studio. Plain static site: no build step, no
package manager, no dependencies, no tests. Open `index.html` in a browser to run it.

## Files

- `works.js` — all editable content: `SITE` (brand name, contacts) and `WORKS` (the
  portfolio entries). The owner edits this file by hand, so keep it simple and keep
  its Russian how-to comments accurate when fields change.
- `index.html` — page markup and all static copy (hero, services, process, footer).
- `app.js` — all behaviour, in one IIFE: video URL parsing, the custom YouTube player,
  cards, category filters, the viewer modal, contacts, scroll and hover effects.
- `style.css` — all styles, split into commented sections (`/* ---------- Name ---------- */`).
  Design tokens are CSS variables on `:root`, with a dark set under
  `prefers-color-scheme: dark`.
- `covers/`, `videos/` — local card covers and self-hosted videos.

## Rules that are easy to miss

- **Bump the cache version.** `index.html` loads CSS, JS and icons with
  `?v=YYYYMMDDHHMM`. After changing `style.css`, `app.js`, `works.js` or a favicon,
  set all of those `?v=` values to the current timestamp, otherwise visitors keep
  the old files.
- **Language.** Everything a visitor sees, and all code comments, are in Russian.
  Use `&nbsp;` after short prepositions and around dashes in HTML copy, as the
  existing text does. Commit messages are in English, one plain sentence.
- **JavaScript style.** `app.js` is ES5-style: `var`, `function` expressions, no
  arrow functions, classes, template literals or modules. Build DOM with the `el()`
  helper and `textContent`; `innerHTML` is used only for the fixed SVG icons.
- **Adding a work** means adding an object to `WORKS` only. Cards, filters (built
  from the distinct `category` values) and the `site/#id` deep link follow from it.
  `video: ""` renders a "Скоро" card. `cover` is optional for YouTube.
- **The phone number is written in three places:** `SITE.whatsapp` in `works.js`,
  the contact lead in `index.html`, and the footer contact label in `app.js`.
  Change all three together.
- **The logo SVG is duplicated** in the header and footer of `index.html` (mask ids
  `logo-cut-a` / `logo-cut-b` must stay unique) and again as `favicon.svg`,
  `favicon.png` and `apple-touch-icon.png`.

## The YouTube player

`mountYouTube()` in `app.js` hides YouTube's own interface behind a custom control
layer. Several things there look odd but are deliberate:

- The iframe is rendered oversized and scaled back down with the `--k` CSS variable
  so YouTube picks 480p for fast loading.
- Playback stops 0.4 s before the end so YouTube's recommendations never appear.
- If autoplay with sound is blocked, it retries muted and shows a "Включить звук"
  button; if the custom layer cannot start playback, `is-native` lets the tap
  through to the real player; if the iframe API fails to load, a plain embed is used.
- On touch screens the first tap shows the controls and the second one pauses.

Player state lives in classes on `.player` (`is-cover`, `is-loading`, `is-playing`,
`is-active`, `is-automuted`, `is-native`, `is-error`), styled in the
"Собственный плеер" section of `style.css`.

## Layout and motion

- Scroll-in animation: add class `reveal` to an element; `app.js` toggles
  `is-visible` / `from-top`. Hero elements use `anim` with a `--d` delay in ms.
- Every animation must respect `prefers-reduced-motion` (CSS section near the end
  of `style.css`, `reduceMotion` in `app.js`).
- Check changes at phone width, in landscape, and in both light and dark themes;
  `style.css` has dedicated sections for tablets, phones, small phones and low screens.
