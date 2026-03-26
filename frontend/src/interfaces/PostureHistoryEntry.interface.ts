export interface PostureHistoryEntry {
  timestamp: number;
  ranks: Record<string, number>;
  postureScore: number;
  hand: string;
}
