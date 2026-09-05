# 🛣️ Cyber Highway Crosser

> A cyberpunk arcade game inspired by the classic Frogger formula. Guide your data packet across high-speed neon traffic lanes and digital river platforms to reach five secure server docks.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white&style=flat-square)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white&style=flat-square)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square)
![Canvas API](https://img.shields.io/badge/HTML5_Canvas-API-E34F26?logo=html5&logoColor=white&style=flat-square)
![Open Source](https://img.shields.io/badge/Open_Source-Contribution-brightgreen?style=flat-square)

---

## 📸 Preview

> *A visual gameplay preview and live demo link will be added in an upcoming update.*

---

## ✨ Features

### Gameplay
- **Cyberpunk Frogger mechanics** — Navigate a digital packet across deadly traffic lanes and moving river platforms to reach server docks.
- **Three difficulty modes** — Easy, Medium, and Hard, adjusting entity speeds and spawn intervals.
- **Multi-zone board** — Four traffic lanes, three river platform lanes, a central safe median, and a starting safety strip.
- **Five server docks** — Fill all five docks in a round to earn a cycle bonus and reset the docks for an endless arcade challenge.
- **Damage protection** — 3 lives per game with a 60-frame hit-flash invincibility buffer after collisions.

### Audio & UI
- **Real-time synthesized audio** — Chiptune background music sequencer and distinct sound effects generated entirely via the Web Audio API (no audio asset downloads).
- **Mute control** — Instant audio mute/unmute toggle.
- **Neon cyberpunk aesthetics** — Dark-mode-first color scheme with glowing neon vehicles, grid lines, and a light theme toggle.
- **Dual control schemes** — Full keyboard support (Arrow keys + WASD) and an on-screen touch D-pad for mobile and tablet play.

### Progression
- **Local leaderboard** — Tracks the top 10 scores per difficulty level in `localStorage`.
- **High score prompt** — Input your callsign or record scores anonymously when hitting a new personal best.
- **Session analytics** — Records play count and last-played timestamps per game mode.

---

## 🎯 Gameplay

### Objective
Guide your data packet from the bottom safe spawn zone to the **five server docks** at the top of the canvas. Successfully filling all five docks awards a **+50 bonus** and resets the docks for the next cycle.

### Movement
The packet moves tile-by-tile in four directions. There is no countdown timer; survival depends on pattern recognition and timing.

### Board Layout

The playfield spans a **480×480 px** grid divided into 10 rows (48 px each):

| Row(s) | Zone | Description / Hazard |
|:---:|---|---|
| **0** | **Server Docks** | Goal area. Reaching an open dock scores points; hitting an occupied dock or blank space costs a life. |
| **1–4** | **Neon Highway** | Four traffic lanes moving at alternating directions and speeds. Contact with vehicles costs a life. |
| **5** | **Median Strip** | Safe resting zone between the highway and digital river. |
| **6–8** | **Digital River** | Moving platform streams. You must ride platforms; falling into the stream costs a life. |
| **9** | **Start Zone** | Safe spawn area. |

### Scoring & Lives
- **+10 points** for each server dock reached.
- **+50 bonus points** when all five docks are filled in a single cycle.
- **3 lives** per attempt. Collisions trigger a 60-frame invincibility window with a red flash effect before respawning.
- The game runs continuously in an endless loop until all lives are depleted.

---

## 🕹️ Controls

### Keyboard

| Action | Primary Keys | Alternative Keys |
|---|:---:|:---:|
| Move Up | <kbd>↑</kbd> | <kbd>W</kbd> |
| Move Down | <kbd>↓</kbd> | <kbd>S</kbd> |
| Move Left | <kbd>←</kbd> | <kbd>A</kbd> |
| Move Right | <kbd>→</kbd> | <kbd>D</kbd> |
| Pause / Resume | <kbd>Space</kbd> | — |
| Start Game *(from Idle / Game Over)* | <kbd>Space</kbd> | <kbd>↑</kbd> / <kbd>W</kbd> |

### Mobile & Touch

An on-screen **D-pad** (▲ ▼ ◀ ▶) and a dedicated **Pause / Resume** button are rendered beneath the canvas, wired with responsive pointer event handlers for smooth touch play.

---

## ⚡ Difficulty Modes

Difficulty must be selected prior to starting a round (locked during active play):

| Mode | Vehicle Speed Multiplier | Spawn Interval Multiplier | Gameplay Dynamics |
|---|:---:|:---:|---|
| **Easy** | 0.75x | 3.0x | Slower vehicle flow with generous spacing between hazards |
| **Medium** | 0.85x | 1.9x | Standard arcade balance with moderate traffic frequency |
| **Hard** | 1.0x | 1.2x | High-speed traffic with tight, rapid spawn intervals |

Each difficulty mode stores its own isolated leaderboard and personal high score.

---

## 🏆 Leaderboard

- **Browser-Local Storage**: All leaderboard records and statistics are saved locally via `localStorage` (prefixed with `chc_`). No remote servers or third-party trackers are used.
- **Top Transmissions**: The sidebar displays the top 10 scores for the currently selected difficulty mode.
- **Callsign Registration**: Setting a new personal high score prompts for your name on the Game Over screen (defaults to "Anonymous" if skipped).
- **Mode Statistics**: Tracks lifetime play count and the last-played timestamp per difficulty.

---

## 🔊 Audio

All audio is synthesized dynamically in real time using the **Web Audio API** without loading external sound files:

| Sound / Track | Trigger Condition |
|---|---|
| **Background Music** | Looping 8-step chiptune synthesizer sequence active during gameplay |
| **Dock Reached** | Successfully guiding the packet into an open server dock |
| **Cycle Complete** | Harmonic fanfare triggered upon securing all five docks |
| **Player Hit** | Collision with a highway vehicle or drowning in the digital river |
| **Game Over** | Exhausting all three lives |

Sound can be silenced at any time using the **Mute** toggle button in the sidebar.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| [React 19](https://react.dev/) | Component architecture, UI state, and lifecycle management |
| [TypeScript ~6](https://www.typescriptlang.org/) | Type safety across game configuration, storage, and entity states |
| [Vite 8](https://vitejs.dev/) | Fast development server and optimized production bundler |
| [Tailwind CSS v4](https://tailwindcss.com/) | Modern styling via `@tailwindcss/vite` |
| HTML5 Canvas API | Hardware-accelerated 2D game rendering at 60 FPS |
| Web Audio API | Real-time synthesized chiptune music and sound effect generation |
| [Lucide React](https://lucide.dev/) | Clean iconography for controls, game options, and statistics |
| `localStorage` | Client-side persistence for leaderboards, high scores, and theme settings |

---

## 📁 Project Structure

```text
cyber-highway-crosser/
├── index.html                   # HTML entry point and font declarations
├── package.json                 # Project dependencies, scripts, and metadata
├── vite.config.ts               # Vite configuration (React & Tailwind CSS v4)
├── tsconfig.json                # TypeScript project references
├── tsconfig.app.json            # Application TypeScript configuration
└── src/
    ├── main.tsx                 # React root mounting ThemeProvider and App
    ├── index.css                # Base stylesheet and Tailwind CSS v4 directive
    ├── App.tsx                  # App layout: navigation header, theme toggle, and canvas frame
    ├── context/
    │   └── ThemeContext.tsx     # Dark/light theme provider with localStorage sync
    ├── core/
    │   ├── types.ts             # TypeScript interfaces for score entries and statistics
    │   ├── storage.ts           # localStorage service for leaderboards and metrics
    │   └── audio.ts             # Web Audio API engine (BGM sequencer and SFX synthesizers)
    └── game/
        ├── highway-crosser.config.ts # Core game constants, lane configs, and difficulty curves
        └── HighwayCrosser.tsx   # Primary game loop, canvas drawing, collision checks, and UI
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` (bundled with Node.js)

### Installation

```bash
# Clone repository
git clone https://github.com/NRR385/Cyber-Highway-Crosser.git
cd Cyber-Highway-Crosser

# Install dependencies
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build & Preview

```bash
# Type-check and build for production
npm run build

# Preview production build locally
npm run preview
```

---

## 🌍 Open Source Contribution

Cyber Highway Crosser was originally developed as an open-source contribution
to [QuickPlayZone](https://github.com/shamilahmdt/quickplay-zone).

- 🎮 Game contribution — [PR #53](https://github.com/shamilahmdt/quickplay-zone/pull/53)
- 📝 README contribution — [PR #54](https://github.com/shamilahmdt/quickplay-zone/pull/54)

Both pull requests were authored by [NRR385](https://github.com/NRR385)
and merged into QuickPlayZone's `main` branch.

This repository is the standalone version of the game for continued
development and future contributions.


---

## 🤝 Contributing

Contributions are welcome! Check out the [Issues](https://github.com/NRR385/Cyber-Highway-Crosser/issues) page to find open tasks or propose new features.


### Quick Contribution Flow

1. Fork the repository and clone your fork locally.
2. Create a dedicated branch (`git checkout -b feature/your-feature-name`).
3. Make your changes and verify the build passes (`npm run build`).
4. Commit changes with descriptive messages and push to your fork.
5. Open a Pull Request targeting `main`.

For in-depth development setup, branch conventions, and PR guidelines, please see [CONTRIBUTING.md](CONTRIBUTING.md). For larger architectural changes, please open an issue first to discuss the design.

---

## 📄 License

This project is licensed under the MIT License.

See the [LICENSE](LICENSE) file for the full license text.

---

## 👤 Author

**NRR385** — Developer & contributor of Cyber Highway Crosser

- GitHub: [@NRR385](https://github.com/NRR385)

---

## ⭐ Give It a Try

Clone the repo, run `npm run dev`, and see how many server cycles you can conquer!

If you find this project fun or useful, please consider giving it a ⭐ on GitHub
