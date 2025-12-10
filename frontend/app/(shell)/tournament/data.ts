export type TournamentRound = {
	name: string;
	matches: Array<{
		id: string;
		left: { name: string; seed?: number; score?: number; winner?: boolean };
		right: { name: string; seed?: number; score?: number; winner?: boolean };
	}>;
};

export type TournamentMeta = {
	title: string;
	subtitle: string;
	status: string;
	players: number;
	roundsCount: number;
	matchesCount: number;
};

export type TournamentDefinition = {
	id: string;
	meta: TournamentMeta;
	rounds: TournamentRound[];
};

export const neonCupMeta: TournamentMeta = {
	title: "Neon Cup 2024",
	subtitle: "4 Players",
	status: "Finished",
	players: 4,
	roundsCount: 2,
	matchesCount: 3,
};

export const neonCupRounds: TournamentRound[] = [
	{
		name: "Semifinals",
		matches: [
			{ id: "sf1", left: { name: "Player 1" }, right: { name: "Player 2" } },
			{ id: "sf2", left: { name: "Player 3" }, right: { name: "Player 4" } },
		],
	},
	{
		name: "Final",
		matches: [
			{ id: "f1", left: { name: "TBD" }, right: { name: "TBD" } },
		],
	},
	{
		name: "Winner",
		matches: [
			{ id: "w1", left: { name: "TBD" }, right: { name: "" } },
		],
	},
];

export const neonCup8Meta: TournamentMeta = {
	title: "Midnight Open 2024",
	subtitle: "8 Players",
	status: "Finished",
	players: 8,
	roundsCount: 3,
	matchesCount: 7,
};

export const neonCup8Rounds: TournamentRound[] = [
	{
		name: "Quarterfinals",
		matches: [
			{ id: "qf1", left: { name: "user", seed: 1, score: 2, winner: true }, right: { name: "Rogue", seed: 8, score: 0 } },
			{ id: "qf2", left: { name: "Viper", seed: 4, score: 2, winner: true }, right: { name: "Artemis", seed: 5, score: 1 } },
			{ id: "qf3", left: { name: "Nimbus", seed: 3, score: 2, winner: true }, right: { name: "Kairo", seed: 6, score: 0 } },
			{ id: "qf4", left: { name: "Tikota", seed: 2, score: 2, winner: true }, right: { name: "Atlas", seed: 7, score: 1 } },
		],
	},
	{
		name: "Semifinals",
		matches: [
			{ id: "sf1", left: { name: "user", seed: 1, score: 2, winner: true }, right: { name: "Viper", seed: 4, score: 1 } },
			{ id: "sf2", left: { name: "Nimbus", seed: 3, score: 0 }, right: { name: "Tikota", seed: 2, score: 2, winner: true } },
		],
	},
	{
		name: "Final",
		matches: [
			{ id: "f1", left: { name: "user", seed: 1, score: 3, winner: true }, right: { name: "Tikota", seed: 2, score: 2 } },
		],
	},
];

export const tournaments: Record<string, TournamentDefinition> = {
	"neon-cup": {
		id: "neon-cup",
		meta: neonCupMeta,
		rounds: neonCupRounds,
	},
	"midnight-open": {
		id: "midnight-open",
		meta: neonCup8Meta,
		rounds: neonCup8Rounds,
	},
};

export function getTournamentById(id: string): TournamentDefinition | null {
	return tournaments[id] ?? null;
}

export type PlacementRank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export function labelPlacement(rank: PlacementRank, size: 4 | 8) {
	if (rank === 1) return "Champion";
	if (rank === 2) return "Runner-up";
	if (size === 8) {
		if (rank >= 5) return "Top 8";
		return "Top 4";
	}
	return "Semifinalist";
}
//Champion => (Green)
//Runner-up => (Amber/Orange)
//Top 4 => (Cyan/Blue)
//Top 8 => (Indigo/Purple)
//Semifinalist => (Fuchsia)


export type TournamentHistory = {
	id: string;
	name: string;
	rank: PlacementRank;
	size: 4 | 8;
	bracket: string;
	wins: number;
	losses: number;
	finishedAt: string;
	prize: string;
	tags: string[];
};

export const tournamentHistory: TournamentHistory[] = [
	{
		id: "neon-cup-2024",
		name: "Neon Cup 2024",
		rank: 1,
		size: 4,
		bracket: "4 PLAYERS",
		wins: 2,
		losses: 0,
		finishedAt: "Dec 02 2024",
		prize: "+20 rating | Champion badge",
		tags: ["shutout", "speedrun"],
	},
	{
		id: "midnight-open",
		name: "Midnight Open",
		rank: 2,
		size: 8,
		bracket: "8 PLAYERS",
		wins: 2,
		losses: 1,
		finishedAt: "Oct 12 2024",
		prize: "+35 rating | Runner-up badge",
		tags: ["clutch", "marathon"],
	},
	{
		id: "pulse-series",
		name: "Pulse Series",
		rank: 5,
		size: 8,
		bracket: "8 PLAYERS",
		wins: 2,
		losses: 1,
		finishedAt: "Jun 18 2024",
		prize: "+20 rating | Top 8 badge",
		tags: ["comeback", "close-game"],
	},
	{
		id: "city-grid",
		name: "City Grid Invitational",
		rank: 3,
		size: 4,
		bracket: "4 PLAYERS",
		wins: 2,
		losses: 1,
		finishedAt: "Apr 03 2024",
		prize: "+40 rating | Semifinalist",
		tags: ["first-blood", "close-game"],
	},
	{
		id: "city-grid-2024",
		name: "City Grid Invitational",
		rank: 3,
		size: 4,
		bracket: "4 PLAYERS",
		wins: 2,
		losses: 1,
		finishedAt: "Apr 03 2024",
		prize: "+40 rating | Semifinalist",
		tags: ["first-blood", "close-game"],
	},
];