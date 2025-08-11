# PopSim ASCII Web (No-Server)

A minimal, dependency-free ASCII web app version of PopSim. No frameworks, no build, no server. Open `index.html` directly in your browser.

- 100% ASCII (monospace)
- Zero external dependencies
- Single-page app with split files: `index.html`, `styles.css`, `sim.js`, `ui.js`, `controls.js`, `main.js`
- Keyboard controls closely mirror the TUI version

## Quick Start

Option 1: Double-click `index.html` (most browsers will run it locally).

Option 2: Use a tiny local server (helps if your browser blocks local JS):

```bash
python3 -m http.server 8080
# then visit http://localhost:8080/AnimalPopulationSim/webapp/index.html
```

## Controls

- Space: pause/resume
- r: reset
- Tab / ↑ / ↓: select species
- Enter: +10 to selected
- ← / →: adjust growth for selected
- [ / ]: adjust death for selected
- - / +: slower/faster
- n: toggle noise

## Layout

- Two-column layout:
  - Left (1/3 width): Controls (~10% height), Stats (~20%), Species (list + input + info, ~50%), Log (~20%).
  - Right (2/3 width): Visualization area with tabs (Mix, Graph).
- Mix tab shows an ASCII bar proportional to species mix; Graph tab shows an ASCII stacked graph over recent history.
- The log prints a periodic rate summary.

## Notes

- Rendering is ASCII in a <pre> area sized to about 100 characters width.
