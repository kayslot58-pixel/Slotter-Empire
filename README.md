# Slotter Empire

A browser-based open-world crime game prototype inspired by the feel of classic GTA-style city exploration, built with plain JavaScript and HTML5 canvas.

## What is in this prototype?

- Top-down city map with multiple districts
- Player movement and vehicle entry/exit
- Vehicle objects parked across the map
- Mission system with pickups, transport, and escape objectives
- Wanted level and police chase behavior
- Money, health, and district tracking
- Mini-map UI for world navigation

## How to run

Because this is a static front-end game, you can run it in a browser without a build step.

### Option 1: Open directly

Open `index.html` in any modern browser.

### Option 2: Local web server

From the project directory, run:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Controls

- W, A, S, D or Arrow keys: move
- E: enter/exit the nearest vehicle
- Space: interact with mission objective
- Shift: boost movement speed

## Notes

This is a starter prototype intentionally built in plain JavaScript so it is easy to expand. It is designed to be extended with:

- weapons and combat
- more missions and NPC conversation
- radio/music system
- side hustles and properties
- saved progression and menu screens
- larger world map and advanced pathfinding

## Project structure

- `index.html` — app shell and HUD
- `styles.css` — game layout and styling
- `game.js` — world simulation, player logic, and rendering

## License

This project is provided as a simple prototype for learning and experimentation.
