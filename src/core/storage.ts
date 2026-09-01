import type { ScoreEntry, GameStats } from "./types";

const PREFIX = "chc_";

export const storage = {
  getGameStats(gameId: string): GameStats {
    const data = localStorage.getItem(`${PREFIX}stats_${gameId}`);
    if (data) {
      try {
        return JSON.parse(data) as GameStats;
      } catch {
        // Fallback
      }
    }
    return { highScore: 0, playCount: 0, lastPlayed: "" };
  },

  saveGameStats(gameId: string, stats: Partial<GameStats>): void {
    const current = this.getGameStats(gameId);
    const updated = {
      ...current,
      ...stats,
      lastPlayed: stats.lastPlayed ?? new Date().toISOString(),
    };
    localStorage.setItem(`${PREFIX}stats_${gameId}`, JSON.stringify(updated));
  },

  incrementPlayCount(gameId: string): void {
    const current = this.getGameStats(gameId);
    this.saveGameStats(gameId, {
      playCount: current.playCount + 1,
      lastPlayed: new Date().toISOString(),
    });
  },

  updateHighScore(gameId: string, score: number): boolean {
    const current = this.getGameStats(gameId);
    if (score > current.highScore) {
      this.saveGameStats(gameId, { highScore: score });
      return true;
    }
    return false;
  },

  getLeaderboard(gameId: string): ScoreEntry[] {
    const data = localStorage.getItem(`${PREFIX}leaderboard_${gameId}`);
    if (data) {
      try {
        return JSON.parse(data) as ScoreEntry[];
      } catch {
        // Fallback
      }
    }
    return [];
  },

  addLeaderboardScore(gameId: string, entry: Omit<ScoreEntry, "date">): boolean {
    const current = this.getLeaderboard(gameId);
    const newEntry: ScoreEntry = { ...entry, date: new Date().toISOString() };
    const updated = [...current, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    localStorage.setItem(`${PREFIX}leaderboard_${gameId}`, JSON.stringify(updated));
    this.updateHighScore(gameId, entry.score);
    return updated.some((e) => e.date === newEntry.date);
  },
};
