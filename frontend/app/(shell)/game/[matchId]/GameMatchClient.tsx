"use client";

import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/context/LanguageContext";
import { useAuth } from "@/app/context/AuthContext";
import { useGameSocket } from "@/app/context/GameSocketContext";
import GameCard from "../components/GameCard";
import GameCanvas from "../components/GameCanvas";
import Scoreboard from "../components/Scoreboard";
import { GameConfig, GameState } from "../data";

type GameMatchClientProps = {
	matchId: string;
	config: GameConfig;
	initialState: GameState;
	wsURL?: string;
	playerName?: string;
	userId?: number;
};

export default function GameMatchClient({ matchId, config, initialState, wsURL, playerName: propPlayerName, userId: propUserId }: GameMatchClientProps) {
	const router = useRouter();
	const { t } = useLanguage();
	const { user, loading } = useAuth();
	const { opponentName } = useGameSocket();
	const [currentScore, setCurrentScore] = useState({ p1: 0, p2: 0 });

	const userId = propUserId || user?.id;
	const playerName = propPlayerName && propPlayerName !== "Player" ? propPlayerName : user?.nickname || "Player";

	// Update player names for remote games with actual user nickname
	const updatedState = config.mode === "1v1" && user?.nickname 
		? {
			...initialState,
			players: {
				...initialState.players,
				p1: {
					...initialState.players.p1,
					displayName: user.nickname,
					nickname: user.nickname,
					avatarUrl: user.avatar || initialState.players.p1.avatarUrl,
				},
				p2: {
					...initialState.players.p2,
					displayName: opponentName || "Opponent",
					nickname: opponentName || "Opponent",
				}
			}
		}
		: initialState;

	useEffect(() => {
		// Don't check played matches for queue (remote games)
		if (matchId === "queue") return;

		const playedMatches = JSON.parse(sessionStorage.getItem("transcendence_played_matches") || "[]");
		if (playedMatches.includes(matchId)) {
			router.replace("/dashboard");
		}
	}, [matchId, router]);

	const handleScoreUpdate = useCallback((p1: number, p2: number) => {
		setCurrentScore({ p1, p2 });
	}, []);

	const handleGameEnd = useCallback(() => {
		// Don't save "queue" to played matches
		if (matchId !== "queue") {
			const playedMatches = JSON.parse(sessionStorage.getItem("transcendence_played_matches") || "[]");
			if (!playedMatches.includes(matchId)) {
				playedMatches.push(matchId);
				sessionStorage.setItem("transcendence_played_matches", JSON.stringify(playedMatches));
			}
		}

		// Delay redirect for remote games to show winner
		setTimeout(() => {
			router.replace("/dashboard");
		}, 3000);
	}, [matchId, router]);

	const state: GameState = {
		...updatedState,
		score: {
			...updatedState.score,
			p1: currentScore.p1,
			p2: currentScore.p2,
		},
	};

	const mode = config.mode === "1v1" ? "remote" : "local";

	if (loading) {
		return <div className="flex h-screen w-full items-center justify-center">
			<div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div>
		</div>;
	}

	return (
		<div className="grid grid-cols-12 sm:gap-4 md:gap-5 lg:gap-6 2xl:gap-8 min-w-0 h-auto">
			<section className="col-span-12 min-w-0">
				<GameCard className="game-page">
					<header className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between px-4 md:px-5 py-2 border-b border-white/10 bg-white/5">
						<div>
							<p className="text-xs uppercase tracking-[0.18em] text-white/70">{t("game.active.matchId")}</p>
							<p className="text-lg font-semibold">{matchId}</p>
						</div>
						<span className="chip px-3 py-1.5 text-xs uppercase tracking-wide">{t("game.active.mode")}: {config.mode}</span>
						<span className="chip px-3 py-1.5 text-xs uppercase tracking-wide">{t("game.active.bestOf")} {state.score.bestOf}</span>
					</header>
					<GameCanvas
						bestOf={state.score.bestOf}
						mode={mode}
						wsURL={wsURL}
						playerName={playerName}
						userId={userId}
						p1Name={state.players.p1.displayName}
						p2Name={state.players.p2.displayName}
						onScoreUpdate={handleScoreUpdate}
						onGameEnd={handleGameEnd}
					/>
					<div className="h-px bg-white/25 mx-3 md:mx-4 mb-4 md:mb-5 rounded" />
					<Scoreboard config={config} state={state} />
				</GameCard>
			</section>
		</div>
	);
}
