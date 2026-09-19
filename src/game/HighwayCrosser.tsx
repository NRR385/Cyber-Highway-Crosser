// ─────────────────────────────────────────────────────────────────────────────
// Cyber Highway Crosser — Main Component
// Architectural reference: FlappyPacket.tsx + GameTemplate.tsx
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from 'react';
import type { FC } from 'react';
import { storage } from '../core/storage';
import { audio } from '../core/audio';
import { useTheme } from '../context/ThemeContext';
import {
  Award, Play, Pause, RotateCcw, Volume2, VolumeX, Server,
} from 'lucide-react';
import HIGHWAY_CONFIG, {
  LANE_CONFIGS, SAFE_ROWS, PLATFORM_ROWS, DIFFICULTY_SPEEDS, DIFFICULTY_SPAWN_INTERVALS,
} from './highway-crosser.config';
import type { LaneConfig, Difficulty } from './highway-crosser.config';

// ─── Destructured constants ────────────────────────────────────────────────
const {
  CANVAS_W, CANVAS_H, ROW_HEIGHT, NUM_ROWS,
  PLAYER_W, PLAYER_H, PLAYER_START_ROW, PLAYER_START_X, STEP_X,
  LIVES, DOCK_COUNT, POINTS_PER_DOCK, POINTS_ALL_DOCKS_BONUS,
  COLORS,
} = HIGHWAY_CONFIG;

const GAME_ID = 'highway_crosser';
const DOCK_SLOT_W = CANVAS_W / DOCK_COUNT; // 96 px per dock slot

// Lookup: canvas row index → LANE_CONFIGS index (built once at module load)
const ROW_TO_LANE_IDX = new Map<number, number>(
  LANE_CONFIGS.map((l: LaneConfig, i: number) => [l.row, i]),
);

const SAFE_SET = new Set<number>(SAFE_ROWS);
const PLATFORM_SET = new Set<number>(PLATFORM_ROWS);

// ─── Internal interfaces ───────────────────────────────────────────────────
interface CarEntity {
  x: number;
  y: number;
  w: number;
  h: number;
  /** px per frame; negative = leftward */
  speed: number;
  color: string;
  isPlatform: boolean;
  /** Index into LANE_CONFIGS — used to match platforms to their lane. */
  laneIdx: number;
}

interface DockSlot {
  filled: boolean;
  flashFrames: number;
  /** Horizontal centre position in canvas px. */
  centerX: number;
}

// ─── Pure helpers (defined at module scope — no re-creation per render) ─────

/** Centre Y coordinate of a given row. */
const rowCenterY = (row: number): number => row * ROW_HEIGHT + ROW_HEIGHT / 2;

/** Build a fresh set of empty dock slots. */
const makeDocks = (): DockSlot[] =>
  Array.from({ length: DOCK_COUNT }, (_, i) => ({
    filled: false,
    flashFrames: 0,
    centerX: i * DOCK_SLOT_W + DOCK_SLOT_W / 2,
  }));

/**
 * Draw a rounded rectangle path.  Avoids relying on `CanvasRenderingContext2D.roundRect`
 * which may not be typed in every lib.dom version.
 */
const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void => {
  const R = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + R, y);
  ctx.lineTo(x + w - R, y);
  ctx.arcTo(x + w, y, x + w, y + R, R);
  ctx.lineTo(x + w, y + h - R);
  ctx.arcTo(x + w, y + h, x + w - R, y + h, R);
  ctx.lineTo(x + R, y + h);
  ctx.arcTo(x, y + h, x, y + h - R, R);
  ctx.lineTo(x, y + R);
  ctx.arcTo(x, y, x + R, y, R);
  ctx.closePath();
};

