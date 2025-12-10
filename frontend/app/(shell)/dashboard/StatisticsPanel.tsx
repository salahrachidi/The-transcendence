"use client";

import { useEffect, useRef, useState } from "react";
import { Chart, ChartData, ChartOptions } from "chart.js/auto";
import { StatsRangeKey } from "./data";
import { Activity } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { UserGaming } from "../../lib/auth/fetchMyData";
import { getUserMatches, MatchData } from "@/app/lib/matches.client";

export default function StatisticsPanel({ className = "", stats }: { className?: string; stats?: UserGaming | null }) {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const chartRef = useRef<Chart<"line"> | null>(null);
	const [range, setRange] = useState<StatsRangeKey>("7");
	const { t } = useLanguage();
	const { user, stats: authStats } = useAuth();

	// Hold the chart data in state
	const [chartData, setChartData] = useState<{ labels: string[], wins: number[], losses: number[] } | null>(null);

	const displayStats = stats || authStats;

	// Helper to process raw match history into daily buckets
	const processMatchHistory = (matches: MatchData[], days: number, currentUserId: number) => {
		const result = {
			labels: [] as string[],
			wins: [] as number[],
			losses: [] as number[]
		};

		const now = new Date();
		// Create buckets for the last 'days' (including today)
		for (let i = days - 1; i >= 0; i--) {
			const d = new Date();
			d.setDate(now.getDate() - i);
			const dateStr = d.toLocaleDateString("en-US", { weekday: 'short', day: 'numeric' }); // e.g. "Mon 8" or just "Mon" depending on locale preference
			// simpler label for small charts:
			const label = d.toLocaleDateString("en-US", { weekday: 'short' });

			// Start/End of this specific day
			const startOfDay = new Date(d.setHours(0, 0, 0, 0)).getTime();
			const endOfDay = new Date(d.setHours(23, 59, 59, 999)).getTime();

			// Filter matches for this day
			const dayMatches = matches.filter(m => {
				const playedAt = m.created_at ? new Date(m.created_at).getTime() : 0;
				return playedAt >= startOfDay && playedAt <= endOfDay;
			});

			let w = 0;
			let l = 0;

			dayMatches.forEach(m => {
				if (m.winner_id === currentUserId) w++;
				else l++;
			});

			result.labels.push(label);
			result.wins.push(w);
			result.losses.push(l);
		}
		return result;
	};

	// Fetch matches when user or range changes
	useEffect(() => {
		if (!user?.id) return;

		let active = true;
		const days = parseInt(range);

		const fetchData = async () => {
			try {
				// Fetch enough history. Limit=100 should cover most 30d cases unless they play A LOT.
				const history = await getUserMatches(user.id, 100);
				if (!active) return;

				if (Array.isArray(history)) {
					const processed = processMatchHistory(history, days, user.id);
					setChartData(processed);
				}
			} catch (e) {
				console.error("Failed to load chart stats", e);
			}
		};

		fetchData();

		return () => { active = false; };
	}, [user?.id, range]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Initial empty data
		const data: ChartData<"line"> = {
			labels: [],
			datasets: [
				{
					label: t("dashboard.wins"),
					data: [],
					fill: true,
					backgroundColor: "rgba(52, 211, 153, 0.45)", // Solid color initially, gradient applied later/below if needed, or simplified
					borderColor: "rgba(52, 211, 153, 1)",
					borderWidth: 2,
					tension: 0.35,
					pointRadius: 3,
					pointBackgroundColor: "rgba(52, 211, 153, 1)",
					pointBorderColor: "#ffffff",
				},
				{
					label: t("dashboard.losses"),
					data: [],
					fill: true,
					backgroundColor: "rgba(248, 113, 113, 0.45)",
					borderColor: "rgba(248, 113, 113, 1)",
					borderWidth: 2,
					tension: 0.35,
					pointRadius: 3,
					pointBackgroundColor: "rgba(248, 113, 113, 1)",
					pointBorderColor: "#ffffff",
				},
			],
		};

		// Create gradients once
		const gradientWins = ctx.createLinearGradient(0, 0, 0, canvas.height || 300);
		gradientWins.addColorStop(0, "rgba(52, 211, 153, 0.45)");
		gradientWins.addColorStop(1, "rgba(52, 211, 153, 0)");

		const gradientLosses = ctx.createLinearGradient(0, 0, 0, canvas.height || 300);
		gradientLosses.addColorStop(0, "rgba(248, 113, 113, 0.45)");
		gradientLosses.addColorStop(1, "rgba(248, 113, 113, 0)");

		data.datasets[0].backgroundColor = gradientWins;
		data.datasets[1].backgroundColor = gradientLosses;

		const options: ChartOptions<"line"> = {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					display: false,
				},
				tooltip: {
					enabled: true,
					backgroundColor: "rgba(15, 23, 42, 0.95)",
					titleColor: "#e5e7eb",
					bodyColor: "#e5e7eb",
					borderColor: "rgba(148, 163, 184, 0.6)",
					borderWidth: 1,
				},
			},
			scales: {
				x: {
					grid: {
						color: "rgba(255,255,255,0.08)",
					},
					ticks: {
						color: "rgba(248,250,252,0.9)",
						maxRotation: 0,
						autoSkip: true,
					},
				},
				y: {
					grid: {
						color: "rgba(255,255,255,0.06)",
					},
					ticks: {
						color: "rgba(248,250,252,0.9)",
						stepSize: 1, // integers only for counts
						precision: 0
					},
					beginAtZero: true,
					// suggestedMax: 5, // REMOVED to allow auto-scaling
				},
			},
		};

		const chart = new Chart(ctx, {
			type: "line",
			data,
			options: {
				...options,
				animation: {
					duration: 750,
					easing: "easeOutQuart",
				},
			},
		});

		chartRef.current = chart;

		return () => {
			chart.destroy();
			chartRef.current = null;
		};
	}, []); // Run ONCE on mount

	// Update chart data whenever state changes
	useEffect(() => {
		const chart = chartRef.current;
		if (!chart || !chartData) return;

		chart.data.labels = chartData.labels;

		if (chart.data.datasets[0]) {
			chart.data.datasets[0].data = chartData.wins;
		}
		if (chart.data.datasets[1]) {
			chart.data.datasets[1].data = chartData.losses;
		}

		chart.update();
	}, [chartData]);

	return (
		<div className={`glass p-6 rounded-2xl h-full overflow-hidden flex flex-col text-[0.95rem] min-[1600px]:text-base ${className}`}>
			{/* Header */}
			<header className="flex items-center justify-between gap-3 min-w-0">
				<div className="flex items-center gap-2 min-w-0">
					<div className="w-9 h-9 rounded-full bg-white/20 border border-white/30 grid place-items-center shrink-0">
						<Activity className="w-5 h-5 text-white/90" aria-hidden="true" />
					</div>
					<h2 className="text-2xl min-[1600px]:text-3xl font-semibold truncate">{t("dashboard.statistics")}</h2>
				</div>
				<div className="shrink-0 bg-white/20 border border-white/30 rounded-full p-1 min-[1600px]:p-1.5">
					<div className="grid grid-cols-2 gap-1">
						<button
							className={`px-3 py-1 rounded-full text-xs min-[1600px]:text-sm ${range === "7" ? "bg-white/35 text-gray-900 font-medium cursor-pointer" : "hover:bg-white/30 cursor-pointer"
								}`}
							type="button"
							onClick={() => setRange("7")}
						>
							7d
						</button>
						<button
							className={`px-3 py-1 rounded-full text-xs min-[1600px]:text-sm ${range === "30" ? "bg-white/35 text-gray-900 font-medium cursor-pointer" : "hover:bg-white/30 cursor-pointer"
								}`}
							type="button"
							onClick={() => setRange("30")}
						>
							30d
						</button>
					</div>
				</div>
			</header>

			{/* Legend / Totals */}
			<div className="mt-4 flex items-center gap-5 text-sm min-[1600px]:text-base">
				<div className="flex items-center gap-2">
					<span className="w-6 h-1.5 rounded bg-emerald-400" />
					<span className="text-white/80">
						{t("dashboard.wins")} <span className="font-bold text-white ml-1">{displayStats?.number_of_wins ?? 0}</span>
					</span>
				</div>
				<div className="flex items-center gap-2">
					<span className="w-6 h-1.5 rounded bg-rose-400" />
					<span className="text-white/80">
						{t("dashboard.losses")} <span className="font-bold text-white ml-1">{displayStats?.number_of_loses ?? 0}</span>
					</span>
				</div>
				<div className="ml-auto text-white/50 text-xs">
					Total: {displayStats?.total_games ?? 0}
				</div>
			</div>

			{/* Chart container */}
			<div className="mt-3 bg-white/10 border border-white/25 rounded-2xl p-3 min-[1600px]:p-4 flex-1 min-h-0 chart-appear">
				<div className="relative w-full h-full rounded-xl overflow-hidden">
					{/* Canvas for Chart.js */}
					<canvas ref={canvasRef} id="statsChart" className="w-full h-full" />

					{/* Loading or Empty state overlay */}
					{(!chartData) && (
						<div
							className="absolute inset-0 flex items-center justify-center text-sm text-white/80 bg-black/20 backdrop-blur-sm animate-pulse"
						>
							Loading...
						</div>
					)}
					{(chartData && chartData.wins.every(w => w === 0) && chartData.losses.every(l => l === 0)) && (
						<div
							className="absolute inset-0 flex items-center justify-center text-sm text-white/80 bg-black/20 backdrop-blur-sm"
						>
							{t("dashboard.noStats")}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
