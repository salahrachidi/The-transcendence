// Single source of truth for the Game page

/* ========= Types ========= */
export type GameMode = "1v1" | "local" | "tournament";
export type PlayerId = "p1" | "p2";

export type Controls = {
	up: "ArrowUp" | "W" | "w";
	down: "ArrowDown" | "S" | "s";
};

export type Player = {
	id: string;
	nickname: string;
	displayName: string;
	avatarUrl: string;
	score: number;
	isReady: boolean;
};

export type Score = {
	p1: number;
	p2: number;
	bestOf: 3 | 5 | 7;
};

export type GameConfig = {
	mode: GameMode;
};

export type GameState = {
	players: Record<PlayerId, Player>;
	score: Score;
};

/* ========= Default Config & State ========= */
const defaultPlayers: Record<PlayerId, Player> = {
	p1: {
		id: "p1",
		nickname: "Player 1",
		displayName: "Player 1",
		avatarUrl: "",
		score: 0,
		isReady: true,
	},
	p2: {
		id: "p2",
		nickname: "Player 2",
		displayName: "Player 2",
		avatarUrl: "",
		score: 0,
		isReady: true,
	},
};
export const defaultGameConfig: GameConfig = {
	mode: "local",
};

export const initialGameState: GameState = {
	players: defaultPlayers,
	score: { p1: 0, p2: 0, bestOf: 7 },
};

/* ========= Helpers ========= */
export function keyToLabel(k: string): string {
	if (k === "ArrowUp") return "↑";
	if (k === "ArrowDown") return "↓";
	return k.toUpperCase();
}

// Fixed controls by player id (derived, not stored)
export function getControlsFor(id: PlayerId): Controls {
	return id === "p1"
		? { up: "W", down: "S" }
		: { up: "ArrowUp", down: "ArrowDown" };
}

export function getPlayerKeyLabelsById(id: PlayerId): [string, string] {
	const c = getControlsFor(id);
	return [keyToLabel(c.up), keyToLabel(c.down)];
}

export function resolveModeFromSearch(search: string, fallback: GameMode): GameMode {
	const sp = new URLSearchParams(search);
	const m = sp.get("mode");
	if (m === "1v1" || m === "local" || m === "tournament") return m as GameMode;
	return fallback;
}

function resolveSearchParams(search: string | URLSearchParams): URLSearchParams {
	return typeof search === "string" ? new URLSearchParams(search) : search;
}

export function resolvePlayersFromSearch(search: string | URLSearchParams): Record<PlayerId, Player> {
	const sp = resolveSearchParams(search);
	const p1Name = sp.get("p1")?.trim() || initialGameState.players.p1.displayName;
	const p2Name = sp.get("p2")?.trim() || initialGameState.players.p2.displayName;
	return {
		p1: { ...initialGameState.players.p1, displayName: p1Name, nickname: p1Name },
		p2: { ...initialGameState.players.p2, displayName: p2Name, nickname: p2Name },
	};
}

export function resolveScoreFromSearch(search: string | URLSearchParams, mode: GameMode = "local"): Score {
	const sp = resolveSearchParams(search);

	// Enforce Best of 7 for non-local matches (remote/ranked)
	if (mode !== "local") {
		return { ...initialGameState.score, bestOf: 7 };
	}

	const bestOfRaw = Number(sp.get("bestOf"));
	const allowed: Score["bestOf"][] = [3, 5, 7];
	const bestOf = allowed.includes(bestOfRaw as Score["bestOf"])
		? (bestOfRaw as Score["bestOf"])
		: initialGameState.score.bestOf;
	return { ...initialGameState.score, bestOf };
}

export function resolveGameStateFromSearch(search: string | URLSearchParams): GameState {
	const config = resolveGameConfigFromSearch(search);
	return {
		players: resolvePlayersFromSearch(search),
		score: resolveScoreFromSearch(search, config.mode),
	};
}

export function resolveGameConfigFromSearch(search: string | URLSearchParams): GameConfig {
	const mode = resolveModeFromSearch(
		typeof search === "string" ? search : search.toString(),
		defaultGameConfig.mode,
	);
	return { mode };
}

/* ========= Match history helpers ========= */
export type MatchSnapshot = {
	score: string;
	delta: number;
	durationSec: number; // Added for speedrun/marathon logic
};

export type MatchTag =
	| "shutout"
	| "close-game"
	| "clutch"
	| "first-blood"
	| "comeback"
	| "speedrun"
	| "marathon";

//const remarkPool = [
//	"Closed the set with aggressive serves after a slow start.",
//	"Tempo dipped mid-match; reset focus for the next rally.",
//	"Defense locked in on the final stretch to seal it.",
//	"Steady rally pacing kept the scoreline comfortable.",
//];

//export function resolveRemarkFromIndex(idx: number): string {
//	return remarkPool[idx % remarkPool.length];
//}

export function parseScorePair(score: string): { self: number; opp: number } | null {
	const nums = score.match(/\d+/g);
	if (!nums || nums.length < 2) return null;
	const [self, opp] = nums.slice(0, 2).map(n => Number(n));
	if (Number.isNaN(self) || Number.isNaN(opp)) return null;
	return { self, opp };
}

export function resolveMatchTags(match: MatchSnapshot, idx: number): string[] {
	const tags = new Set<string>();

	const parsed = parseScorePair(match.score);
	if (parsed) {
		const { self, opp } = parsed;
		const diff = Math.abs(self - opp);
		const loserScore = Math.min(self, opp);
		const winnerScore = Math.max(self, opp);

		// shutout: loser scored 0
		if (loserScore === 0) tags.add("shutout");

		// close-game: score difference <= 2
		if (diff <= 2) tags.add("close-game");

		// clutch: win by exactly 1
		if (diff === 1) tags.add("clutch");
	}

	// speedrun: duration < 90s
	if (match.durationSec < 90) tags.add("speedrun");

	// marathon: duration > 600s
	if (match.durationSec > 600) tags.add("marathon");

	return Array.from(tags);
}


