import {
	GameConfig,
	GameState,
	initialGameState,
	resolveGameConfigFromSearch,
	resolveGameStateFromSearch,
} from "@/app/(shell)/game/data";

export type MatchContext = {
	id: string;
	label: string;
	source: "mock" | "local" | "remote";
	config: GameConfig;
	state: GameState;
	wsURL?: string;
	playerName?: string;
};

export type SearchParamRecord = Record<string, string | string[] | undefined>;

const seededMatches: Record<string, MatchContext> = {};

const LOCAL_MODE = "local";

function recordToSearchParams(record?: SearchParamRecord): URLSearchParams {
	const sp = new URLSearchParams();
	if (!record) return sp;
	for (const [key, value] of Object.entries(record)) {
		if (typeof value === "string") {
			sp.append(key, value);
			continue;
		}
		if (Array.isArray(value)) {
			value.forEach(entry => {
				if (typeof entry === "string") sp.append(key, entry);
			});
		}
	}
	return sp;
}

function buildLocalContext(matchId: string, searchParams?: SearchParamRecord): MatchContext | null {
	const sp = recordToSearchParams(searchParams);
	if (sp.get("mode") !== LOCAL_MODE) return null;
	const p1 = sp.get("p1")?.trim();
	const p2 = sp.get("p2")?.trim();
	if (!p1 || !p2) return null;
	if (p1.toLowerCase() === p2.toLowerCase()) return null;
	const config = resolveGameConfigFromSearch(sp);
	const state = resolveGameStateFromSearch(sp);
	return {
		id: matchId,
		label: `${p1} vs ${p2}`,
		source: "local",
		config,
		state,
	};
}

function buildRemoteContext(matchId: string): MatchContext | null {
	if (matchId !== "queue") return null;

	let wsURL = "";
	if (typeof window !== "undefined") {
		const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
		wsURL = `${protocol}//${window.location.host}/ws/game`;
	}

	return {
		id: "queue",
		label: "Online Match",
		source: "remote",
		config: { mode: "1v1" },
		state: initialGameState,
		wsURL,
		playerName: "Player"
	};
}

export function resolveMatchContext(matchId: string, searchParams?: SearchParamRecord): MatchContext | null {
	if (!matchId) return null;
	const normalized = matchId.trim();
	const seeded = seededMatches[normalized];
	if (seeded) return seeded;

	const remote = buildRemoteContext(normalized);
	if (remote) return remote;

	return buildLocalContext(normalized, searchParams);
}

export function generateShortId(prefix = "match"): string {
	return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function mapMatchError(code?: string | null): string | null {
	if (!code) return null;
	if (code === "no-match") return "We couldn't find that match. Start a new one?";
	return "Something went wrong. Please try again.";
}
