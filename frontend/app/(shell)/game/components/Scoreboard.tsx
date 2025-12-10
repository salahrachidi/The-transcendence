// app/(shell)/game/Scoreboard.tsx
"use client";

import { forwardRef, useEffect, useRef } from "react";
import { GameConfig, GameState, defaultGameConfig, getControlsFor, getPlayerKeyLabelsById } from "../data";
import Avatar from "@/app/components/Avatar";

const Key = forwardRef<HTMLDivElement, { label: string; className?: string }>(
	({ label, className = "" }, ref) => {
		return (
			<div
				ref={ref}
				data-key={label}
				className={`game-key select-none grid place-items-center font-extrabold ${className}`}
			>
				{label}
			</div>
		);
	},
);

Key.displayName = "Key";

type ScoreboardProps = {
	config: GameConfig;
	state: GameState;
};

export default function Scoreboard({ config, state }: ScoreboardProps) {
	const mode = config.mode ?? defaultGameConfig.mode;
	const { players, score } = state;
	const [p1UpLabel, p1DownLabel] = getPlayerKeyLabelsById("p1");
	const [p2UpLabel, p2DownLabel] = getPlayerKeyLabelsById("p2");
	const p1Controls = getControlsFor("p1");
	const p2Controls = getControlsFor("p2");

	const p1UpRef = useRef<HTMLDivElement | null>(null);
	const p1DownRef = useRef<HTMLDivElement | null>(null);
	const p2UpRef = useRef<HTMLDivElement | null>(null);
	const p2DownRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const normalizeKey = (key: string) => (key.length === 1 ? key.toUpperCase() : key);

		const resolveRef = (key: string) => {
			const k = normalizeKey(key);
			if (k === normalizeKey(p1Controls.up)) return p1UpRef.current;
			if (k === normalizeKey(p1Controls.down)) return p1DownRef.current;
			if (k === normalizeKey(p2Controls.up)) return p2UpRef.current;
			if (k === normalizeKey(p2Controls.down)) return p2DownRef.current;
			return null;
		};

		const down = (e: KeyboardEvent) => {
			const el = resolveRef(e.key);
			if (!el) return;
			el.classList.add("active");
		};
		const up = (e: KeyboardEvent) => {
			const el = resolveRef(e.key);
			if (!el) return;
			el.classList.remove("active");
		};
		const preventScroll = (e: KeyboardEvent) => {
			if (
				[
					p1Controls.up,
					p1Controls.down,
					p2Controls.up,
					p2Controls.down,
					"w",
					"s",
				].includes(e.key)
			) {
				e.preventDefault();
			}
		};

		window.addEventListener("keydown", down);
		window.addEventListener("keyup", up);
		window.addEventListener("keydown", preventScroll, { passive: false });

		return () => {
			window.removeEventListener("keydown", down);
			window.removeEventListener("keyup", up);
			window.removeEventListener("keydown", preventScroll);
		};
	}, []);

	return (
		<div className="mx-4 md:mx-5 mb-4 md:mb-5">
			<div className="rounded-2xl border border-white/15 bg-white/5 p-3 md:p-4">
				{/* Score row */}
				<div className="grid items-center gap-y-5 gap-x-12 sm:gap-y-6 sm:gap-x-14 lg:gap-x-16 xl:gap-x-60 md:grid-cols-[1fr_auto_1fr]">
					{/* P1 */}
					<div className="order-2 md:order-1 flex items-center justify-center md:justify-end gap-3 sm:gap-4 min-w-0 justify-self-center md:justify-self-end">
						{/* Avatar */}
						<div className="w-[76px] h-[76px] md:w-[84px] md:h-[84px] rounded-full overflow-hidden border border-white/35 bg-white/20 shrink-0">
							<Avatar
								src={players.p1.avatarUrl}
								alt={`${players.p1.displayName} avatar`}
								className="w-full h-full object-cover"
								size={32}
							/>
						</div>
						{/* Meta */}
						<div className="flex flex-col gap-1.5 min-w-0">
							<div className="font-bold text-[1.05rem] truncate max-w-[20ch]">
								{players.p1.displayName}
							</div>
							{mode === "local" && (
								<div className="flex items-center gap-2">
									<Key ref={p1UpRef} label={p1UpLabel} className="p1" />
									<Key ref={p1DownRef} label={p1DownLabel} className="p1" />
								</div>
							)}
						</div>
					</div>

					{/* Score */}
					<div className="order-1 md:order-2 text-center">
						<div className="font-extrabold text-[clamp(2rem,3.2vw+0.3rem,3rem)]">
							{score.p1} <span className="opacity-70">:</span> {score.p2}
						</div>
						{mode !== "local" && (
							<div className="mt-2 text-xs text-white/50 font-medium tracking-wide">
								Use <span className="text-white/80 font-bold">↑</span> <span className="text-white/80 font-bold">↓</span> or arrow keys to play
							</div>
						)}
					</div>

					{/* P2 */}
					<div className="order-3 flex items-center justify-center md:justify-start gap-3 sm:gap-4 min-w-0 justify-self-center md:justify-self-start">
						<div className="flex flex-col gap-1.5 min-w-0 text-right">
							<div className="font-bold text-[1.05rem] truncate max-w-[20ch]">
								{players.p2.displayName}
							</div>
							{mode === "local" && (
								<div className="flex items-center justify-end gap-2">
									<Key ref={p2UpRef} label={p2UpLabel} className="p2" />
									<Key ref={p2DownRef} label={p2DownLabel} className="p2" />
								</div>
							)}
						</div>
						<div className="w-[76px] h-[76px] md:w-[84px] md:h-[84px] rounded-full overflow-hidden border border-white/35 bg-white/20 shrink-0">
							<Avatar
								src={players.p2.avatarUrl}
								alt={`${players.p2.displayName} avatar`}
								className="w-full h-full object-cover"
								size={32}
							/>
						</div>
					</div>
				</div>

				<p className="text-[0.78rem] text-white/75 text-center mt-1.5">
					{/*Tips: Press <strong>P</strong> to Play/Pause*/}
				</p>
			</div>
		</div>
	);
}
