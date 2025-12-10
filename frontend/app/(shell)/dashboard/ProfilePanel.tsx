"use client";
import { useEffect, useRef, useState } from "react";
import { Chart, ChartData, ChartOptions } from "chart.js/auto";
import { UserProfile } from "./data";
import Link from "next/link";
import { Pencil } from "lucide-react";
import Avatar from "@/app/components/Avatar";
import { getUserMatches, MatchData } from "@/app/lib/matches.client";
import { useAuth } from "@/app/context/AuthContext";
import { useLanguage } from "@/app/context/LanguageContext";

// Helper type for basic game stats
type GameStats = {
	games: number;
	wins: number;
	losses: number;
};

// Helper utility to derive radar values from basic stats
function getRadarValues(stats: GameStats) {
	const safeWinRate = stats.games > 0 ? stats.wins / stats.games : 0;

	return {
		// 1. Attack: Win Rate
		attack: Math.min(98, 40 + (safeWinRate * 55)),

		// 2. Defense: Inverse Loss Rate
		defense: Math.min(95, 50 + (safeWinRate * 45)),

		// 3. Speed: Experience (capped lower for single month)
		speed: Math.min(95, 45 + (Math.min(stats.games, 30) * 1.6)),

		// 4. Control: Win Count
		control: Math.min(98, 40 + (Math.min(stats.wins, 20) * 2.5)),

		// 5. Consistency: Win Rate + Volume
		consistency: Math.min(92, 40 + (safeWinRate * 40) + (Math.min(stats.games, 20) * 0.4)),
	};
}

const fallbackUserProfile: UserProfile = {
	nickname: "Guest",
	avatarUrl: "",
	games: 0,
	wins: 0,
	winRate: 0,
};

