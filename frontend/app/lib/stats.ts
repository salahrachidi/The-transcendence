// app/lib/stats.ts

export type MatchResult = "WIN" | "LOSS";

export interface Match {
	id: string;
	playedAt: string;        // ISO date string
	scoreSelf: number;       // your score
	scoreOpponent: number;   // opponent score
	result: MatchResult;     // "WIN" | "LOSS"
}

export interface BaseStats {
	games: number;
	wins: number;
	losses: number;
	totalScored: number;
	totalConceded: number;
}

export interface RadarStats {
	attack: number;      // 0–100
	defense: number;     // 0–100
	speed: number;       // 0–100
	control: number;     // 0–100
	consistency: number; // 0–100
}

/**
 * Aggregate raw matches into basic totals.
 */
export function computeBaseStats(matches: Match[]): BaseStats {
	let games = matches.length;
	let wins = 0;
	let losses = 0;
	let totalScored = 0;
	let totalConceded = 0;

	for (const m of matches) {
		if (m.result === "WIN") wins++;
		else losses++;

		totalScored += m.scoreSelf;
		totalConceded += m.scoreOpponent;
	}

	return {
		games,
		wins,
		losses,
		totalScored,
		totalConceded,
	};
}

/**
 * Map base stats -> 5 radar values between 0–100.
 * MAX_POINTS_PER_GAME is your game target score (ex: 12 in Pong).
 */
export function toRadarStats(base: BaseStats, maxPointsPerGame: number): RadarStats {
	if (base.games === 0) {
		return { attack: 0, defense: 0, speed: 0, control: 0, consistency: 0 };
	}

	const avgScored = base.totalScored / base.games;
	const avgConceded = base.totalConceded / base.games;
	const winRate = base.wins / base.games; // 0–1

	// 0–100 scales (simple but logical)
	const attack = Math.min(100, (avgScored / maxPointsPerGame) * 100);
	const defense = Math.min(100, (1 - avgConceded / maxPointsPerGame) * 100);
	const control = Math.round(winRate * 100);

	// “Fake” but consistent and easy:
	const speed = Math.min(100, 40 + winRate * 60);          // more wins => more speed
	const consistency = Math.min(100, 30 + base.games * 5);  // more games => more consistent

	return { attack, defense, speed, control, consistency };
}