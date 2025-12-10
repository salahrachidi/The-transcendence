import type { Metadata } from "next";
import TournamentPageBody from "./components/TournamentPageBody";
import TournamentGatekeeper from "./components/TournamentGatekeeper";
import { neonCupMeta, neonCupRounds, type TournamentDefinition } from "./data";

export const metadata: Metadata = {
	title: "Tournament Console",
};

function pickString(value: string | string[] | undefined): string | undefined {
	return typeof value === "string" ? value : undefined;
}

function buildAdHocTournament(searchParams?: Record<string, string | string[] | undefined>): TournamentDefinition | null {
	if (!searchParams) return null;
	const playersParam = pickString(searchParams.players);
	const sizeParam = Number(pickString(searchParams.size));
	// Strict check for 4 as per new requirement, or generic check if flexible
	const size = sizeParam === 4 ? 4 : undefined;

	if (!playersParam || !size) return null;

	const players = playersParam
		.split(",")
		.map(p => decodeURIComponent(p).trim())
		.filter(Boolean);

	if (players.length !== size) return null;

	const roundsCount = Math.round(Math.log2(size));
	const matchesCount = Math.max(0, size - 1);

	const nameParam = pickString(searchParams.name);

	return {
		id: "adhoc", // Static ID for local ephemeral tournament
		meta: {
			title: nameParam || `Local Tournament`,
			subtitle: `${size} Players Mode`,
			status: "In Progress",
			players: size,
			roundsCount,
			matchesCount,
		},
		rounds: [],
	};
}

const demoTournament: TournamentDefinition = {
	id: "demo-bracket",
	meta: {
		...neonCupMeta,
		title: "Demo Tournament",
		subtitle: "Static Visualization",
		status: "Finished",
	},
	rounds: neonCupRounds,
};

export default async function TournamentConsolePage(props: {
	searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
	const searchParams = await props.searchParams;

	// Try to build tour from params
	const adHoc = buildAdHocTournament(searchParams);

	// If adHoc exists, use it. Otherwise show Demo.
	const tournament = adHoc ?? demoTournament;
	const showGatekeeper = !adHoc;

	return (
		<>
			<TournamentPageBody tournament={tournament} />
			{showGatekeeper && <TournamentGatekeeper />}
		</>
	);
}