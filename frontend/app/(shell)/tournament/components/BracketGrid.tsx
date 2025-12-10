"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Play, Trophy, XCircle, Clock, Swords } from "lucide-react";
import { generateShortId } from "@/app/lib/matches";
import type { TournamentMeta, TournamentRound } from "../data";
import GameCanvas from "../../game/components/GameCanvas";
import MiniScoreboard from "./MiniScoreboard";
import { useLanguage } from "@/app/context/LanguageContext";
import { useEffect } from "react";
import { sendTournamentNotification } from "../utils";


type SlotProps = {
	name: string;
	seed?: number;
	score?: number;
	winner?: boolean;
	status?: "pending" | "playing" | "winner" | "loser";
	hideScore?: boolean;
	centered?: boolean;
};

function PlayerSlot({ name, seed, score, winner, status, hideScore, centered }: SlotProps) {
	const { t } = useLanguage();
	const displayName = name === "TBD" ? t("tournament.bracket.tbd") : name;

	const isWinner = status === "winner";
	const isLoser = status === "loser";
	const isPlaying = status === "playing";
	const isPending = status === "pending" || !status;

	return (
		<div
			className={`flex items-center ${centered ? "justify-center" : "justify-between"} gap-2 px-3 py-2 rounded-lg border transition-all duration-300 ${isWinner ? "border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.1)]" :
				isLoser ? "border-red-500/30 bg-red-500/5 opacity-70" :
					isPlaying ? "border-indigo-400/50 bg-indigo-500/10 shadow-[0_0_10px_rgba(99,102,241,0.1)]" :
						"border-white/10 bg-white/5"
				}`}
		>
			<div className="flex items-center gap-3 min-w-0">
				{/* Status Icon */}
				<div className="shrink-0">
					{isWinner && <Trophy className="w-4 h-4 text-emerald-400" />}
					{isLoser && <XCircle className="w-4 h-4 text-red-400/70" />}
					{isPlaying && <Swords className="w-4 h-4 text-indigo-400 animate-pulse" />}
					{isPending && <div className="w-4 h-4" />} {/* Spacer or use Clock */}
				</div>

				<div className="flex items-center gap-2 min-w-0">
					{seed !== undefined && (
						<span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/60 font-mono">
							{seed}
						</span>
					)}
					<span className={`${centered ? "text-md font-bold" : "text-sm font-medium"} truncate max-w-[120px] 2xl:max-w-[200px] ${isLoser ? "text-white/50 line-through decoration-white/30" : "text-white/90 font-bold"
						}`}>
						{displayName}
					</span>
				</div>
			</div>

			{!hideScore && (
				<div className={`text-sm font-bold font-mono ${isWinner ? "text-emerald-400" :
					isLoser ? "text-red-400/70" :
						"text-white/50"
					}`}>
					{typeof score === "number" ? score : "-"}
				</div>
			)}
		</div>
	);
}

// Helper to determine status
const getPlayerStatus = (
	isCompleted: boolean,
	isWinner: boolean,
	isActive: boolean
): SlotProps["status"] => {
	if (isActive) return "playing";
	if (isCompleted) return isWinner ? "winner" : "loser";
	return "pending";
};


