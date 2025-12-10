"use client";

import React, { createContext, useContext, useRef, useEffect, useState, useCallback } from "react";
import { remoteGame } from "../(shell)/game/engine/mainRemote";
import { useAuth } from "./AuthContext";

type GameSocketContextType = {
	game: remoteGame | null;
	status: "idle" | "connecting" | "waiting" | "playing" | "finished";
	opponentName: string | null;
	queueForMatch: () => void;
	resetGame: () => void;
};

const GameSocketContext = createContext<GameSocketContextType | undefined>(undefined);

export function GameSocketProvider({ children }: { children: React.ReactNode }) {
	const { user } = useAuth();
	const gameRef = useRef<remoteGame | null>(null);
	const [status, setStatus] = useState<GameSocketContextType["status"]>("idle");
	const [opponentName, setOpponentName] = useState<string | null>(null);

	useEffect(() => {
		// Initialize the game instance once
		if (!gameRef.current) {
			gameRef.current = new remoteGame(
				undefined, // onScoreUpdate
				undefined, // onGameEnd
				() => setStatus("waiting"), // onWaiting
				(opponent) => {
					setStatus("playing");
					setOpponentName(opponent);
				}  // onGameStart
			);
		}

		return () => {
			if (gameRef.current) {
				gameRef.current.disconnect();
				gameRef.current = null;
			}
		};
	}, []);

	const queueForMatch = useCallback(() => {
		if (!user || !gameRef.current) return;

		const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
		const wsURL = `${protocol}//${window.location.host}/ws/game`;

		setStatus("connecting");
		gameRef.current.connect(wsURL, user.nickname, user.id);
	}, [user]);

	const resetGame = useCallback(() => {
		if (gameRef.current) {
			gameRef.current.disconnect();
		}
		setStatus("idle");
		setOpponentName(null);
	}, []);

	return (
		<GameSocketContext.Provider value={{ game: gameRef.current, status, opponentName, queueForMatch, resetGame }}>
			{children}
		</GameSocketContext.Provider>
	);
}

export function useGameSocket() {
	const context = useContext(GameSocketContext);
	if (context === undefined) {
		throw new Error("useGameSocket must be used within a GameSocketProvider");
	}
	return context;
}
