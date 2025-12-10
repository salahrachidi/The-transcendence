"use client";

import { useEffect, useState } from "react";
import { mapMatchError } from "@/app/lib/matches";
import { getUserMatches, type MatchData } from "@/app/lib/matches.client";
import { resolveMatchTags } from "../data";
import Link from "next/link";
import { Activity, Clock3, Sparkles, Trophy } from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";
import { useAuth } from "@/app/context/AuthContext";
import { getUserProfile } from "@/app/lib/users";

export type MatchHistoryItem = {
	id: string;
	opponent: string;
	result: "WIN" | "LOSS";
	score: string;
	mode: string;
	time: string;
	length: string;
	arena: string;
	delta: number;
	durationSec: number;
};

export default function MatchHistoryClient({ error }: { error?: string }) {
	const { t } = useLanguage();
	const { user } = useAuth();
	const [matchHistory, setMatchHistory] = useState<MatchHistoryItem[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function fetchHistory() {
			if (!user?.id) return;
			try {
				setLoading(true);
				const data = await getUserMatches(user.id, 50); // Fetch last 50 matches

				const mapped = await Promise.all(data.map(async (m: MatchData) => {
					const isP1 = m.player1_id === user.id;
					const opponentId = isP1 ? m.player2_id : m.player1_id;
					const profile = await getUserProfile(opponentId);

					const opponentName = profile?.nickname || `User ${opponentId}`;
					const result = m.winner_id === user.id ? "WIN" : "LOSS";
					const scoreSelf = isP1 ? m.player1_score : m.player2_score;
					const scoreOpp = isP1 ? m.player2_score : m.player1_score;
					const scoreStr = `${scoreSelf}-${scoreOpp}`;

					// Duration calc
					const start = new Date(m.created_at!);
					const end = new Date(m.finished_at!);
					const durationSec = Math.max(0, (end.getTime() - start.getTime()) / 1000);
					const durationMin = Math.round(durationSec / 60);

					// Date format logic
					const now = new Date();
					const diffMs = now.getTime() - end.getTime();
					const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
					let timeStr = "";
					if (diffDays === 0) {
						timeStr = `Today ${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
					} else if (diffDays === 1) {
						timeStr = `Yesterday ${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
					} else {
						timeStr = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + " " +
							end.getHours().toString().padStart(2, '0') + ":" + end.getMinutes().toString().padStart(2, '0');
					}

					// Calculate signed delta for correct display
					// Assuming m.delta is positive value of change.
					// If WIN -> +delta, If LOSS -> -delta.
					// Note: Backend might send 10 even for loss.
					// We clamp total score at 0 in backend, but match delta is fixed 10 or whatever.
					// We apply sign here for display.
					const absDelta = Math.abs(m.delta || 0);
					const signedDelta = result === "WIN" ? absDelta : -absDelta;

					const item: MatchHistoryItem = {
						id: `m-${m.created_at}-${m.id}`,
						opponent: opponentName,
						result,
						score: scoreStr,
						mode: "Remote", // Requested explicitly
						time: timeStr,
						length: `${durationMin}m`,
						arena: "Standard Arena", // Placeholder
						delta: signedDelta,
						durationSec
					};
					return item;
				}));

				setMatchHistory(mapped);
			} catch (e) {
				console.error("Failed to fetch match history", e);
			} finally {
				setLoading(false);
			}
		}

		fetchHistory();
	}, [user]);

	const wins = matchHistory.filter(m => m.result === "WIN").length;
	const losses = matchHistory.filter(m => m.result === "LOSS").length;
	const winRate = matchHistory.length ? Math.round((wins / matchHistory.length) * 100) : 0;
	const hasMatches = matchHistory.length > 0;

	// Calculate Max Win Streak
	let currentStreak = 0;
	let maxStreak = 0;
	// Existing logic assumed Newest->Oldest array? 
	// getUserMatches returns "ORDER BY finished_at DESC" (Newest first).
	// To calc streak correctly over time, we need Oldest -> Newest.
	// So iterate from length-1 down to 0.
	for (let i = matchHistory.length - 1; i >= 0; i--) {
		if (matchHistory[i].result === "WIN") {
			currentStreak++;
			maxStreak = Math.max(maxStreak, currentStreak);
		} else {
			currentStreak = 0;
		}
	}

	// Translate error message if it exists
	const rawErrorMessage = mapMatchError(error);
	const errorMessage = rawErrorMessage
		? (error === "no-match" ? t("game.errors.noMatch") : t("game.errors.generic"))
		: null;

	// Helper to translate tags
	const getTranslatedTag = (tag: string) => {
		// @ts-ignore
		return t(`game.tags.${tag}`) || tag;
	};

	return (
		<>
			<div className="grid grid-cols-12 sm:gap-4 md:gap-5 lg:gap-6 2xl:gap-8 min-w-0">
				<section className="col-span-12 xl:col-span-5 space-y-4">
					<div className="glass rounded-2xl p-6 h-full relative overflow-hidden">
						<div className="absolute inset-0 bg-linear-to-br from-fuchsia-500/15 via-sky-400/10 to-emerald-400/10" />
						<div className="absolute -left-10 top-6 h-32 w-64 rotate-6 bg-linear-to-r from-white/10 via-white/0 to-white/0 blur-3xl" />
						<div className="relative max-h-[calc(100vh-180px)] overflow-y-auto pr-1">
							<p className="text-xs uppercase tracking-[0.2em] text-white/60">{t("game.history.archive")}</p>
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
								<h1 className="text-3xl font-extrabold">{t("game.history.title")}</h1>
								<Link href="/dashboard" className="chat-pill-secondary px-3 py-1.5 text-xs whitespace-nowrap">
									{t("game.history.startMatch")}
								</Link>
								{/*<Link href="/game/demo-match" className="chat-pill-secondary px-3 py-1.5 text-xs whitespace-nowrap">
									Watch Demo Match
								</Link>*/}
							</div>
							<p className="text-sm text-white/70 mt-3">
								{t("game.history.description")}
							</p>

							<div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
								<div className="rounded-xl border border-white/20 bg-white/10 p-3">
									<div className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/60">
										<Sparkles className="h-4 w-4" aria-hidden="true" />
										{t("game.history.winRate")}
									</div>
									<p className="text-2xl font-semibold mt-2">{winRate}%</p>
									<p className="text-xs text-white/60">{t("game.history.wins")}: {wins} | {t("game.history.losses")}: {losses}</p>
								</div>
								<div className="rounded-xl border border-white/20 bg-white/10 p-3">
									<div className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/60">
										<Trophy className="h-4 w-4" aria-hidden="true" />
										{t("game.history.recentStreak")}
									</div>
									<p className="text-2xl font-semibold mt-2">{currentStreak} {t("game.history.winsSuffix")}</p>
									<p className="text-xs text-white/60">{t("game.history.builtAcross")}</p>
								</div>
								<div className="rounded-xl border border-white/20 bg-white/10 p-3">
									<div className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/60">
										<Activity className="h-4 w-4" aria-hidden="true" />
										{t("game.history.bestStreak")}
									</div>
									<p className="text-2xl font-semibold mt-2">{maxStreak} {t("game.history.winsSuffix")}</p>
									<p className="text-xs text-white/60">{t("game.history.consecutive")}</p>
								</div>
							</div>
						</div>
					</div>
				</section>

				<section className="col-span-12 xl:col-span-7">
					<div className="glass rounded-2xl p-5 md:p-6 relative overflow-hidden">
						<div className="absolute inset-0 bg-linear-to-br from-white/5 via-fuchsia-500/5 to-transparent" />
						<div className="absolute inset-y-0 right-0 w-24 bg-linear-to-l from-fuchsia-500/10 via-transparent to-transparent blur-3xl" />
						<div className="relative max-h-[calc(100vh-180px)] overflow-y-auto pr-1">
							<div className="flex items-center justify-between gap-3 ">
								<div>
									<p className="text-xs uppercase tracking-[0.2em] text-white/60">{t("game.history.historyTitle")}</p>
									<h2 className="text-xl font-semibold">{t("game.history.matchesTitle")}</h2>
								</div>
								<span className="chip px-3 py-1.5 text-xs">{t("game.history.timeline")}</span>
							</div>

							{errorMessage && (
								<div className="mt-4 rounded-2xl border border-rose-400/50 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
									{errorMessage}
								</div>
							)}

							{loading ? (
								<div className="mt-5 text-center text-white/50 text-sm">Loading...</div>
							) : !hasMatches ? (
								<div className="mt-5 rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-center text-sm text-white/70">
									{t("game.history.noMatches")}
								</div>
							) : (
								<div className="mt-4 relative">
									<div className="absolute left-3 top-0 bottom-0 w-px bg-linear-to-b from-fuchsia-400/80 via-cyan-300/80 to-transparent" />
									<div className="space-y-3">
										{matchHistory.map((match, idx) => {
											const badgeClasses =
												match.result === "WIN"
													? "bg-emerald-500/10 border border-emerald-400/40 text-emerald-200"
													: "bg-rose-500/10 border border-rose-400/40 text-rose-200";
											const deltaText = `${match.delta > 0 ? "+" : ""}${match.delta}`;
											const tags = resolveMatchTags(match, idx);

											// Translate mode
											// match.mode is forced to "Remote" in logic above, 
											// but let's key it properly if we want translation
											const modeKey = "remote"; // since we hardcoded "Remote"
											const translatedMode = match.mode; // Just use the string "Remote" or t(...) if available

											// Translate result
											const translatedResult = t(`game.results.${match.result}`) || match.result;

											return (
												<article key={match.id} className="relative pl-8">
													<div className="absolute left-1.5 top-6 h-3 w-3 rounded-full bg-linear-to-r from-fuchsia-400 via-cyan-300 to-emerald-300 shadow-[0_0_0_4px_rgba(255,255,255,0.08)]" />
													<div className="glass rounded-2xl p-4 md:p-5 border border-white/15 bg-white/5 relative overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:bg-white/10 hover:shadow-lg hover:shadow-purple-500/10 cursor-default">
														<div className="absolute inset-0 bg-linear-to-r from-white/5 via-transparent to-transparent pointer-events-none" />
														<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
															<div>
																<p className="text-xs uppercase tracking-wide text-white/60">{translatedMode}</p>
																<h3 className="text-lg font-semibold leading-tight">{match.opponent}</h3>
																{/* Map placeholder: {match.arena} */}
															</div>
															<span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${badgeClasses}`}>
																{translatedResult} | {match.score}
															</span>
														</div>

														<div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-white/80">
															<div className="flex items-center gap-2">
																<Trophy className="h-4 w-4 text-white/70" aria-hidden="true" />
																<span>{match.score}</span>
															</div>
															<div className="flex items-center gap-2">
																<Clock3 className="h-4 w-4 text-white/70" aria-hidden="true" />
																<span>{match.time} | {match.length}</span>
															</div>
															<div className="flex items-center gap-2">
																<Activity className="h-4 w-4 text-white/70" aria-hidden="true" />
																<span>{deltaText} {t("game.history.rating")}</span>
															</div>
														</div>

														{/* Remarks (kept for future dynamic data) */}

														<div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-white/70">
															{tags.map(tag => (
																<span key={tag} className="rounded-full border border-white/20 bg-white/10 px-3 py-1">
																	{getTranslatedTag(tag)}
																</span>
															))}
														</div>
													</div>
												</article>
											);
										})}
									</div>
								</div>
							)}
						</div>
					</div>
				</section>
			</div>
		</>
	);
}
