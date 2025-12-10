import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { resolveMatchContext, type SearchParamRecord } from "@/app/lib/matches";
import GameMatchClient from "./GameMatchClient";

type MatchPageProps = {
	params: Promise<{ matchId: string }>;
	searchParams: Promise<SearchParamRecord>;
};

export const metadata: Metadata = { title: "Match" };

// Force dynamic rendering - no caching for game routes (especially /game/queue)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function GameMatchPage({ params, searchParams }: MatchPageProps) {
	const p = await params;
	const sp = await searchParams;
	//console.log("GameMatchPage params:", p); DEBUG
	const context = resolveMatchContext(p.matchId, sp);
	//console.log("Resolved context:", context); DEBUG
	if (!context) {
		redirect("/game?error=no-match");
	}

	return (
		<GameMatchClient 
			matchId={context.id}
			config={context.config}
			initialState={context.state}
			wsURL={context.wsURL}
			playerName={context.playerName}
		/>
	);
}
