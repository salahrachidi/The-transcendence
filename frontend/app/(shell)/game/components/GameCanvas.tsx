"use client";

import { useEffect, useRef, useState } from "react";
import { localGame } from "../engine/main";
import { remoteGame } from "../engine/mainRemote";
import { useLanguage } from "@/app/context/LanguageContext";
import { useGameSocket } from "@/app/context/GameSocketContext";
import { ArrowUp, ArrowDown } from "lucide-react";

// export default function GameCanvas() {
export default function GameCanvas(Props: {
	bestOf: number
	mode: "local" | "remote"
	wsURL?: string
	playerName?: string
	userId?: number
	p1Name?: string
	p2Name?: string
	paddleSpeed?: number
	ballSpeed?: number
	onScoreUpdate?: (p1: number, p2: number) => void
	onGameEnd?: (winner: "left" | "right", score: { p1: number; p2: number }) => void
}) {

	const canvasRef = useRef<HTMLCanvasElement>(null);
	const gameRef = useRef<any>(null);
	const initializedRef = useRef(false);
	const mountCountRef = useRef(0);
	const { t } = useLanguage();
	const { game: globalGame, status, queueForMatch } = useGameSocket();
	const [countdown, setCountdown] = useState(Props.mode === "local" ? 3 : 0);
	const [winner, setWinner] = useState<string | null>(null);

	// Cleanup only on FINAL unmount (not on React StrictMode double-mount)
	useEffect(() => {
		// Cleanup only for local game
		return () => {
			if (Props.mode === "local" && gameRef.current) {
				gameRef.current.stop();
				gameRef.current = null;
			}
			// For remote, we DO NOT disconnect here because the context manages the connection.
		};
	}, [Props.mode]);

	/* ... existing countdown useEffect ... */
	useEffect(() => {
		if (Props.mode === "local" && countdown > 0) {
			const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
			return () => clearTimeout(timer);
		}
	}, [countdown, Props.mode]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		if (Props.mode === "local") {
			if (countdown > 0) return;

			const game = localGame("pong-canvas", {
				maxScore: Props.bestOf,
				...(Props.paddleSpeed !== undefined && { paddleSpeed: Props.paddleSpeed }),
				...(Props.ballSpeed !== undefined && { ballSpeed: Props.ballSpeed }),
				onScoreUpdate: Props.onScoreUpdate,
				onGameEnd: (w, s) => {
					setWinner(w === "left" ? (Props.p1Name || "Left Player") : (Props.p2Name || "Right Player"));
					game.stop();
					setTimeout(() => {
						Props.onGameEnd?.(w, s);
					}, 3000);
				}
			});

			gameRef.current = game;
			game.start();

			return () => {
				game.stop();
				gameRef.current = null;
			};
		} else if (Props.mode === "remote") {
			// Handle Page Refresh: If status is idle, we disconnected. Re-queue.
			if (status === "idle") {
				queueForMatch();
				return;
			}

			if (globalGame) {
				gameRef.current = globalGame;
				try {
					globalGame.attachCanvas("pong-canvas", Props.onScoreUpdate, Props.onGameEnd);
				} catch (e) {
					console.error("Failed to attach canvas:", e);
				}
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [Props.mode, globalGame, countdown, status]);

	// Touch handlers
	const handleTouch = (key: string, pressed: boolean) => {
		if (gameRef.current) {
			gameRef.current.handleInput(key, pressed);
		}
	};

	const ControlBtn = ({ keyName, icon: Icon, styles }: { keyName: string, icon: any, styles: string }) => (
		<button
			className={`absolute w-16 h-16 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full grid place-items-center active:bg-white/30 transition-colors touch-none ${styles}`}
			onPointerDown={(e) => {
				e.preventDefault(); // Prevent scrolling
				handleTouch(keyName, true);
			}}
			onPointerUp={() => handleTouch(keyName, false)}
			onPointerLeave={() => handleTouch(keyName, false)}
			onPointerCancel={() => handleTouch(keyName, false)}
		>
			<Icon className="w-8 h-8 text-white" />
		</button>
	);

	return (
		<div className="flex-1 min-h-[360px] md:min-h-[420px] xl:min-h-[520px] bg-white/5 rounded-2xl m-4 md:m-3 overflow-hidden border border-white/15 relative select-none touch-none">
			<canvas
				id="pong-canvas"
				ref={canvasRef}
				width={800}
				height={600}
				className="w-full h-full object-contain"
			/>

			{/* Mobile Controls Overlay (Hidden on Large Screens) */}
			<div className="lg:hidden absolute inset-0 pointer-events-none">
				{/* Left Controls (Only for Local) */}
				{Props.mode === "local" && (
					<>
						<ControlBtn keyName="w" icon={ArrowUp} styles="left-4 bottom-24 pointer-events-auto" />
						<ControlBtn keyName="s" icon={ArrowDown} styles="left-4 bottom-4 pointer-events-auto" />
					</>
				)}

				{/* Right Controls (Local & Remote) */}
				<ControlBtn keyName="ArrowUp" icon={ArrowUp} styles="right-4 bottom-24 pointer-events-auto" />
				<ControlBtn keyName="ArrowDown" icon={ArrowDown} styles="right-4 bottom-4 pointer-events-auto" />
			</div>

			{countdown > 0 && Props.mode === "local" && (
				<div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10 animate-in fade-in duration-300">
					<div className="text-[120px] font-black text-white drop-shadow-[0_0_80px_rgba(255,255,255,0.5)] animate-pulse">
						{countdown}
					</div>
				</div>
			)}
			{Props.mode === "remote" && (status === "waiting" || status === "connecting") && (
				<div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md z-20 animate-in fade-in duration-500">
					<div className="text-2xl font-bold text-white/60 mb-4 uppercase tracking-widest">Finding Opponent</div>
					<div className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-[0_0_30px_rgba(56,189,248,0.5)] animate-pulse">
						Waiting...
					</div>
				</div>
			)}
			{winner && (
				<div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md z-20 animate-in fade-in duration-500">
					<div className="text-2xl font-bold text-white/60 mb-4 uppercase tracking-widest">{t("game.active.matchFinished")}</div>
					<div className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 drop-shadow-[0_0_30px_rgba(56,189,248,0.5)] animate-bounce">
						{winner} {t("game.active.wins")}
					</div>
				</div>
			)}
		</div>
	);
}