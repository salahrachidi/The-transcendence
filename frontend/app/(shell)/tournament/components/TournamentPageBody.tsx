"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import TournamentHeader from "./TournamentHeader";
import BracketGrid from "./BracketGrid";
import type { TournamentDefinition } from "../data";
import { useLanguage } from "@/app/context/LanguageContext";

type Tab = "Bracket" | "Matches";

export default function TournamentPageBody({ tournament }: { tournament: TournamentDefinition }) {
	const [currentRound, setCurrentRound] = useState<string>("");

	return (
		<>
			<div className="grid grid-cols-12 sm:gap-4 md:gap-5 lg:gap-6 2xl:gap-8 min-w-0">
				<section className="col-span-12">
					<TournamentHeader meta={tournament.meta} currentRound={currentRound} />
				</section>
			</div>

			<div className="grid grid-cols-12 sm:gap-4 md:gap-5 lg:gap-6 2xl:gap-8 min-w-0 mt-6">
				<section className="col-span-12">
					<div key="bracket" className="tab-panel">
						<BracketGrid
							tournamentId={tournament.id}
							meta={tournament.meta}
							rounds={tournament.rounds}
							onRoundChange={setCurrentRound}
						/>
					</div>
				</section>
			</div>
		</>
	);
}