export default function ProfilePanel() {
	const { user, stats, loading } = useAuth();
	const { t } = useLanguage();
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const chartRef = useRef<Chart<"radar"> | null>(null);

	// State for MONTHLY stats
	const [currentMonthData, setCurrentMonthData] = useState<GameStats>({ games: 0, wins: 0, losses: 0 });
	const [prevMonthData, setPrevMonthData] = useState<GameStats>({ games: 0, wins: 0, losses: 0 });

	const games = stats?.total_games ?? 0;
	const wins = stats?.number_of_wins ?? 0;
	const winRate = games > 0 ? Math.round((wins / games) * 100) : 0;

	const displayUser = user ? {
		nickname: user.nickname,
		avatarUrl: user.avatar || "",
		games: games,
		wins: wins,
		winRate: winRate
	} : fallbackUserProfile;

	// Fetch matches and bucket them
	useEffect(() => {
		if (!user?.id) return;
		let active = true;

		async function fetchData() {
			try {
				// Fetch decent amount of history to cover 2 months
				const history = await getUserMatches(user!.id, 200);
				if (!active || !Array.isArray(history)) return;

				const now = new Date();
				const currentMonth = now.getMonth();
				const currentYear = now.getFullYear();

				// Previous month logic (handle Jan->Dec rollover)
				const prevDate = new Date();
				prevDate.setMonth(now.getMonth() - 1);
				const prevMonth = prevDate.getMonth();
				const prevYear = prevDate.getFullYear();

				const currStats = { games: 0, wins: 0, losses: 0 };
				const prevStats = { games: 0, wins: 0, losses: 0 };

				history.forEach((m: MatchData) => {
					if (!m.created_at) return;
					const d = new Date(m.created_at);
					const mMonth = d.getMonth();
					const mYear = d.getFullYear();

					const isWin = m.winner_id === user!.id;

					// Check Current Month
					if (mMonth === currentMonth && mYear === currentYear) {
						currStats.games++;
						if (isWin) currStats.wins++;
						else currStats.losses++;
					}
					// Check Previous Month
					else if (mMonth === prevMonth && mYear === prevYear) {
						prevStats.games++;
						if (isWin) prevStats.wins++;
						else prevStats.losses++;
					}
				});

				setCurrentMonthData(currStats);
				setPrevMonthData(prevStats);

			} catch (e) {
				console.error("Profile Radar: fetch failed", e);
			}
		}

		fetchData();
		return () => { active = false; };
	}, [user?.id]);

	const currentRadar = getRadarValues(currentMonthData);
	const prevRadar = getRadarValues(prevMonthData);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Destroy existing chart if it exists
		if (chartRef.current) {
			chartRef.current.destroy();
		}

		const data: ChartData<"radar"> = {
			labels: [t("dashboard.attack"), t("dashboard.defense"), t("dashboard.speed"), t("dashboard.control"), t("dashboard.consistency")],
			datasets: [
				{
					label: t("dashboard.currentMonth"),
					data: [
						currentRadar.attack,
						currentRadar.defense,
						currentRadar.speed,
						currentRadar.control,
						currentRadar.consistency,
					],
					fill: true,
					backgroundColor: "rgba(56, 189, 248, 0.22)",
					borderColor: "rgba(56, 189, 248, 0.9)",
					pointBackgroundColor: "rgba(56, 189, 248, 1)",
					pointBorderColor: "#ffffff",
					pointRadius: 3,
					borderWidth: 2,
				},
				{
					label: t("dashboard.prevMonth"),
					data: [
						prevRadar.attack,
						prevRadar.defense,
						prevRadar.speed,
						prevRadar.control,
						prevRadar.consistency
					],
					fill: true,
					backgroundColor: "rgba(244, 114, 182, 0.16)",
					borderColor: "rgba(244, 114, 182, 0.9)",
					pointBackgroundColor: "rgba(244, 114, 182, 1)",
					pointBorderColor: "#ffffff",
					pointRadius: 2.5,
					borderWidth: 1.5,
				},
			],
		};

		const options: ChartOptions<"radar"> = {
			responsive: true,
			maintainAspectRatio: false,
			animation: {
				duration: 900,
				easing: "easeOutQuart",
				delay: 120,
			},
			plugins: {
				legend: {
					display: true,
					labels: {
						color: "rgba(255,255,255,0.85)",
						boxWidth: 10,
						boxHeight: 10,
						font: {
							size: 11,
						},
					},
				},
				tooltip: {
					enabled: true,
					backgroundColor: "rgba(15, 23, 42, 0.92)",
					titleColor: "#e5e7eb",
					bodyColor: "#e5e7eb",
					borderColor: "rgba(148, 163, 184, 0.6)",
					borderWidth: 1,
				},
			},
			scales: {
				r: {
					angleLines: {
						color: "rgba(255,255,255,0.1)",
					},
					grid: {
						color: "rgba(255,255,255,0.12)",
					},
					pointLabels: {
						color: "rgba(255,255,255,0.85)",
						font: {
							size: 11,
						},
					},
					ticks: {
						display: false,
						// beginAtZero: true,
					},
				},
			},
		};

		const chart = new Chart(ctx, {
			type: "radar",
			data,
			options,
		});

		return () => {
			chart.destroy();
			chartRef.current = null;
		};
	}, [currentRadar.attack, currentRadar.defense, currentRadar.speed, currentRadar.control, currentRadar.consistency, prevRadar.attack, t]);

	return (

		<div className="glass p-5 rounded-2xl h-full overflow-visible flex flex-col min-h-0">
			<div className="flex flex-col sm:flex-row items-start gap-5">
				{/* Avatar (96×96) */}
				<div
					className="w-24 h-24 rounded-xl overflow-hidden border border-white/40 bg-white/10 group"
					id="avatarWrap"
				>
					<Avatar
						src={displayUser.avatarUrl}
						alt="User avatar"
						className="w-full h-full object-cover object-[center_top] transition-transform duration-500 ease-out group-hover:scale-110"
						size={48}
					/>
				</div>

				{/* Name + stats header */}
				<div className="flex-1 min-w-0">
					<div className="flex items-start gap-2 min-w-0">
						<h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-br from-white via-white to-white/50 bg-clip-text text-transparent truncate flex-1">
							{displayUser.nickname}
						</h2>
						<Link
							href="/profile?tab=settings"
							className="cursor-pointer shrink-0 w-7 h-7 grid place-items-center rounded-md bg-white/20 hover:bg-white/30 border border-white/30"
							aria-label="Edit profile"
						>
							<Pencil className="w-5 h-5" />
						</Link>
					</div>

					{/* Stats grid */}
					<div className="mt-3 grid grid-cols-3 gap-2">
						<div className="bg-white/10 rounded-lg p-1 text-center border border-white/10">
							<p className="text-[10px] uppercase tracking-wider text-white/60">{t("dashboard.games")}</p>
							<p className="text-lg font-bold leading-tight">{displayUser.games}</p>
						</div>
						<div className="bg-white/10 rounded-lg p-1 text-center border border-white/10">
							<p className="text-[10px] uppercase tracking-wider text-white/60">{t("dashboard.wins")}</p>
							<p className="text-lg font-bold leading-tight text-emerald-300">{displayUser.wins}</p>
						</div>
						<div className="bg-white/10 rounded-lg p-1 text-center border border-white/10">
							<p className="text-[10px] uppercase tracking-wider text-white/60">{t("dashboard.winRate")}</p>
							<p className="text-lg font-bold leading-tight text-purple-300">{displayUser.winRate}%</p>
						</div>
					</div>
				</div>
			</div>

			{/* Chart */}
			<div className="mt-4 flex-1 min-h-0 relative">
				<div className="absolute inset-0">
					<canvas ref={canvasRef} id="profileRadar" />
				</div>
				<div
					id="profileRadarEmpty"
					className="absolute inset-0 pointer-events-none place-items-center text-sm text-white/80 bg-black/20 backdrop-blur-sm hidden"
				>
					{t("dashboard.noSkillData")}
				</div>
			</div>
		</div>
	);
}