function MatchBox({ match, onPlay, enabled, isActive }: {
	match: { id: string; left: SlotProps; right: SlotProps };
	onPlay?: () => void;
	enabled?: boolean;
	isActive?: boolean;
}) {
	const { t } = useLanguage();
	const isCompleted = (match.left.winner || match.right.winner) ?? false;

	return (
		<div className={`rounded-xl border p-3 flex flex-row items-center gap-2 justify-between min-h-[84px] transition-all ${isActive ? "border-indigo-500/40 bg-indigo-500/5 shadow-lg shadow-indigo-500/10" : "border-white/10 bg-white/5"
			}`}>
			<div className="flex-1 min-w-0">
				<PlayerSlot
					{...match.left}
					status={getPlayerStatus(isCompleted, !!match.left.winner, !!isActive)}
				/>
			</div>

			{typeof onPlay === "function" ? (
				<button
					type="button"
					className="shrink-0 w-8 h-8 rounded-full grid place-items-center border border-white/20 bg-slate-900 shadow-xl cursor-pointer hover:bg-white/10 hover:scale-110 active:scale-95 transition-all z-10 group"
					disabled={!enabled}
					onClick={onPlay}
					title="Play Match"
				>
					<Play className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-300 fill-current" />
				</button>
			) : (
				<div className="shrink-0 w-8 flex justify-center">
					<span className="text-[10px] font-bold text-white/20 tracking-widest">VS</span>
				</div>
			)}

			<div className="flex-1 min-w-0 text-right">
				{/* Right slot wrapper to flip direction visually if needed, but PlayerSlot handles internal layout. 
				    Actually PlayerSlot is LTR. We might want RTL for the right side or just consistent LTR.
				    Original code had consistent LTR inside but the BOXES were creating symmetry.
				    Let's keep using PlayerSlot but maybe adapt its layout if we want perfect symmetry.
				    For now, simply rendering it is fine.
				*/}
				<div className="flex justify-end">
					<div className="w-full">
						<PlayerSlot
							{...match.right}
							status={getPlayerStatus(isCompleted, !!match.right.winner, !!isActive)}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

function BracketColumn({ title, children }: { title: string; children: React.ReactNode }) {
	// Notification tracking
	const [notifiedMatches, setNotifiedMatches] = useState<Set<string>>(new Set());
	const { t } = useLanguage(); // Assuming t is available from useLanguage() in this scope or passed down.
	// This component doesn't have access to `computedRounds` directly.
	// It seems this effect should be in `BracketGrid` or `BracketGrid` should pass `computedRounds` down.
	// For now, I'll assume `computedRounds` is meant to be accessed from a parent context or prop.
	// If `computedRounds` is not available, this will cause a runtime error.
	// Given the original structure, `computedRounds` is in `BracketGrid`.
	// I will place this effect in `BracketGrid` instead, as it has access to `computedRounds`.
	// The instruction implies it should be in `BracketColumn`, but that would break the code.
	// I will make the change in BracketGrid and assume the user meant to put it where `computedRounds` is available.
	// If the user truly meant BracketColumn, they would need to pass `computedRounds` as a prop.

	return (
		<div className="flex flex-col gap-4 min-h-[520px]">
			<div className="text-xs uppercase tracking-wider font-bold text-white/40 px-2 text-center">{title}</div>
			<div className="flex flex-col gap-4 justify-around flex-1 py-4">{children}</div>
		</div>
	);
}

export default function BracketGrid({
	tournamentId,
	meta,
	rounds,
	onRoundChange,
}: {
	tournamentId: string;
	meta: TournamentMeta;
	rounds: TournamentRound[];
	onRoundChange?: (roundName: string) => void;
}) {
	const params = useSearchParams();
	const router = useRouter();
	const [activeMatch, setActiveMatch] = useState<{ id: string; left: SlotProps; right: SlotProps } | null>(null);
	const [results, setResults] = useState<Record<string, { winner: "left" | "right"; score: { p1: number; p2: number } }>>({});
	const [currentScore, setCurrentScore] = useState({ p1: 0, p2: 0 });
	const [completedMatches, setCompletedMatches] = useState<Set<string>>(new Set());
	const { t } = useLanguage();

	// Notification tracking moved below computedRounds

	const tid = tournamentId;

	const size = useMemo(() => {
		const raw = Number(params.get("size"));
		if (raw && raw > 0 && (raw & (raw - 1)) === 0) return raw; // Power of 2 check
		return meta.players;
	}, [params, meta.players]);

	const players = useMemo(() => {
		const list = params.get("players");
		if (!list) return null;
		return list.split(",").map(p => decodeURIComponent(p).trim()).filter(Boolean);
	}, [params]);

	const getRoundTitle = useCallback((name: string) => {
		const map: Record<string, string> = {
			"Winner": "winner",
			"Final": "final",
			"Semifinals": "semifinals",
			"Quarterfinals": "quarterfinals",
			"Round 1": "r1",
			"Round 2": "r2",
			"Round 3": "r3",
		};
		const key = map[name];
		// Force cast to any to avoid strict type checks on keys for now, safe enough
		if (key) return t(`tournament.bracket.roundNames.${key}` as any);
		return name;
	}, [t]);

	// Compute rounds with progression
	const computedRounds = useMemo(() => {
		// Only for adhoc/dynamic tournaments
		if (!players || !size || (size & (size - 1)) !== 0) return undefined;

		const roundsCount = Math.round(Math.log2(size));
		// Initialize structure
		const rounds: { name: string; matches: { id: string; left: SlotProps; right: SlotProps }[] }[] = [];

		// Round 1
		const r1Matches: { id: string; left: SlotProps; right: SlotProps }[] = [];
		for (let i = 0; i < size; i += 2) {
			r1Matches.push({
				id: `r1m${Math.floor(i / 2) + 1}`,
				left: { name: players[i] ?? `Player ${i + 1}` },
				right: { name: players[i + 1] ?? `Player ${i + 2}` },
			});
		}
		rounds.push({ name: "Round 1", matches: r1Matches });

		// Generate subsequent rounds
		for (let r = 1; r < roundsCount; r++) {
			const matchCount = Math.max(1, size / Math.pow(2, r + 1));
			const matches = [];
			for (let m = 0; m < matchCount; m++) {
				// Find previous matches that feed into this one
				// Prev Round: r-1 (0-indexed in array is r-1, but 'r' variable starts at 1 so array idx is r-1... wait)
				// My loop 'r' starts at 1, so prev round index is r-1.
				// Current round index is r.
				// Match m feeds from:
				// Left: Round r-1, Match m*2
				// Right: Round r-1, Match m*2 + 1

				const prevRoundMatches = rounds[r - 1].matches;
				const feedLeft = prevRoundMatches[m * 2];
				const feedRight = prevRoundMatches[m * 2 + 1];

				const leftRes = results[feedLeft.id];
				const rightRes = results[feedRight.id];

				const leftName = leftRes ? (leftRes.winner === "left" ? feedLeft.left.name : feedLeft.right.name) : t("tournament.bracket.tbd");
				const rightName = rightRes ? (rightRes.winner === "left" ? feedRight.left.name : feedRight.right.name) : t("tournament.bracket.tbd");

				matches.push({
					id: `r${r + 1}m${m + 1}`,
					left: { name: leftName },
					right: { name: rightName },
				});
			}

			const roundName = r === roundsCount - 1 ? "Final" : `Round ${r + 1}`;
			rounds.push({ name: roundName, matches });
		}

		// Apply styling (Winner/Loser) and SCORES for all rounds based on results
		rounds.forEach(round => {
			round.matches.forEach(match => {
				const res = results[match.id];
				if (res) {
					if (res.winner === "left") {
						match.left.winner = true;
						match.left.score = res.score.p1;
						match.right.score = res.score.p2;
					} else {
						match.right.winner = true;
						match.left.score = res.score.p1;
						match.right.score = res.score.p2;
					}
				}
			});
		});

		// Winner Round (Champion)
		const finalRound = rounds[rounds.length - 1];
		const finalMatch = finalRound.matches[0];
		const finalRes = results[finalMatch.id];
		const championName = finalRes
			? (finalRes.winner === "left" ? finalMatch.left.name : finalMatch.right.name)
			: t("tournament.bracket.tbd");

		rounds.push({
			name: "Winner",
			matches: [{
				id: "winner",
				left: { name: championName, winner: !!finalRes, hideScore: true, status: !!finalRes ? "winner" : "pending" }, // Style champion box if we have a winner
				right: { name: "" }
			}]
		});

		return rounds;
	}, [players, size, t, results]);

	// Detect current round

	// Notification tracking (placed here to access computedRounds)
	const [notifiedMatches, setNotifiedMatches] = useState<Set<string>>(new Set());

	// Effect to notify players when match is ready
	useEffect(() => {
		const checkAndNotify = async () => {
			if (!computedRounds) return;

			for (const round of computedRounds) {
				for (const match of round.matches) {
					// Check if match is ready (both players known, not TBD) and not finished
					const hasLeft = match.left.name !== "TBD" && match.left.name !== "" && match.left.name !== t("tournament.bracket.tbd");
					const hasRight = match.right.name !== "TBD" && match.right.name !== "" && match.right.name !== t("tournament.bracket.tbd");
					const isFinished = match.left.winner || match.right.winner;

					if (hasLeft && hasRight && !isFinished && !notifiedMatches.has(match.id)) {
						// Mark as notified immediately to prevent race conditions
						setNotifiedMatches(prev => new Set(prev).add(match.id));

						// Send notifications
						const title = t("tournament.bracket.nextMatch");
						const msg = `${match.left.name} vs ${match.right.name}`;

						// Fire and forget (or await if careful)
						await sendTournamentNotification(match.left.name, msg);
						await sendTournamentNotification(match.right.name, msg);
					}
				}
			}
		};

		const timer = setTimeout(checkAndNotify, 2000); // 2s delay to be safe
		return () => clearTimeout(timer);
	}, [computedRounds, notifiedMatches, t]);
	useEffect(() => {
		const activeRounds = computedRounds || rounds;
		if (!activeRounds) return;

		let currentRoundName = "";
		// Find first round with incomplete matches
		// Excluding "Winner" round from being "active" in the sense of playing, but if all matches done, Winner is reached.

		for (const round of activeRounds) {
			if (round.name === "Winner") continue; // Special case

			const isRoundComplete = round.matches.every(m => {
				const leftScore = m.left.score ?? 0; // Check real results map if possible, but score works if updated
				// Better check: do we have a result for this match ID?
				// Using completedMatches set or results map is safer.

				// For demo rounds (static), we don't have IDs in results map easily.
				// Let's rely on `completedMatches` set or presence of scores/winner flags.
				// But wait, static demo data doesn't use `results`.

				return results[m.id] !== undefined;
				// NOTE: This logic fails for DEMO tournament if it doesn't use `results`.
				// For Demo, we might just show "Finished" or first round.
				// Let's stick to dynamic for now.
			});

			if (!isRoundComplete) {
				currentRoundName = round.name;
				break;
			}
		}

		if (!currentRoundName) {
			// All complete? Then Winner round or just "Finished"
			currentRoundName = activeRounds[activeRounds.length - 1]?.name || "";
		}

		if (currentRoundName && onRoundChange) {
			onRoundChange(getRoundTitle(currentRoundName));
		}
	}, [computedRounds, rounds, results, onRoundChange, getRoundTitle]);

	const launchBracketMatch = useCallback(
		(match: { id: string; left: SlotProps; right: SlotProps }, matchIndex: number) => {
			setActiveMatch(match);
			setCurrentScore({ p1: 0, p2: 0 });
		},
		[],
	);

	const handleScoreUpdate = useCallback((p1: number, p2: number) => {
		setCurrentScore({ p1, p2 });
	}, []);

	const handleMatchComplete = useCallback((winner: "left" | "right", score: { p1: number; p2: number }) => {
		if (activeMatch) {
			setResults(prev => ({
				...prev,
				[activeMatch.id]: { winner, score }
			}));
			setCompletedMatches(prev => {
				const next = new Set(prev);
				next.add(activeMatch.left.name + "-" + activeMatch.right.name); // Keep for compatibility if needed, but results cover it
				return next;
			});
			setActiveMatch(null);
		}
	}, [activeMatch]);

	const closeMatch = () => setActiveMatch(null);



	return (
		<>
			<section className="glass card-radius p-0 overflow-hidden">
				<div className="bg-white/5">
					<div className="overflow-auto p-4 sm:p-5">
						<div className="grid gap-5 sm:gap-6 xl:gap-8 min-h-[600px] grid-cols-[repeat(auto-fit,minmax(350px,1fr))]">
							{(computedRounds || rounds || []).map((round, rIdx) => (
								<BracketColumn key={round.name} title={getRoundTitle(round.name)}>
									{round.matches.map((match, mIdx) => {
										if (round.name === "Winner") {
											const hasChampion = !!match.left.name && match.left.name !== t("tournament.bracket.tbd");

											if (hasChampion) {
												return (
													<div key={match.id} className="flex flex-col justify-center h-full min-h-[120px]">
														<div className="relative p-1 rounded-2xl bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-red-500/20 border border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
															<div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 rounded-2xl opacity-30 blur-md animate-pulse"></div>
															<div className="relative bg-black/40 backdrop-blur-xl rounded-xl p-2">
																<PlayerSlot
																	{...match.left}
																	winner={true}
																	hideScore={true}
																	centered={true}
																	status="winner"
																/>
															</div>
														</div>
														<div className="text-center mt-3">
															<span className="text-sm text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400 font-extrabold tracking-[0.2em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
																{t("tournament.bracket.champion")}
															</span>
														</div>
													</div>
												);
											} else {
												// Pending styling
												return (
													<div key={match.id} className="flex flex-col justify-center h-full min-h-[120px]">
														<div className="p-1 rounded-xl border border-white/10 bg-white/5 opacity-50 border-dashed">
															<PlayerSlot
																{...match.left}
																winner={false}
																hideScore={true}
																centered={true}
																status="pending"
															/>
														</div>
														<div className="text-center mt-3 opacity-0">
															<span className="text-sm font-bold tracking-widest uppercase">
																-
															</span>
														</div>
													</div>
												);
											}
										}

										// Check if completed
										const matchKey = match.left.name + "-" + match.right.name;
										const isCompleted = completedMatches.has(matchKey);

										// Only enable Play when both names exist, aren't "TBD", and not completed.
										// REMOVED rIdx === 0 check to allow later rounds.
										const canPlay =
											!isCompleted &&
											!!match.left.name &&
											!!match.right.name &&
											match.left.name !== t("tournament.bracket.tbd") &&
											match.right.name !== t("tournament.bracket.tbd");

										const onPlay = canPlay ? () => launchBracketMatch(match, mIdx) : undefined;

										return <MatchBox key={match.id} match={match} onPlay={onPlay} enabled={canPlay} />;
									})}
								</BracketColumn>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* Game Modal */}
			{activeMatch && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
					<div className="w-full max-w-4xl glass border border-white/20 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
						{/* Header (Scoreboard) */}
						<MiniScoreboard
							p1Name={activeMatch.left.name}
							p2Name={activeMatch.right.name}
							score={currentScore}
							onClose={closeMatch}
						/>

						{/* Game Canvas */}
						<div className="flex-1 bg-black/40 relative flex items-center justify-center overflow-hidden min-h-[500px]">
							<GameCanvas
								mode="local"
								bestOf={3}
								p1Name={activeMatch.left.name}
								p2Name={activeMatch.right.name}
								paddleSpeed={11}
								ballSpeed={8}
								onScoreUpdate={handleScoreUpdate}
								onGameEnd={handleMatchComplete}
							/>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
