"use client";
import { useEffect, useState } from "react";
import { History } from "lucide-react";
import Avatar from "@/app/components/Avatar";
import { useAuth } from "@/app/context/AuthContext";
import { getUserMatches, MatchData } from "@/app/lib/matches.client";
import { getUserProfile } from "@/app/lib/users";


import { useLanguage } from "../../context/LanguageContext";

export default function MatchesPanel({ className = "", userId }: { className?: string; userId?: number }) {
	// const { t } = useLanguage();
	const { t } = useLanguage();
	const { user } = useAuth();

	// Use provided userId or fallback to authenticated user's ID
	const targetUserId = userId ?? user?.id;

	const [matches, setMatches] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let isMounted = true;

		async function fetchMatches() {
			if (!targetUserId) return;
			try {
				setLoading(true);
				const data = await getUserMatches(targetUserId, 20); // Limit 20

				// Resolve opponent names
				const enriched = await Promise.all(data.map(async (m: MatchData) => {
					const isP1 = m.player1_id === targetUserId;
					const opponentId = isP1 ? m.player2_id : m.player1_id;

					// Fetch opponent profile
					const profile = await getUserProfile(opponentId);

					// Calculate derived fields
					const result = m.winner_id === targetUserId ? "WIN" : "LOSS";
					const scoreSelf = isP1 ? m.player1_score : m.player2_score;
					const scoreOpponent = isP1 ? m.player2_score : m.player1_score;
					const delta = m.delta ? (result === "WIN" ? +Math.abs(m.delta) : -Math.abs(m.delta)) : 0; // Backend gives score diff, we need rating delta? 
					// Actually docs say: "Winner gets: ... total_delta +10". 
					// But match table has `delta`. Let's assume match.delta is valid.
					// If match.delta is "score difference * 10", it might not be the rating change. 
					// Let's stick to a simple +10/-10 for now if delta isn't the rating change, 
					// OR trust the backend `delta` field. 
					// Docs: "Delta (score difference × 10)". 
					// Docs: "Winner gets ... total_delta +10". These contradict slightly or usage differs.
					// Let's display the `delta` from the match record for now.

					//console.log(profile);	DEBUG
					return {
						id: m.created_at + "_" + m.player1_id, // fallback ID
						...m,
						opponent: profile?.nickname || `User ${opponentId}`,
						avatarUrl: profile?.avatar || "/default_avatar.png",
						result,
						scoreSelf,
						scoreOpponent,
						delta: delta
					};
				}));

				if (isMounted) setMatches(enriched);
			} catch (err) {
				console.error("Failed to load matches", err);
			} finally {
				if (isMounted) setLoading(false);
			}
		}

		fetchMatches();

		return () => { isMounted = false; };
	}, [user]);

	return (
		<div className={`glass p-6 rounded-2xl h-full flex flex-col text-[0.95rem] min-[1600px]:text-base ${className}`}>
			{/* Header */}
			<header className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-2 min-w-0">
					<div className="w-9 h-9 rounded-full bg-white/20 border border-white/30 grid place-items-center">
						<History className="w-5 h-5" aria-hidden="true" />
					</div>
					<h2 className="text-xl min-[1600px]:text-2xl font-semibold truncate">{t("dashboard.matchesHistory")}</h2>
				</div>
				<span className="px-3 py-1.5 rounded-full text-xs min-[1600px]:text-sm bg-white/15 border border-white/20 text-white/70">
					{loading ? "..." : t("dashboard.recentResults")}
				</span>
			</header>

			{/* Matches list (flex-based, to control radius like the design) */}
			<div className="mt-4 flex-1 min-h-0">
				<div className="bg-white/15 rounded-2xl p-2 h-full">
					<div className="min-w-0 h-full overflow-y-auto pr-1">
						<div className="sticky top-0 z-10 flex items-center text-xs min-[1600px]:text-sm uppercase tracking-wide px-3 md:px-4 py-2 bg-white/90 text-slate-700 rounded-lg">
							<div className="flex-1 pl-1">{t("dashboard.opponent")}</div>
							<div className="w-20 text-center">{t("dashboard.result")}</div>
							<div className="w-20 text-center">{t("dashboard.score")}</div>
							<div className="w-16 text-right">{t("dashboard.delta")}</div>
						</div>

						<div className="mt-2 space-y-1.5 pb-1">
							{loading && (
								<div className="p-4 text-center text-white/50 text-sm">
									Loading...
								</div>
							)}

							{!loading && matches.length === 0 && (
								<div className="p-4 text-center text-white/50 text-sm">
									No matches found.
								</div>
							)}

							{matches.map(match => {
								const resultColor =
									match.result === "WIN" ? "text-emerald-400" : "text-rose-400";
								const deltaPrefix = match.delta > 0 ? "+" : "";

								return (
									<div
										key={match.id}
										className=" hover:bg-white/20 transition-colors flex items-center justify-between px-3 md:px-4 py-2 rounded-xl bg-white/10 border border-white/15"
									>
										<div className="flex items-center gap-3 flex-1 min-w-0">
											<div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/30 bg-white/20 shrink-0">
												<Avatar
													src={match.avatarUrl}
													alt={`${match.opponent} avatar`}
													className="w-full h-full object-cover object-[center_top]"
													size={20}
												/>
											</div>
											<div className="min-w-0">
												<div className="text-sm min-[1600px]:text-base font-medium truncate">
													{match.opponent}
												</div>
											</div>
										</div>
										<div className={`w-20 text-center text-xs min-[1600px]:text-sm font-semibold ${resultColor}`}>
											{match.result}
										</div>
										<div className="w-20 text-center text-xs min-[1600px]:text-sm">
											{match.scoreSelf}-{match.scoreOpponent}
										</div>
										<div className="w-16 text-right text-xs min-[1600px]:text-sm">
											{deltaPrefix}
											{match.delta}
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}




