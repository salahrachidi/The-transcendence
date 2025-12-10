// app/(shell)/dashboard/data.ts

export type MatchResult = "WIN" | "LOSS";

export type UserProfile = {
	nickname: string;
	avatarUrl: string;
	games: number;
	wins: number;
	winRate: number; // 0–100
};

export type LeaderboardEntry = {
	id: string;
	rank: number;
	name: string;
	avatarUrl: string;
	score: number;
};

export type OnlineFriend = {
	id: string;
	name: string;
	avatarUrl: string;
	online: boolean;
};

export type MatchHistoryItem = {
	id: string;
	opponent: string;
	avatarUrl: string;
	result: MatchResult;
	scoreSelf: number;
	scoreOpponent: number;
	delta: number; // rating change
	playedAt: string; // ISO date, e.g. "2025-11-07T20:15:00Z"
};

/**
 * HOW TO FEED REAL DATA INTO THIS CHART
 *
 * Right now the chart uses hard-coded dummy data for 7d and 30d (see `mockStatsByRange` in data.ts).
 * In a real implementation, the backend should expose something like:
 *
 *   GET /me/matches  -> Match[]
 *
 *   type MatchResult = "WIN" | "LOSS";
 *   interface Match {
 *     id: string;
 *     playedAt: string;        // ISO date string
 *     mode: "1v1" | "tournament";
 *     opponentNickname: string;
 *     scoreSelf: number;       // your score
 *     scoreOpponent: number;   // opponent score
 *     result: MatchResult;     // "WIN" or "LOSS"
 *   }
 *
 * From this list of matches you can:
 *   1) Bucket matches per day (or per season) depending on the selected range (7d / 30d).
 *   2) For each bucket, count how many wins and losses there are.
 *
 * The goal is to build, for each range, an object shaped like:
 *
 *   {
 *     labels: string[];  // x-axis labels, e.g. ["Mon", "Tue", ...] or ["D1", "D2", ...]
 *     wins:   number[];  // same length as labels, wins per bucket
 *     losses: number[];  // same length as labels, losses per bucket
 *   }
 *
 * Then you can either:
 *   - Compute this shape on the backend and return it directly for 7d / 30d, or
 *   - Fetch Match[] on the frontend and transform it into this shape here.
 *
 * Once you have real data, simply replace the dummy `statsByRange` contents
 * with the values coming from your API (or wire it through state instead of a constant).
 */
export type StatsRangeKey = "7" | "30";

export type StatsRangeData = {
	labels: string[];
	wins: number[];
	losses: number[];
};

export type RadarStats = {
	attack: number;
	defense: number;
	speed: number;
	control: number;
	consistency: number;
};

export const mockRadarStats: RadarStats = {
	attack: 80,
	defense: 72,
	speed: 88,
	control: 75,
	consistency: 69,
};