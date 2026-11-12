# AR Space Cards (Space Store India)

Bedside AR space-learning cards for children in long-term hospital care. Runs in a tablet's browser: no install, no login, and no data leaves the device.

## Run it

```bash
npm start
```

Then open http://localhost:5173. Try **Demo** mode first: it shows the AR working on virtual cards, with no printing or camera needed.

The camera only works on `localhost` or over HTTPS, so to use a real tablet the app must be hosted (see Deploying).

## What is in the product

| | |
|---|---|
| **10 cards** | Solar System, Earth, Moon, Sun, Mars, Jupiter, Saturn, Space Station, LVM3 rocket, Chandrayaan-3 |
| **3 levels** | Explorer (Grades 3–5), Navigator (6–8), Scientist (9–12), switchable mid-session |
| **Language** | English, with read-aloud. Hindi is planned next |
| **3 ways to view** | Camera (AR on a printed card), 3D (no card or camera), Demo (virtual cards) |
| **5 concept missions** | Predict → observe → explain: day and night, seasons, Moon phases, distance and scale, gravity in orbit |
| **3 labs** | Kepler's laws, Mars trip planner, two-card gravity lab |
| **Card combinations** | The Sun card lights the other cards; moving the Earth card around the Sun card drives the seasons; the gravity lab measures the real gap between two cards |
| **Teacher area** | Anonymous sessions, mood rating, before/after concept check, results dashboard, CSV export, bedside guide |
| **Printable deck** | `print.html`: A4 (4 per page) or A6, with a QR "Start here" card |
| **Offline** | The app stores itself on the tablet on first load and then works with no Wi-Fi |

## Documents

- [docs/STARTUP_STRATEGY.md](docs/STARTUP_STRATEGY.md): recommended changes to make this fundable
- [docs/TEACHER_GUIDE.md](docs/TEACHER_GUIDE.md): for hospital teachers and volunteers
- [docs/LESSON_PLANS.md](docs/LESSON_PLANS.md): a 15-minute plan per card
- [docs/CONTENT_SOURCES.md](docs/CONTENT_SOURCES.md): fact-review checklist and licences

## What has and has not been tested

Tested, in a desktop browser:

- Every card, mission and lab runs at Explorer and Scientist level without errors.
- Marker tracking on a simulated camera: correct card identified, position within about 2% of camera distance.
- The two-card seasons mission and gravity lab, by moving virtual cards.
- The teacher flow: session, mood, before/after check, results.
- Offline: with the server stopped, the app reloaded and ran from its stored copy.

**Not yet tested:**

- A real camera with printed, laminated cards under ward lighting. Do this before calling the kit pilot-ready.
- Real tablets (older Android, iPad Safari), including speed and battery use.
- Read-aloud voices on the target tablets (they depend on the voices installed).
- The facts have not been reviewed by a scientist.

## Changing things

- Card and mission text: `content/cards.js`, `content/missions.js`.
- After changing any file, run `npm run build` so tablets pick up the new version offline.
- `npm run vendor` re-copies the third-party libraries from `node_modules`.

## Deploying

It is a static site: upload the folder (without `node_modules`) to any HTTPS host. Cloudflare Pages, Netlify and Vercel can all deploy from a private GitHub repository; GitHub Pages needs a paid plan for private repositories. Put the final address into `print.html` so the QR code on the "Start here" card points to it.

## Layout

```
content/      card, mission and guide text
js/scenes/    the 3D scenes
js/tracker.js marker tracking (runs on the device)
js/player.js  camera / demo / 3D stage and the mission flow
js/app.js     home, deck, missions, teacher area
js/sim.js     virtual camera for Demo mode
print.html    printable deck
sw.js         offline support
vendor/       three.js, js-aruco2, qrcode-generator (MIT)
tools/        local server, build and vendoring scripts
```
