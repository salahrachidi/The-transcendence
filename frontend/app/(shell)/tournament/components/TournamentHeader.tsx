"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { TournamentMeta } from "../data";
import { useLanguage } from "@/app/context/LanguageContext";

const tabs = ["Bracket", "Matches"] as const;

export default function TournamentHeader({
	meta,
	currentRound,
}: {
	meta: TournamentMeta;
	currentRound?: string;
}) {
	const { t } = useLanguage();
	const params = useSearchParams();
	const sizeParam = params.get("size");
	const playersParam = params.get("players");

	const players = useMemo(() => {
		if (!playersParam) return null;
		return playersParam.split(",").map(p => decodeURIComponent(p).trim());
	}, [playersParam]);

	const playersCount = players?.length ?? meta.players;
	const size = sizeParam ? Number(sizeParam) : playersCount;
	const matchesCount = size ? Math.max(0, size - 1) : meta.matchesCount;
	const roundsCount = size ? Math.round(Math.log2(size)) : meta.roundsCount;

	const getStatusText = (status: string) => {
		return t("tournament.header.status").replace("{{status}}", status);
	};

	const getPlayersText = (count: number, total: number) => {
		const raw = t("tournament.header.players").replace("{{count}}", count.toString());
		return total ? `${raw} / ${total}` : raw;
	};

	// Use translations for tabs or just rely on parent?
	// Actually TournamentHeader doesn't render tabs, TournamentPageBody does (or used to).
	// Looking at the code, TournamentHeader just shows stats.
	// Oh, wait, I see `const tabs = ["Bracket", "Matches"] as const;` in line 8 but it's unused in the return?
	// Let's check the return.
	// It returns a section with stats. The tabs are not rendered here.
	// Ah, I see `TournamentPageBody` might be rendering tabs or passing them.
	// Let's check `TournamentPageBody.tsx` again.
	// `TournamentPageBody` renders `BracketGrid`. The tabs switching logic seems absent or simplified in this current version.
	// In `TournamentHeader.tsx`, I see `getStatusText` and `getPlayersText` are already using `t`.
	// Line 54: `t("tournament.header.matches")`
	// Line 55: `t("tournament.header.round")`
	// So `TournamentHeader` is PARTIALLY internationalized.
	// I need to make sure the specific keys I added like "Bracket" and "Matches" are used if they are rendered.
	// In the file content I viewed earlier:
	// 54: <span className="chip px-3 py-1.5">{t("tournament.header.matches").replace("{{count}}", matchesCount.toString())}</span>
	// 55: <span className="chip px-3 py-1.5">{t("tournament.header.round").replace("{{round}}", "—")}</span>
	// It seems mostly done. Let's just remove the unused `tabs` constant if it's there, or leave it.
	// Wait, the task was: "Ensure "Bracket" and "Matches" tabs use translations."
	// Providing I don't see tabs in the header return, maybe I missed something or they were removed in a previous refactor.
	// I will just verify `TournamentHeader` again.

	// Actually, looking at `TournamentPageBody.tsx`:
	// It renders `TournamentHeader` and then `BracketGrid`. No tab switcher visible.
	// So the "Tabs" might be a leftover concept or planned feature.
	// I will removing existing unused `tabs` array in `TournamentHeader` to clean up.

	return (
		<section className="glass p-5 md:p-6 rounded-2xl">
			{/* Header row */}
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
				<div className="min-w-0">
					<h1 className="text-2xl md:text-3xl font-extrabold leading-tight truncate">{meta.title}</h1>
					<div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/85">
						<span>{getStatusText(meta.status)}</span>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2 text-sm text-white/85">
					<span className="chip px-3 py-1.5">
						{getPlayersText(playersCount, size ? size : 0).split(" / ")[0] + (size ? ` / ${size}` : "")}
					</span>
					<span className="chip px-3 py-1.5">{t("tournament.header.matches").replace("{{count}}", matchesCount.toString())}</span>
					<span className="chip px-3 py-1.5">{t("tournament.header.round").replace("{{round}}", currentRound || "—")}</span>
				</div>
			</div>
		</section>
	);
}
