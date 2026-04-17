# GovAgent Panic

Live: [tengfone.github.io/GovAgentPanic](https://tengfone.github.io/GovAgentPanic/)

GovAgent Panic is a static browser game about surviving five workdays inside a chaotic government AI platform office. You defend the sovereign AI core in real time while incidents, audits, political disasters, token burn, and boss fights pile up around you.

## What it is

- Real-time canvas arcade defense game
- Three response channels: `Platform`, `Guardrails`, `Stakeholders`
- Day-based boss encounters
- Combo scoring, cooldown abilities, upgrades, and fail states
- Runs as plain static files on GitHub Pages

## Controls

- Hold pointer: fire
- `1` / `2` / `3`: switch modes
- `Q` / `W` / `E` / `R`: abilities
- `Space`: pause

## Play locally

No build step is required.

Option 1:

- Open `index.html` directly in a browser

Option 2:

```bash
python3 -m http.server 4173
```

Then open `http://127.0.0.1:4173/`.

## Autoplay

You can run the game in autoplay mode with:

```text
?autoplay=1
```

Example:

- `https://tengfone.github.io/GovAgentPanic/?autoplay=1`

## Project structure

- `index.html`: app shell and HUD layout
- `styles.css`: HUD, panels, responsive layout
- `app.js`: game loop, rendering, input, enemies, bosses, upgrades
- `assets/`: avatars, backdrop, favicon

## Hosting

This project is fully static and can be hosted on GitHub Pages without a build pipeline.
