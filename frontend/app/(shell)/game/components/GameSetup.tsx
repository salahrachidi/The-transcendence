"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { GameMode, Score } from "../data";
import { generateShortId, mapMatchError } from "@/app/lib/matches";
import { useGameSocket } from "@/app/context/GameSocketContext";

type Props = {
	initialMode?: GameMode;
	initialLocalP1?: string;
	initialLocalP2?: string;
	initialBestOf?: Score["bestOf"];
	errorCode?: string | null;
};

const bestOfOptions: Score["bestOf"][] = [3, 5, 7];

export default function GameSetup({
	initialMode = "1v1",
	initialLocalP1,
	initialLocalP2,
	initialBestOf = 5,
	errorCode,
}: Props) {
	const router = useRouter();
	const [activeMode, setActiveMode] = useState<GameMode>(initialMode);
	const [p1Name, setP1Name] = useState(initialLocalP1 || "Player 1");
	const [p2Name, setP2Name] = useState(initialLocalP2 || "Player 2");
	const resolveBestOf = (value?: Score["bestOf"]) => {
		if (!value) return 5;
		return bestOfOptions.includes(value) ? value : 5;
	};
	const [bestOf, setBestOf] = useState<Score["bestOf"]>(resolveBestOf(initialBestOf));
	const [localTouched, setLocalTouched] = useState(false);

	useEffect(() => {
		setActiveMode(initialMode);
	}, [initialMode]);

	useEffect(() => {
		setP1Name(initialLocalP1 || "Player 1");
	}, [initialLocalP1]);

	useEffect(() => {
		setP2Name(initialLocalP2 || "Player 2");
	}, [initialLocalP2]);

	useEffect(() => {
		setBestOf(resolveBestOf(initialBestOf));
	}, [initialBestOf]);

	const validation = useMemo(() => {
		const a = p1Name.trim();
		const b = p2Name.trim();
		if (!a || !b) return { valid: false, message: "Enter both player names." };
		if (a.toLowerCase() === b.toLowerCase()) return { valid: false, message: "Names must be different." };
		return { valid: true, message: "" };
	}, [p1Name, p2Name]);

	const matchError = mapMatchError(errorCode);

	const launchLocalMatch = () => {
		setLocalTouched(true);
		if (!validation.valid) return;
		const id = generateShortId("local");
		const params = new URLSearchParams({
			mode: "local",
			p1: p1Name.trim(),
			p2: p2Name.trim(),
			bestOf: String(bestOf),
		});
		router.push(`/game/${id}?${params.toString()}`);
	};

	const { queueForMatch, status } = useGameSocket();

	useEffect(() => {
		if (status === "playing") {
			router.push("/game/queue");
		}
	}, [status, router]);

	const queueRankedMatch = () => {
		setActiveMode("1v1");
		queueForMatch();
	};

	const goToTournamentHub = () => {
		router.push("/tournament");
	};

	if (status === "waiting" || status === "connecting") {
		return (
			<div className="glass rounded-2xl p-8 flex flex-col items-center justify-center space-y-6 min-h-[400px]">
				<div className="relative">
					<div className="absolute inset-0 bg-blue-500/30 blur-xl rounded-full animate-pulse"></div>
					<div className="w-20 h-20 border-4 border-blue-400 border-t-transparent rounded-full animate-spin relative z-10"></div>
				</div>
				<div className="text-center space-y-2 relative z-10">
					<h3 className="text-2xl font-bold text-white tracking-widest uppercase">
						{status === "connecting" ? "Connecting..." : "Finding Opponent"}
					</h3>
					<p className="text-white/60">Please wait while we match you with a player...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="glass rounded-2xl p-5 md:p-6 space-y-5">
			{matchError && (
				<div className="rounded-2xl border border-red-400/70 bg-red-500/15 px-4 py-3 text-sm text-red-100">
					{matchError}
				</div>
			)}

			<div>
				<p className="text-xs uppercase tracking-[0.2em] text-white/70">Game setup</p>
				<h2 className="text-2xl font-bold mt-1">Pick a mode to get started.</h2>
			</div>

			<div className="inline-flex flex-wrap gap-2 bg-white/10 border border-white/20 rounded-full p-1">
				{(
					[
						{ mode: "1v1" as GameMode, label: "Ranked 1v1" },
						{ mode: "local" as GameMode, label: "Local" },
						{ mode: "tournament" as GameMode, label: "Tournament" },
					] as const
				).map(({ mode, label }) => (
					<button
						key={mode}
						type="button"
						className={`px-4 py-1.5 rounded-full text-sm cursor-pointer transition ${activeMode === mode ? "bg-white text-gray-900 font-semibold" : "text-white/80 hover:bg-white/15"
							}`}
						onClick={() => setActiveMode(mode)}
					>
						{label}
					</button>
				))}
			</div>

			{activeMode === "1v1" && (
				<div className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-4">
					<div>
						<p className="text-sm text-white/70">Jump back into the ranked queue.</p>
						<p className="text-sm text-white/55">We&apos;ll create the match context for you.</p>
					</div>
					<button
						type="button"
						className="chip px-4 py-2 cursor-pointer"
						onClick={queueRankedMatch}
					>
						Resume queue
					</button>
				</div>
			)}

			{activeMode === "local" && (
				<div className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-4">
					<div>
						<p className="text-sm text-white/70">Set player names and best-of, then launch the offline match UI.</p>
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<label className="space-y-2 text-sm">
							<span>Player 1</span>
							<input
								type="text"
								value={p1Name}
								onChange={e => setP1Name(e.target.value)}
								className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 focus:outline-none"
							/>
						</label>
						<label className="space-y-2 text-sm">
							<span>Player 2</span>
							<input
								type="text"
								value={p2Name}
								onChange={e => setP2Name(e.target.value)}
								className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 focus:outline-none"
							/>
						</label>
					</div>
					<div className="flex flex-wrap items-center gap-2 text-sm">
						<span className="text-white/70">Best of:</span>
						{bestOfOptions.map(option => (
							<button
								key={option}
								type="button"
								className={`chip px-3 py-1.5 cursor-pointer ${bestOf === option ? "bg-white text-gray-900" : ""
									}`}
								onClick={() => setBestOf(option)}
							>
								{option}
							</button>
						))}
					</div>
					{!validation.valid && localTouched && (
						<p className="text-sm text-red-300">{validation.message}</p>
					)}
					<button
						type="button"
						className="w-full rounded-xl bg-white/90 text-gray-900 font-semibold py-2 cursor-pointer"
						onClick={launchLocalMatch}
					>
						Launch local match
					</button>
				</div>
			)}

			{activeMode === "tournament" && (
				<div className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-4">
					<div>
						<p className="text-sm text-white/70">Need brackets instead? Jump into the tournament hub.</p>
					</div>
					<button
						type="button"
						className="chip px-4 py-2 cursor-pointer"
						onClick={goToTournamentHub}
					>
						Open tournament hub
					</button>
				</div>
			)}
		</div>
	);
}
