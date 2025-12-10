"use client";
// import { mockLeaderboard } from "./data"; // REMOVED
import Avatar from "@/app/components/Avatar";
import { useLanguage } from "../../context/LanguageContext";
import { useEffect, useState } from "react";

import { Medal } from "lucide-react";

type RankingItem = {
	id: string | number;
	name: string;
	rank: number;
	score: number; // total_delta
	avatarUrl: string;
};

export default function RankingPanel() {
	const { t } = useLanguage();
	const [leaderboard, setLeaderboard] = useState<RankingItem[]>([]);

	useEffect(() => {
		const fetchLeaderboard = async () => {
			try {
				const res = await fetch("/api/gameState/leaderboard?limit=100");
				const data = await res.json();
				if (data.success && Array.isArray(data.result)) {
					const mapped = data.result.map((u: any, i: number) => ({
						id: u.id,
						name: u.nickname,
						rank: i + 1,
						score: u.total_delta,
						avatarUrl: u.avatar || "",
					}));
					setLeaderboard(mapped);
				}
			} catch (err) {
				console.error("Failed to fetch leaderboard", err);
			}
		};
		fetchLeaderboard();
	}, []);

	const [first, second, third, ...rest] = leaderboard;

	return (
		<div className="glass p-6 rounded-2xl h-full overflow-hidden flex flex-col text-[0.95rem] min-[1600px]:text-base min-[2000px]:text-lg">
			{/* Header */}
			<header className="flex items-center justify-between gap-3 min-w-0 mb-4">
				<div className="flex items-center gap-2 min-w-0">
					<div className="w-9 h-9 rounded-full bg-white/20 border border-white/30 grid place-items-center shrink-0">
						<Medal className="w-5 h-5 text-white/90" aria-hidden="true" />
					</div>
					<h2 className="text-2xl min-[1600px]:text-3xl font-semibold truncate">{t("dashboard.playersRanking")}</h2>
				</div>
				<div className="shrink-0 bg-white/20 border border-white/30 rounded-full px-3 py-1">
					<span className="text-xs min-[1600px]:text-sm font-medium text-white/90">
						{t("dashboard.seasonLeaderboard")}
					</span>
				</div>
			</header>

			{/* Top 3 Podium (made more compact so it doesn't push the list too far down) */}
			<div className="relative h-24 pt-2 min-[1600px]:h-28">
				<div className="absolute inset-x-0 -top-2 flex items-end justify-around gap-4">
					{/* 2nd */}
					<div className="flex flex-col items-center gap-0.5">
						<div className="w-12 h-12 min-[1600px]:w-14 min-[1600px]:h-14 rounded-full bg-white/50 border border-white/30 overflow-hidden">
							{second && (
								<Avatar
									src={second.avatarUrl}
									alt={`${second.name} avatar`}
									className="w-full h-full object-cover object-[center_top]"
									size={24}
								/>
							)}
						</div>
						<span className="text-[10px] min-[1600px]:text-xs uppercase tracking-wide text-white/80">
							2ND
						</span>
						<span className="block w-20 text-center truncate" title={second?.name ?? "2nd place"}>
							{second?.name ?? "-"}
						</span>
					</div>

					{/* 1st */}
					<div className="flex flex-col items-center gap-0.5">
						<div className="relative">
							<div className="w-16 h-16 min-[1600px]:w-18 min-[1600px]:h-18 rounded-full bg-white/60 border border-white/40 overflow-hidden ring-2 ring-yellow-300/60">
								{first && (
									<Avatar
										src={first.avatarUrl}
										alt={`${first.name} avatar`}
										className="w-full h-full object-cover object-[center_top]"
										size={32}
									/>
								)}
							</div>
							<svg
								className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 text-yellow-300 drop-shadow"
								viewBox="0 0 24 24"
								fill="currentColor"
								aria-hidden="true"
							>
								<path d="M3 7l4 3 5-6 5 6 4-3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7zM6 18h12v-2H6v2z" />
							</svg>
						</div>
						<span className="text-[10px] min-[1600px]:text-xs uppercase tracking-wide text-white/90">
							1ST
						</span>
						<span className="block w-24 text-center truncate" title={first?.name ?? "1st place"}>
							{first?.name ?? "-"}
						</span>
					</div>

					{/* 3rd */}
					<div className="flex flex-col items-center gap-0.5">
						<div className="w-12 h-12 min-[1600px]:w-14 min-[1600px]:h-14 rounded-full bg-white/50 border border-white/30 overflow-hidden">
							{third && (
								<Avatar
									src={third.avatarUrl}
									alt={`${third.name} avatar`}
									className="w-full h-full object-cover object-[center_top]"
									size={24}
								/>
							)}
						</div>
						<span className="text-[10px] min-[1600px]:text-xs uppercase tracking-wide text-white/80">
							3RD
						</span>
						<span className="block w-20 text-center truncate" title={third?.name ?? "3rd place"}>
							{third?.name ?? "-"}
						</span>
					</div>
				</div>
			</div>



			{/* Leaderboard */}
			<div className="mt-3 flex-1 min-h-0 overflow-y-auto overflow-x-hidden scroll-area">
				<div className="bg-white/15 rounded-2xl p-2 min-h-full">
					{/* Header row */}
					<div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 rounded-lg bg-white/90 text-[11px] min-[1600px]:text-sm font-semibold text-slate-700 mb-2">
						<div className="flex items-center gap-3">
							<span className="w-8 min-[1600px]:w-10 text-center">{t("dashboard.rank")}</span>
							<span className="w-10 min-[1600px]:w-12 text-center">{t("dashboard.avatar")}</span>
							<span className="text-left">{t("dashboard.name")}</span>
						</div>
						<div className="text-center">{t("dashboard.score")}</div>
					</div>

					{/* Rows */}
					<div className="space-y-2">
						{rest.map((entry) => (
							<div
								key={entry.id}
								className="flex items-center justify-between px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
							>
								<div className="flex items-center gap-3 min-w-0">
									<span className="w-8 min-[1600px]:w-10 text-center text-sm min-[1600px]:text-base">{entry.rank}</span>
									<div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
										<Avatar
											className="w-full h-full object-cover"
											src={entry.avatarUrl}
											alt={`${entry.name} avatar`}
											size={16}
										/>
									</div>
									<span className="truncate text-sm min-[1600px]:text-base" title={entry.name}>
										{entry.name}
									</span>
								</div>
								<div className="text-sm min-[1600px]:text-base font-semibold text-right">{entry.score}</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
