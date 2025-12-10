import MatchHistoryClient from "./components/MatchHistoryClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Match History" };

type SearchParams = Record<string, string | string[] | undefined>;

function pickString(value: string | string[] | undefined): string | undefined {
	return typeof value === "string" ? value : undefined;
}

export default async function MatchHistoryPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
	const sp = await searchParams;
	const error = pickString(sp.error);

	return <MatchHistoryClient error={error} />;
}
