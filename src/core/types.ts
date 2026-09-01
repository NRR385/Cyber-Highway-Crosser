export interface ScoreEntry {
  playerName: string;
  score: number;
  date: string;
}

export interface GameStats {
  highScore: number;
  playCount: number;
  lastPlayed: string;
  [key: string]: unknown;
}
