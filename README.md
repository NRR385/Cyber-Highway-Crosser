# 🛣️ Cyber Highway Crosser

> A cyberpunk arcade game where you guide a data packet through neon traffic and hazardous digital rivers to reach the server docks.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white&style=flat-square)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white&style=flat-square)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square)
![Canvas API](https://img.shields.io/badge/HTML5_Canvas-API-E34F26?logo=html5&logoColor=white&style=flat-square)
![Open Source](https://img.shields.io/badge/Open_Source-Contribution-brightgreen?style=flat-square)

---

## 📸 About the Game

Cyber Highway Crosser is a cyberpunk-themed twist on the classic Frogger arcade formula. You play as a data packet navigating a dangerous neon highway — dodging oncoming vehicles in traffic lanes and hopping across moving platform streams to reach five server docks at the top of the board.

The game is built entirely in the browser using **React**, **TypeScript**, and the **HTML5 Canvas API**, with synthesised chiptune audio powered by the **Web Audio API**.

---

## ✨ Features

- **Cyberpunk visual style** — neon-lit canvas with glowing vehicles, blinking hit-flash effects, and a dark-first colour palette
- **Three difficulty modes** — Easy, Medium, and Hard, each changing vehicle speed and spawn density
- **Mixed lane types** — four traffic lanes (kill on contact) and three platform/river lanes (drown if no platform is under you)
- **Five server docks** to fill per round, with a completion bonus when all five are reached
- **3 lives** with hit-flash invincibility frames after each hit
- **Chiptune audio** — looping BGM sequencer and distinct sound effects for hits, docks, game over, and level completion, all powered by the Web Audio API
- **Mute toggle** — audio can be silenced at any time
- **Local leaderboard** — top-10 scores per difficulty mode, stored in `localStorage`
- **High score prompt** — enter your name when you set a new personal best
- **Dark / Light theme toggle** — persisted across sessions via `localStorage`
- **On-screen D-pad** — touch-friendly directional controls for mobile and tablet play
- **Keyboard controls** — Arrow keys and WASD both supported

---

## 🎯 Gameplay

### Objective
Guide your data packet from the bottom spawn row to the **five server docks** at the top of the board. Fill all five docks to earn a round-completion bonus and reset the board for another cycle.

### Movement
The player moves one tile at a time in any of the four cardinal directions. There is no time limit per move — the danger comes from the environment.

### Obstacles
The board is split into **10 rows**:

| Row(s) | Zone | Effect |
|--------|------|--------|
| 9 | **Start zone** | Safe spawn area |
| 8–6 | **River / platform lanes** | Must stand on a moving platform; fall off-screen or miss a platform and you lose a life |
| 5 | **Median strip** | Safe rest area |
| 4–1 | **Traffic lanes** | Contact with any vehicle costs a life |
| 0 | **Server dock row** | Landing on an empty dock scores points; landing on a filled dock or off a dock costs a life |

### Scoring
- **+10 points** for each server dock reached
- **+50 bonus points** when all five docks are filled in one cycle (docks then reset)
- Scores are tracked independently per difficulty mode

### Lives
You start with **3 lives**. A hit triggers a 60-frame invincibility window (with a red blink effect) to prevent back-to-back damage.

### Winning / Advancing
There is no final "win" state — the game loops continuously, resetting the docks after each full cycle. The goal is to maximise your score across as many cycles as possible before running out of lives.

---

## 🕹️ Controls

### Keyboard

| Action | Keys |
|--------|------|
| Move Up | ↑ / W |
| Move Down | ↓ / S |
| Move Left | ← / A |
| Move Right | → / D |
| Pause / Resume | Space |
| Start Game (from title/game over) | Space / ↑ / W |

### Mobile / Touch

An on-screen **D-pad** (▲ ▼ ◀ ▶) and a **Pause / Resume button** are rendered below the game canvas for touch play. All D-pad buttons use pointer events to ensure responsiveness on mobile browsers.

---

## ⚡ Difficulty Modes

Difficulty can be selected before starting a game and controls two independent parameters:

| Mode | Vehicle Speed Multiplier | Spawn Interval Multiplier |
|------|--------------------------|---------------------------|
| **Easy** | 0.75x base speed | 3.0x interval (fewer, wider gaps) |
| **Medium** | 0.85x base speed | 1.9x interval |
| **Hard** | 1.0x base speed | 1.2x interval (more frequent, tighter gaps) |

A higher spawn interval multiplier means vehicles appear less frequently. At Hard difficulty, vehicles spawn nearly as often as the base lane configuration allows, leaving much smaller safe windows.

Difficulty **cannot be changed mid-game** — the selector is disabled while a game is in progress or paused.

Each difficulty mode maintains its **own separate leaderboard and high score** in `localStorage`.

---

## 🏆 Scoring & Leaderboard

### Scoring
- Earn **10 points** per server dock filled.
- Earn a **+50 bonus** when all five docks are filled in a single cycle.
- If you land on a dock that is already filled, you lose a life and are respawned.

### Leaderboard
- The top **10 scores** for each difficulty mode are stored locally in `localStorage` under the key prefix `chc_leaderboard_`.
- When you achieve a **new personal high score**, a name prompt appears on the Game Over screen. You can save your name or skip (saves as "Anonymous").
- The leaderboard is displayed in the sidebar as **"Top Transmissions"**, showing rank, player name, and score.
- Play counts and the last-played timestamp are also tracked per game mode.

---

## 🔊 Audio

All audio is synthesised in real time using the **Web Audio API** — no audio files are bundled.

| Sound | Trigger |
|-------|---------|
| Background music (looping sequencer) | Plays during active gameplay |
| Dock reached | Player successfully reaches a server dock |
| All docks filled (fanfare) | Bonus round cycle complete |
| Player hit | Collision with a vehicle or drowning |
| Game over | All lives lost |

- Audio can be **toggled on/off** at any time via the **Sound Enabled / Muted** button in the Game Options sidebar.
- Background music stops automatically when the game is paused or ends.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| [React 19](https://react.dev/) | UI components and game state management |
| [TypeScript ~6](https://www.typescriptlang.org/) | Static typing across the entire codebase |
| [Vite 8](https://vitejs.dev/) | Development server and production build tool |
| [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first styling via `@tailwindcss/vite` |
| HTML5 Canvas API | Game rendering (480x480 px canvas) |
| Web Audio API | Synthesised chiptune music and sound effects |
| [Lucide React](https://lucide.dev/) | Icon set (Award, Play, Pause, Volume, Server, etc.) |
| `localStorage` | Leaderboard and high score persistence, theme preference |
| Google Fonts (Inter) | Typography |

---

## 📁 Project Structure

```
cyber-highway-crosser/
├── index.html                  # Entry point and meta tags
├── package.json                # Dependencies and scripts
├── vite.config.ts              # Vite + React + Tailwind CSS v4 config
├── tsconfig.json               # TypeScript project references
├── tsconfig.app.json           # App-level TS compiler options
└── src/
    ├── main.tsx                # React root — mounts ThemeProvider + App
    ├── index.css               # Global baseline styles
    ├── App.tsx                 # App shell: header, theme toggle, game mount
    ├── context/
    │   └── ThemeContext.tsx    # Dark/light theme context + localStorage persistence
    ├── core/
    │   ├── types.ts            # Shared TypeScript interfaces (ScoreEntry, GameStats)
    │   ├── storage.ts          # localStorage wrapper: leaderboard, high score, play count
    │   └── audio.ts            # Web Audio API AudioManager (BGM sequencer + SFX)
    └── game/
        ├── highway-crosser.config.ts   # All game constants, lane configs, difficulty tables
        └── HighwayCrosser.tsx          # Main game component: canvas loop, collision, UI
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- npm (included with Node.js)

### Install dependencies

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for production

```bash
npm run build
```

### Preview the production build locally

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

---

## 🌍 Open Source Contribution

This game was developed as an **open-source contribution** to [QuickPlayZone](https://github.com/shamilahmdt/quickplay-zone), a community-maintained collection of browser-based web games.

I worked within the existing QuickPlayZone codebase — following its established conventions, folder structure, and shared component patterns — and contributed **Cyber Highway Crosser** through a pull request:

> 🔗 **Original project:** [github.com/shamilahmdt/quickplay-zone](https://github.com/shamilahmdt/quickplay-zone)
>
> 🔗 **My contribution PR:** [quickplay-zone/pull/53](https://github.com/shamilahmdt/quickplay-zone/pull/53)

### What this involved

- **Working in an existing codebase** — understanding the project's architecture, shared utilities (`storage.ts`, `audio.ts`), and component conventions before writing a single line of game code
- **Git branching workflow** — creating a feature branch, keeping commits scoped and descriptive
- **Pull request process** — opening a PR against the upstream repository with a clear description of the contribution
- **Integrating with shared infrastructure** — reusing the project's existing `AudioManager`, `storage` module, and `ThemeContext` rather than reinventing them
- **Meeting CI / build requirements** — ensuring the game builds cleanly with `tsc` and Vite with no type errors

> **Note:** I am the contributor of *Cyber Highway Crosser* within QuickPlayZone. I am not the maintainer or owner of the QuickPlayZone project.

---

## 📄 License

This standalone repository does not currently include its own `LICENSE` file.

The upstream [QuickPlayZone](https://github.com/shamilahmdt/quickplay-zone) project — to which this game was contributed — is licensed under the **MIT License** (Copyright © 2026 Shamil Ahammed T).

---

## 👤 Author

**NRR385** — Developer & contributor of Cyber Highway Crosser

- GitHub: [github.com/NRR385](https://github.com/NRR385)
- Contribution: [quickplay-zone/pull/53](https://github.com/shamilahmdt/quickplay-zone/pull/53)

> This repository is my standalone version of the game I developed as an open-source contribution to QuickPlayZone. I am not the maintainer or owner of the QuickPlayZone project.

---

## ⭐ Give It a Try

Clone the repo, run `npm install && npm run dev`, and try to fill all five server docks before the neon traffic claims your last life.

If you find this useful or interesting, feel free to ⭐ the repo or explore the [original QuickPlayZone project](https://github.com/shamilahmdt/quickplay-zone) — it's a great open-source collection worth checking out.