// ─── Component ─────────────────────────────────────────────────────────────
export const HighwayCrosser: FC = () => {
  const { dark } = useTheme();

  // ── React UI state (triggers re-renders) ─────────────────────────────────
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
  // Ref that always holds the latest difficulty so stable callbacks (resetGame)
  // can read it without needing it in their dependency array.
  const difficultyRef = useRef<Difficulty>('MEDIUM');
  const [highScore, setHighScore] = useState(
    () => storage.getGameStats(`${GAME_ID}_medium`).highScore,
  );
  const [lives, setLives] = useState(LIVES);
  const [gameStatus, setGameStatus] = useState<
    'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER'
  >('IDLE');
  const [uiState, setUiState] = useState<'MENU' | 'BRIEFING' | 'DEPLOYING' | 'GAME'>('MENU');
  const [muted, setMuted] = useState(audio.getMuted());
  const [leaderboard, setLeaderboard] = useState(
    () => storage.getLeaderboard(`${GAME_ID}_medium`),
  );
  const [name, setName] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(false);

  // ── Refs ─────────────────────────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  /**
   * All rapidly-changing game-world data lives here.
   * Reading/writing this ref inside the rAF loop never triggers a React render.
   */
  const gameState = useRef({
    playerX: PLAYER_START_X,
    playerY: rowCenterY(PLAYER_START_ROW),
    playerRow: PLAYER_START_ROW,
    cars: [] as CarEntity[],
    docks: makeDocks(),
    spawnCounters: LANE_CONFIGS.map(() => 0) as number[],
    /** Countdown frames of red flash after a hit (guards against double-hits). */
    hitFlash: 0,
    frameCount: 0,
  });

  // ── Storage: increment play count on mount ────────────────────────────────
  useEffect(() => {
    storage.incrementPlayCount(GAME_ID);
  }, []);

  const handleDifficultyChange = (diff: Difficulty) => {
    difficultyRef.current = diff;  // keep ref in sync immediately
    setDifficulty(diff);
    const modeKey = `${GAME_ID}_${diff.toLowerCase()}`;
    const stats = storage.getGameStats(modeKey);
    setHighScore(stats.highScore);
    setLeaderboard(storage.getLeaderboard(modeKey));
  };

  // ── BGM ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (gameStatus === 'PLAYING') {
      audio.startBgm('flappy');
    } else {
      audio.stopBgm();
    }
    return () => { audio.stopBgm(); };
  }, [gameStatus]);

  // ── Broadcast play status (GamePage uses this for scroll prevention) ──────
  useEffect(() => {
    const isPlaying = gameStatus === 'PLAYING';
    window.dispatchEvent(
      new CustomEvent('qplay-status', { detail: { isPlaying } }),
    );
    return () => {
      window.dispatchEvent(
        new CustomEvent('qplay-status', { detail: { isPlaying: false } }),
      );
    };
  }, [gameStatus]);

  // ── Stable player-respawn helper (only reads stable refs / constants) ─────
  const respawnPlayer = useCallback(() => {
    gameState.current.playerX = PLAYER_START_X;
    gameState.current.playerRow = PLAYER_START_ROW;
    gameState.current.playerY = rowCenterY(PLAYER_START_ROW);
    gameState.current.hitFlash = 0;
  }, []);

  // ── Game lifecycle actions ────────────────────────────────────────────────
  const resetGame = useCallback(() => {
    const s = gameState.current;
    s.playerX = PLAYER_START_X;
    s.playerRow = PLAYER_START_ROW;
    s.playerY = rowCenterY(PLAYER_START_ROW);
    s.cars = [];
    s.docks = makeDocks();
    // Pre-seed spawn counters so vehicles appear within ~0.3–0.8 s of game
    // start instead of waiting 2–5 s for counters to reach zero from scratch.
    // Each lane is staggered by 10 frames so vehicles don't all spawn at once.
    // After the first spawn the regular difficulty-based interval takes over.
    const spawnScale = DIFFICULTY_SPAWN_INTERVALS[difficultyRef.current];
    s.spawnCounters = LANE_CONFIGS.map((lane, i) => {
      const interval = Math.max(30, Math.round(lane.spawnInterval * spawnScale));
      const stagger = 8 + i * 10; // lanes fire at 8, 18, 28, 38, 48, 58, 68 frames
      return Math.max(0, interval - stagger);
    });
    s.hitFlash = 0;
    s.frameCount = 0;

    setScore(0);
    setLives(LIVES);
    setShowNamePrompt(false);
    setName('');
    setGameStatus('PLAYING');
  }, []);

  const quitGame = useCallback(() => {
    const s = gameState.current;
    s.cars = [];
    s.docks = makeDocks();
    s.spawnCounters = LANE_CONFIGS.map(() => 0);
    s.hitFlash = 0;
    s.frameCount = 0;

    setScore(0);
    setLives(LIVES);
    setShowNamePrompt(false);
    setName('');
    setGameStatus('IDLE');
    // Defer respawn so gameState is consistent when the IDLE rAF starts
    setTimeout(() => {
      gameState.current.playerX = PLAYER_START_X;
      gameState.current.playerRow = PLAYER_START_ROW;
      gameState.current.playerY = rowCenterY(PLAYER_START_ROW);
      gameState.current.hitFlash = 0;
    }, 0);
  }, []);

  // ── Keyboard handler (depends on gameStatus + showNamePrompt) ────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showNamePrompt) return;

      const movementCodes = [
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'KeyW', 'KeyS', 'KeyA', 'KeyD',
        'Space',
      ];
      if (movementCodes.includes(e.code)) e.preventDefault();

      // Start from idle / game-over
      if (gameStatus === 'IDLE' || gameStatus === 'GAME_OVER') {
        if (['Space', 'ArrowUp', 'KeyW'].includes(e.code) && uiState === 'GAME') resetGame();
        return;
      }
      // Resume from pause
      if (gameStatus === 'PAUSED') {
        if (e.code === 'Space' && uiState === 'GAME') setGameStatus('PLAYING');
        return;
      }
      if (gameStatus !== 'PLAYING' || uiState !== 'GAME') return;

      // Pause
      if (e.code === 'Space') { setGameStatus('PAUSED'); return; }

      // Movement — directly mutate the gameState ref (no re-render)
      const s = gameState.current;
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        s.playerRow = Math.max(0, s.playerRow - 1);
        s.playerY = rowCenterY(s.playerRow);
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        s.playerRow = Math.min(NUM_ROWS - 1, s.playerRow + 1);
        s.playerY = rowCenterY(s.playerRow);
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        s.playerX = Math.max(PLAYER_W / 2, s.playerX - STEP_X);
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        s.playerX = Math.min(CANVAS_W - PLAYER_W / 2, s.playerX + STEP_X);
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStatus, showNamePrompt, resetGame]);

  // ── Leaderboard actions ───────────────────────────────────────────────────
  const handleSaveScore = () => {
    const modeKey = `${GAME_ID}_${difficulty.toLowerCase()}`;
    storage.addLeaderboardScore(modeKey, {
      playerName: name.trim() || 'Anonymous',
      score,
    });
    setLeaderboard(storage.getLeaderboard(modeKey));
    setShowNamePrompt(false);
    setName('');
  };

  const handleSkipSaveScore = () => {
    const modeKey = `${GAME_ID}_${difficulty.toLowerCase()}`;
    storage.addLeaderboardScore(modeKey, { playerName: 'Anonymous', score });
    setLeaderboard(storage.getLeaderboard(modeKey));
    setShowNamePrompt(false);
    setName('');
  };

  // ── Main rAF game loop ────────────────────────────────────────────────────
  // Depends on [gameStatus, score, lives, difficulty, dark, respawnPlayer]
  // so the effect re-runs whenever any of these change.
  // All mutable game-world data persists between effect runs via gameState.current.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = CANVAS_W;
    const H = CANVAS_H;

    // ── Vehicle spawning ────────────────────────────────────────────────────
    const spawnVehicles = () => {
      const s = gameState.current;
      const spawnScale = DIFFICULTY_SPAWN_INTERVALS[difficulty];

      LANE_CONFIGS.forEach((lane: LaneConfig, idx: number) => {
        s.spawnCounters[idx]++;
        const effectiveInterval = Math.max(
          30,
          Math.round(lane.spawnInterval * spawnScale),
        );
        if (s.spawnCounters[idx] < effectiveInterval) return;
        s.spawnCounters[idx] = 0;

        const speed = lane.dir * lane.baseSpeed * DIFFICULTY_SPEEDS[difficulty];
        const vehicleY = lane.row * ROW_HEIGHT + (ROW_HEIGHT - lane.vehicleH) / 2;
        // Spawn just off-screen on the leading edge
        const x = lane.dir === 1 ? -lane.vehicleW - 4 : W + 4;

        s.cars.push({
          x,
          y: vehicleY,
          w: lane.vehicleW,
          h: lane.vehicleH,
          speed,
          color: lane.color,
          isPlatform: lane.isPlatform,
          laneIdx: idx,
        });
      });
    };

    // ── Vehicle movement + culling ──────────────────────────────────────────
    const updateVehicles = () => {
      const s = gameState.current;
      for (const car of s.cars) car.x += car.speed;
      s.cars = s.cars.filter(c => c.x + c.w > -20 && c.x < W + 20);
    };

    // ── AABB collision (shrunk by 4 px per side for leniency) ──────────────
    const hitsPlayer = (car: CarEntity): boolean => {
      const { playerX: px, playerY: py } = gameState.current;
      const shrink = 4;
      return (
        px - PLAYER_W / 2 + shrink < car.x + car.w &&
        px + PLAYER_W / 2 - shrink > car.x &&
        py - PLAYER_H / 2 + shrink < car.y + car.h &&
        py + PLAYER_H / 2 - shrink > car.y
      );
    };

    // ── Platform under player (centre must be inside platform + margin) ─────
    const getPlatformUnder = (): CarEntity | null => {
      const s = gameState.current;
      const laneIdx = ROW_TO_LANE_IDX.get(s.playerRow);
      if (laneIdx === undefined) return null;
      const margin = 6;
      return s.cars.find(c =>
        c.isPlatform &&
        c.laneIdx === laneIdx &&
        s.playerX > c.x + margin &&
        s.playerX < c.x + c.w - margin,
      ) ?? null;
    };

    // ── Hit handler (closes over the current `lives` and `score` values) ────
    const handleHit = () => {
      if (gameState.current.hitFlash > 0) return; // still within flash window — ignore
      audio.playPlayerHit();
      gameState.current.hitFlash = 60; // 60-frame flash / double-hit guard

      if (lives <= 1) {
        setLives(0);
        setGameStatus('GAME_OVER');
        audio.playGameOver();
        const modeKey = `${GAME_ID}_${difficulty.toLowerCase()}`;
        const stats = storage.getGameStats(modeKey);
        if (score > stats.highScore) {
          setHighScore(score);
          setShowNamePrompt(true);
        }
      } else {
        setLives(lives - 1);
        respawnPlayer();
      }
    };

    // ── Dock-reached handler (closes over `score`) ──────────────────────────
    const handleDockReached = (dockIdx: number) => {
      const s = gameState.current;
      s.docks[dockIdx].filled = true;
      s.docks[dockIdx].flashFrames = 45;
      audio.playPoint();
      respawnPlayer();

      const newScore = score + POINTS_PER_DOCK;

      if (s.docks.every(d => d.filled)) {
        // All docks filled → award bonus and reset docks
        const bonus = newScore + POINTS_ALL_DOCKS_BONUS;
        setScore(bonus);
        s.docks = makeDocks();
        audio.playSnakeGolden(); // fanfare reuse
      } else {
        setScore(newScore);
      }
    };

    // ── Draw: static background rows ────────────────────────────────────────
    const drawBackground = () => {
      for (let row = 0; row < NUM_ROWS; row++) {
        const y = row * ROW_HEIGHT;
        let fill: string;

        if (row === 0 || row === 9) {
          fill = dark ? COLORS.safeDark : COLORS.safeLight;
        } else if (row === 5) {
          fill = dark ? COLORS.medianDark : COLORS.medianLight;
        } else if (PLATFORM_SET.has(row)) {
          fill = dark ? COLORS.waterDark : COLORS.waterLight;
        } else {
          fill = dark ? COLORS.roadDark : COLORS.roadLight;
        }

        ctx.fillStyle = fill;
        ctx.fillRect(0, y, W, ROW_HEIGHT);

        // Dashed centre-line for traffic rows
        if (!SAFE_SET.has(row) && !PLATFORM_SET.has(row) && row !== 5) {
          ctx.strokeStyle = COLORS.laneDivider;
          ctx.lineWidth = 1;
          ctx.setLineDash([10, 8]);
          ctx.beginPath();
          ctx.moveTo(0, y + ROW_HEIGHT - 0.5);
          ctx.lineTo(W, y + ROW_HEIGHT - 0.5);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Subtle row separator grid
      ctx.strokeStyle = dark
        ? 'rgba(255,255,255,0.04)'
        : 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 1;
      for (let row = 1; row < NUM_ROWS; row++) {
        ctx.beginPath();
        ctx.moveTo(0, row * ROW_HEIGHT);
        ctx.lineTo(W, row * ROW_HEIGHT);
        ctx.stroke();
      }
    };

    // ── Draw: server dock slots ──────────────────────────────────────────────
    const drawDocks = () => {
      const s = gameState.current;
      s.docks.forEach((dock, i) => {
        const pad = 6;
        const rx = i * DOCK_SLOT_W + pad;
        const ry = pad;
        const rw = DOCK_SLOT_W - pad * 2;
        const rh = ROW_HEIGHT - pad * 2;

        if (dock.filled) {
          const glow = dock.flashFrames > 0
            ? 14 + Math.sin(dock.flashFrames * 0.35) * 6
            : 10;
          ctx.shadowBlur = glow;
          ctx.shadowColor = COLORS.dockFilled;
          ctx.fillStyle = dock.flashFrames > 0
            ? `hsl(142,71%,${50 + Math.round(dock.flashFrames * 0.6)}%)`
            : COLORS.dockFilled;
          roundRect(ctx, rx, ry, rw, rh, 4);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = dark ? COLORS.dockEmptyDark : COLORS.dockEmptyLight;
          roundRect(ctx, rx, ry, rw, rh, 4);
          ctx.fill();
          ctx.strokeStyle = dark ? '#166534' : '#6ee7b7';
          ctx.lineWidth = 1.5;
          roundRect(ctx, rx, ry, rw, rh, 4);
          ctx.stroke();
        }

        // Server icon
        ctx.font = '14px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = dock.filled
          ? '#ffffff'
          : (dark ? '#4ade80' : '#166534');
        ctx.fillText(
          dock.filled ? '🖥' : '·',
          i * DOCK_SLOT_W + DOCK_SLOT_W / 2,
          ROW_HEIGHT / 2,
        );

        if (dock.flashFrames > 0) dock.flashFrames--;
      });
    };

    // ── Draw: cars and platforms ─────────────────────────────────────────────
    const drawVehicles = () => {
      const s = gameState.current;
      for (const car of s.cars) {
        if (car.isPlatform) {
          // Glowing platform (log / raft)
          ctx.shadowBlur = 8;
          ctx.shadowColor = car.color;
          ctx.fillStyle = car.color;
          roundRect(ctx, car.x, car.y, car.w, car.h, 5);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Vertical plank lines
          ctx.strokeStyle = 'rgba(0,0,0,0.22)';
          ctx.lineWidth = 1;
          for (let lx = car.x + 14; lx < car.x + car.w - 6; lx += 16) {
            ctx.beginPath();
            ctx.moveTo(lx, car.y + 4);
            ctx.lineTo(lx, car.y + car.h - 4);
            ctx.stroke();
          }

          // Direction indicator
          ctx.fillStyle = 'rgba(255,255,255,0.28)';
          ctx.font = '9px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            car.speed > 0 ? '▶' : '◀',
            car.x + car.w / 2,
            car.y + car.h / 2,
          );
        } else {
          // Glowing vehicle (car / truck)
          ctx.shadowBlur = 6;
          ctx.shadowColor = car.color;
          ctx.fillStyle = car.color;
          roundRect(ctx, car.x, car.y, car.w, car.h, 3);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Windshield
          ctx.fillStyle = 'rgba(0,0,0,0.32)';
          const ww = car.w * 0.4;
          const wx = car.speed < 0
            ? car.x + 5
            : car.x + car.w - ww - 5;
          roundRect(ctx, wx, car.y + 4, ww, car.h - 8, 2);
          ctx.fill();

          // Headlights
          ctx.fillStyle = '#fef08a';
          const hlX = car.speed < 0
            ? car.x + 2
            : car.x + car.w - 5;
          ctx.fillRect(hlX, car.y + 3, 3, 4);
          ctx.fillRect(hlX, car.y + car.h - 7, 3, 4);
        }
      }
    };

    // ── Draw: player data-packet ─────────────────────────────────────────────
    const drawPlayer = () => {
      const { playerX: px, playerY: py, hitFlash } = gameState.current;
      // Blink every 6 frames during flash window
      const blink = hitFlash > 0 && Math.floor(hitFlash / 6) % 2 === 0;
      const bodyColor = blink
        ? COLORS.hitFlashColor
        : (dark ? COLORS.playerDark : COLORS.playerLight);
      const glowColor = blink ? COLORS.hitFlashColor : COLORS.playerGlow;

      ctx.shadowBlur = blink ? 18 : 12;
      ctx.shadowColor = glowColor;
      ctx.fillStyle = bodyColor;
      roundRect(ctx, px - PLAYER_W / 2, py - PLAYER_H / 2, PLAYER_W, PLAYER_H, 5);
      ctx.fill();
      ctx.shadowBlur = 0;

      // CPU-chip inner dot
      ctx.fillStyle = '#0891b2';
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();

      // Antennas (gives a "chip" silhouette)
      ctx.strokeStyle = bodyColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px - 6, py - PLAYER_H / 2);
      ctx.lineTo(px - 6, py - PLAYER_H / 2 - 5);
      ctx.moveTo(px + 6, py - PLAYER_H / 2);
      ctx.lineTo(px + 6, py - PLAYER_H / 2 - 5);
      ctx.stroke();
    };

    // ── Main update + draw ───────────────────────────────────────────────────
    const updateAndDraw = () => {
      // 1. Clear
      ctx.fillStyle = dark ? COLORS.bgDark : COLORS.bgLight;
      ctx.fillRect(0, 0, W, H);

      drawBackground();

      if (gameStatus === 'PLAYING') {
        const s = gameState.current;
        s.frameCount++;

        // 2. Spawn and scroll vehicles
        spawnVehicles();
        updateVehicles();

        const row = s.playerRow;

        // 3. Platform-row logic: ride or drown
        if (PLATFORM_SET.has(row)) {
          const plat = getPlatformUnder();
          if (plat) {
            s.playerX += plat.speed; // inherit platform velocity
            // If platform carries player off canvas edge → drown
            if (s.playerX < -PLAYER_W || s.playerX > W + PLAYER_W) {
              handleHit();
            }
          } else if (s.hitFlash <= 0) {
            // No platform underneath → drown
            handleHit();
          }
        }

        // 4. Traffic collision (skip if inside hit-flash window)
        if (!SAFE_SET.has(row) && !PLATFORM_SET.has(row) && s.hitFlash <= 0) {
          const hit = s.cars.some(c => !c.isPlatform && hitsPlayer(c));
          if (hit) handleHit();
        }

        // 5. Tick down hit-flash counter
        if (s.hitFlash > 0) s.hitFlash--;

        // 6. Dock detection: player arrived at top row
        if (row === 0 && s.hitFlash <= 0) {
          const clampedX = Math.max(0, Math.min(W - 1, s.playerX));
          const dockIdx = Math.floor(clampedX / DOCK_SLOT_W);
          if (dockIdx >= 0 && dockIdx < DOCK_COUNT) {
            const dock = s.docks[dockIdx];
            if (!dock.filled) {
              handleDockReached(dockIdx);
            } else {
              handleHit();
            }
          }
        }
      }

      // 7. Draw entities (drawn regardless of status for idle/paused preview)
      drawVehicles();
      drawPlayer();
      drawDocks();

      // 8. Continue loop while game is in an active-view state
      if (
        gameStatus === 'PLAYING' ||
        gameStatus === 'IDLE' ||
        gameStatus === 'PAUSED'
      ) {
        animationFrameId.current = requestAnimationFrame(updateAndDraw);
      }
    };

    animationFrameId.current = requestAnimationFrame(updateAndDraw);
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [gameStatus, score, lives, difficulty, dark, respawnPlayer]);

  // ── Helper: move player from D-pad press ──────────────────────────────────
  const dpadMove = (dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (gameStatus !== 'PLAYING') return;
    const s = gameState.current;
    if (dir === 'UP') { s.playerRow = Math.max(0, s.playerRow - 1); s.playerY = rowCenterY(s.playerRow); }
    if (dir === 'DOWN') { s.playerRow = Math.min(NUM_ROWS - 1, s.playerRow + 1); s.playerY = rowCenterY(s.playerRow); }
    if (dir === 'LEFT') { s.playerX = Math.max(PLAYER_W / 2, s.playerX - STEP_X); }
    if (dir === 'RIGHT') { s.playerX = Math.min(CANVAS_W - PLAYER_W / 2, s.playerX + STEP_X); }
  };

  const notPlaying = gameStatus !== 'PLAYING';
  const dpadBtnStyle = `w-12 h-12 border rounded-[4px] flex items-center justify-center
    font-bold select-none cursor-pointer touch-none transition-colors
    disabled:opacity-30 disabled:cursor-not-allowed
    ${dark
      ? 'bg-[#1a1a1c] border-slate-800 text-slate-300 active:bg-white active:text-black'
      : 'bg-white border-slate-200 text-slate-600 active:bg-slate-900 active:text-white'
    }`;

  // ── Flow Actions ─────────────────────────────────────────────────────────
  const startBriefing = () => setUiState('BRIEFING');

  const deployGame = () => {
    setUiState('DEPLOYING');
    setTimeout(() => {
      resetGame();
      setUiState('GAME');
    }, 1200);
  };

  const returnToMenu = () => {
    quitGame();
    setUiState('MENU');
  };

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-full relative overflow-x-hidden overflow-y-auto">

      {/* ══ STAGE 1: MAIN MENU ═════════════════════════════════════════════ */}
      {uiState === 'MENU' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-[#09090b]/95 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]">
          <div className="max-w-md w-full flex flex-col gap-8 text-center">
            <div>
              <Server className="w-20 h-20 mx-auto mb-6 text-cyan-500 drop-shadow-[0_0_20px_rgba(6,182,212,0.6)] animate-pulse" />
              <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-[0.15em] text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] mb-4 leading-tight">
                Cyber Highway <br /> Crosser
              </h1>
              <p className="text-slate-400 text-sm max-w-sm mx-auto tracking-wide">
                Guide your data packet through hostile traffic and reach all five server docks.
              </p>
            </div>

            <button
              onClick={startBriefing}
              className="w-full py-5 text-xl font-black uppercase tracking-[0.2em] bg-cyan-500 hover:bg-cyan-400 text-[#09090b] transition-all rounded-[2px] shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.7)] cursor-pointer mt-4"
            >
              Start Game
            </button>
          </div>
        </div>
      )}

      {/* ══ STAGE 2: MISSION BRIEFING ════════════════════════════════════════ */}
      {uiState === 'BRIEFING' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-[#09090b]/95 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]">
          <div className="max-w-lg w-full bg-[#121214] border border-cyan-500/30 rounded-[4px] p-8 shadow-[0_0_30px_rgba(6,182,212,0.1)] relative overflow-hidden">
            {/* Scanline overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-10 opacity-20"></div>

            <div className="relative z-20">
              <div className="text-cyan-500 font-mono text-xs mb-6 flex justify-between border-b border-cyan-500/30 pb-2">
                <span>SYSTEM.TERMINAL.v9.4</span>
                <span className="animate-pulse">_</span>
              </div>

              <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-6 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">Mission Briefing</h2>

              <div className="space-y-4 font-mono text-sm text-slate-300 mb-8">
                <p><span className="text-cyan-500 font-bold">OBJECTIVE:</span> Guide data packet through hostile traffic.</p>
                <p><span className="text-cyan-500 font-bold">TARGET:</span> Reach all five server docks.</p>
                <p><span className="text-amber-500 font-bold">WARNING:</span> Returning to the same server dock costs 1 integrity and resets your progress.</p>

                <div className="pt-2 pb-2">
                  <p className="text-cyan-500 font-bold mb-2">THREAT LEVEL / DIFFICULTY:</p>
                  <div className="flex gap-2">
                    {(['EASY', 'MEDIUM', 'HARD'] as const).map((diff) => (
                      <button
                        key={diff}
                        onClick={() => handleDifficultyChange(diff)}
                        className={`flex-1 py-2 text-xs font-bold rounded-[2px] border transition-colors cursor-pointer ${difficulty === diff
                          ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/60 shadow-[inset_0_0_10px_rgba(6,182,212,0.2)]'
                          : 'bg-black/60 text-slate-500 border-slate-700 hover:border-slate-500 hover:text-slate-300'
                          }`}
                      >
                        [ {diff} ]
                      </button>
                    ))}
                  </div>
                </div>

                <p><span className="text-cyan-500 font-bold">INTEGRITY:</span> {LIVES} ATTEMPTS REMAINING</p>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setUiState('MENU')}
                  className="px-6 py-3 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 font-bold uppercase tracking-widest text-xs transition-colors rounded-[2px] cursor-pointer"
                >
                  [ ABORT ]
                </button>
                <button
                  onClick={deployGame}
                  className="flex-1 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-[#09090b] font-black uppercase tracking-widest text-xs transition-colors rounded-[2px] shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] cursor-pointer"
                >
                  Deploy Packet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ STAGE 3: DEPLOYMENT TRANSITION ═══════════════════════════════════ */}
      {uiState === 'DEPLOYING' && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 bg-[#09090b]">
          <div className="font-mono text-cyan-500 text-lg sm:text-xl flex flex-col gap-3 items-start deployment-text">
            <div className="animate-[fade-in_0.1s_forwards]">ESTABLISHING CONNECTION...</div>
            <div className="animate-[fade-in_0.1s_0.4s_forwards] opacity-0">ROUTING DATA PACKET...</div>
            <div className="animate-[fade-in_0.1s_0.8s_forwards] opacity-0 text-white font-bold drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">SERVER NETWORK ONLINE.</div>
          </div>
        </div>
      )}

      {/* ══ STAGE 4: MAIN GAME ═══════════════════════════════════════════════ */}
      {uiState === 'GAME' && (
        <div className="w-full min-h-full flex flex-col items-center justify-center py-8 sm:py-10 px-4 animate-[fade-in_0.5s_ease-out]">

          {/* Centered Desktop Grid Workspace */}
          <div className="w-full max-w-[1160px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(220px,280px)_minmax(0,560px)_minmax(220px,280px)] gap-8 lg:gap-10 justify-center items-center">

            {/* LEFT PANEL (Difficulty & Options) */}
            <div className="w-full flex flex-col gap-8 order-4 lg:order-1 self-center">
              {/* Difficulty */}
              <div className="bg-[#121214] border border-slate-800 rounded-[4px] p-6 shadow-xl">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-4 flex items-center gap-2">
                  Threat Level
                </h3>
                <div className="flex flex-col gap-3">
                  {(['EASY', 'MEDIUM', 'HARD'] as const).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => handleDifficultyChange(diff)}
                      disabled={gameStatus === 'PLAYING' || gameStatus === 'PAUSED'}
                      className={`py-3 text-sm font-bold rounded-[2px] border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed tracking-widest ${difficulty === diff
                        ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/50 shadow-[inset_0_0_15px_rgba(6,182,212,0.15)]'
                        : 'bg-black/40 text-slate-500 border-slate-800 hover:border-slate-600 hover:text-slate-300'
                        }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="bg-[#121214] border border-slate-800 rounded-[4px] p-6 shadow-xl flex flex-col gap-5">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                  System Options
                </h3>
                <button
                  onClick={() => { const m = audio.toggleMute(); setMuted(m); }}
                  className="w-full py-3.5 flex items-center justify-center gap-2 border border-slate-800 bg-black/40 hover:border-slate-600 hover:text-slate-300 text-slate-400 rounded-[2px] transition-colors cursor-pointer text-sm font-bold tracking-widest"
                >
                  {muted ? <><VolumeX className="w-4 h-4 text-red-500" /> Audio Muted</> : <><Volume2 className="w-4 h-4 text-emerald-500" /> Audio Enabled</>}
                </button>

                <div className="hidden lg:block pt-5 border-t border-slate-800/50">
                  <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600 mb-3">Controls</h4>
                  <div className="flex flex-col gap-2 text-xs text-slate-500 font-mono">
                    <div className="flex justify-between"><span>[W, A, S, D]</span> <span>MOVE</span></div>
                    <div className="flex justify-between"><span>[UP, DOWN, LEFT, RIGHT ARROWS]</span> <span>MOVE</span></div>
                    <div className="flex justify-between"><span>[SPACE]</span> <span>PAUSE</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* CENTER PANEL (Game Board & HUD) */}
            <div className="w-full flex flex-col items-center order-1 lg:order-2 self-center mx-auto" style={{ maxWidth: '560px' }}>

              {/* HUD */}
              <div className="w-full flex justify-between items-end mb-4 px-2">
                <div className="flex gap-6 sm:gap-8">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-cyan-500/70 mb-2">Integrity</div>
                    <div className="flex gap-2">
                      {Array.from({ length: LIVES }).map((_, i) => (
                        <div key={i} className={`w-4 h-2.5 rounded-[1px] transition-colors ${i < lives ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]' : 'bg-slate-800/80 border border-slate-700/50'}`} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-cyan-500/70 mb-1">Score</div>
                    <div className="text-2xl sm:text-3xl font-black font-mono text-white leading-none drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{score}</div>
                  </div>
                </div>

                <div className="flex items-end gap-5 sm:gap-8">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-bold uppercase tracking-widest text-cyan-500/70 mb-1 flex items-center justify-end gap-1">
                      Record
                    </div>
                    <div className="text-2xl sm:text-3xl font-black font-mono text-slate-300 leading-none">{highScore}</div>
                  </div>

                  <button
                    onClick={() => setGameStatus(prev => prev === 'PLAYING' ? 'PAUSED' : 'PLAYING')}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#121214] border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
                    aria-label="Pause Menu"
                  >
                    {gameStatus === 'PLAYING' ? <Pause className="w-5 h-5 sm:w-6 sm:h-6" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6" />}
                  </button>
                </div>
              </div>

              {/* Game Canvas Container */}
              <div className="w-full relative border border-slate-700/80 rounded-[4px] overflow-hidden bg-[#09090b] shadow-[0_0_60px_rgba(0,0,0,0.6)] ring-1 ring-cyan-500/10" style={{ touchAction: 'none' }}>
                <canvas
                  ref={canvasRef}
                  width={CANVAS_W}
                  height={CANVAS_H}
                  className="block w-full aspect-square"
                />

                {/* GAME STATE OVERLAYS */}
                {gameStatus === 'PAUSED' && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 bg-[#09090b]/85 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]">
                    <h3 className="text-3xl font-black uppercase tracking-[0.2em] text-white mb-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">Paused</h3>
                    <div className="flex flex-col gap-5 w-64">
                      <button
                        onClick={() => setGameStatus('PLAYING')}
                        className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-[#09090b] font-black uppercase tracking-widest text-sm rounded-[2px] shadow-[0_0_20px_rgba(6,182,212,0.3)] cursor-pointer transition-colors"
                      >
                        Resume
                      </button>
                      <button
                        onClick={returnToMenu}
                        className="w-full py-4 border border-slate-700 bg-black/40 text-slate-400 hover:text-white hover:border-slate-500 font-bold uppercase tracking-widest text-sm rounded-[2px] cursor-pointer transition-colors"
                      >
                        Abort Mission
                      </button>
                    </div>
                  </div>
                )}

                {gameStatus === 'GAME_OVER' && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 bg-[#09090b]/90 backdrop-blur-md animate-[fade-in_0.2s_ease-out]">
                    <h3 className="text-4xl font-black uppercase tracking-[0.15em] text-red-500 mb-4 drop-shadow-[0_0_20px_rgba(239,68,68,0.6)]">Packet Lost</h3>
                    <p className="text-slate-300 mb-10 font-mono text-base">Final Score: <span className="text-white font-bold">{score}</span></p>

                    {showNamePrompt ? (
                      <div className="w-full max-w-sm flex flex-col gap-5">
                        <div className="text-sm font-bold text-cyan-400 uppercase tracking-[0.15em] text-center animate-pulse">New High Score!</div>
                        <input
                          type="text"
                          maxLength={15}
                          placeholder="ENTER DESIGNATION"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleSaveScore(); }}
                          className="w-full bg-[#121214] border border-cyan-500/50 rounded-[2px] px-5 py-4 text-center text-base font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]"
                          autoFocus
                        />
                        <div className="flex gap-4 w-full">
                          <button onClick={handleSaveScore} className="flex-1 py-4 bg-cyan-500 hover:bg-cyan-400 text-[#09090b] font-black uppercase tracking-widest text-sm rounded-[2px] shadow-[0_0_20px_rgba(6,182,212,0.3)] cursor-pointer transition-colors">Save</button>
                          <button onClick={handleSkipSaveScore} className="flex-1 py-4 border border-slate-700 bg-black/40 text-slate-400 hover:text-white hover:border-slate-500 font-bold uppercase tracking-widest text-sm rounded-[2px] cursor-pointer transition-colors">Skip</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-5 w-64 mt-4">
                        <button onClick={resetGame} className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-[#09090b] font-black uppercase tracking-widest text-sm rounded-[2px] shadow-[0_0_20px_rgba(6,182,212,0.3)] cursor-pointer transition-colors">Deploy Again</button>
                        <button onClick={returnToMenu} className="w-full py-4 border border-slate-700 bg-black/40 text-slate-400 hover:text-white hover:border-slate-500 font-bold uppercase tracking-widest text-sm rounded-[2px] cursor-pointer transition-colors">Main Menu</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* MOBILE D-PAD (Mobile: Order 2) */}
            <div className="w-full flex flex-col items-center order-2 lg:hidden mt-4 mb-6">
              <div className="flex flex-col items-center gap-3 w-full max-w-[320px]">
                <div className="flex gap-3 justify-center">
                  <div className="w-16 h-16" />
                  <button onPointerDown={(e) => { e.preventDefault(); dpadMove('UP'); }} disabled={notPlaying} className={dpadBtnStyle}>▲</button>
                  <div className="w-16 h-16" />
                </div>
                <div className="flex gap-3 justify-center">
                  <button onPointerDown={(e) => { e.preventDefault(); dpadMove('LEFT'); }} disabled={notPlaying} className={dpadBtnStyle}>◀</button>
                  <button onPointerDown={(e) => { e.preventDefault(); dpadMove('DOWN'); }} disabled={notPlaying} className={dpadBtnStyle}>▼</button>
                  <button onPointerDown={(e) => { e.preventDefault(); dpadMove('RIGHT'); }} disabled={notPlaying} className={dpadBtnStyle}>▶</button>
                </div>
              </div>
            </div>

            {/* RIGHT PANEL (Leaderboard) */}
            <div className="w-full flex flex-col gap-6 order-5 lg:order-3 self-start">
              <div className="bg-[#121214] border border-slate-800 rounded-[4px] p-5 shadow-lg flex-1">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-4 flex items-center gap-2">
                  <Award className="w-3.5 h-3.5 text-cyan-500/70" /> Top Transmissions
                </h3>

                <div className="flex flex-col gap-2 overflow-y-auto max-h-[300px] pr-1">
                  {leaderboard.length === 0 ? (
                    <div className="text-xs italic text-slate-600 text-center py-6 border border-dashed border-slate-800/50 rounded-[2px]">
                      No records found for {difficulty}.
                    </div>
                  ) : (
                    leaderboard.slice(0, 8).map((entry, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs bg-black/30 px-3 py-2.5 rounded-[2px] border border-slate-800/60 hover:border-slate-700 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-slate-600">{String(idx + 1).padStart(2, '0')}</span>
                          <span className="font-bold text-slate-300 truncate max-w-[90px]">{entry.playerName}</span>
                        </div>
                        <span className="font-mono font-bold text-cyan-400 drop-shadow-[0_0_2px_rgba(6,182,212,0.5)]">{entry.score}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default HighwayCrosser;
