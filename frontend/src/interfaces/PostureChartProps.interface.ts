import type { PostureHistoryEntry } from './PostureHistoryEntry.interface';

export interface PostureChartProps {
  ranks: Record<string, number>;
  history?: PostureHistoryEntry[];
  showPostureLine?: boolean;
}
