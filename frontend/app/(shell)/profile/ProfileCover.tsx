"use client";

import React from "react";
import Avatar from "@/app/components/Avatar";

import { useLanguage } from "@/app/context/LanguageContext";

import { UserGaming } from "../../lib/auth/fetchMyData";

type ProfileCoverProps = {
	nickname: string;
	avatarUrl: string;
	stats?: UserGaming | null;
};

const ProfileCover: React.FC<ProfileCoverProps> = ({ nickname, avatarUrl, stats }) => {
	const { t } = useLanguage();
	const raw = (nickname && nickname.trim()) || "PLAYER";
	const displayName = raw.toUpperCase();

	// Compute display stats
	const games = stats?.total_games ?? 0;
	const wins = stats?.number_of_wins ?? 0;
	const losses = stats?.number_of_loses ?? 0;
	// Calculate percentages if games > 0
	// winRate: (wins/games)*100
	const winRate = games > 0 ? Math.round((wins / games) * 100) : 0;
	// lossRate: (losses/games)*100
	const lossRate = games > 0 ? Math.round((losses / games) * 100) : 0;

	const bgStyle = { background: "rgba(255, 255, 255, 0.15)" };
	const accentColor = "#FF00FF"; // Neon Pink
	const gridColor = "rgba(34, 211, 238, 0.25)"; // Cyan/Teal

	return (
		<div
			className="glass card-radius overflow-hidden profile-cover relative group"
			style={{ "--user-accent": accentColor } as React.CSSProperties}
		>
			{/* Animated Background Layer */}
			<div
				className="cover relative overflow-hidden h-[280px] md:h-[320px] w-full transition-all duration-700"
				style={bgStyle}
			>
				{/* Racket Images (Behind Grid) */}
				<img
					src="/left.webp"
					alt=""
					className="racket-left absolute left-0 bottom-0 h-[95%] w-auto object-contain object-bottom pointer-events-none select-none mix-blend-screen drop-shadow-[0_0_25px_rgba(34,211,238,0.8)] transition-all duration-700 ease-out"
				/>

				<img
					src="/right.webp"
					alt=""
					className="racket-right absolute right-0 bottom-0 h-[95%] w-auto object-contain object-bottom pointer-events-none select-none mix-blend-screen drop-shadow-[0_0_25px_rgba(244,114,182,0.8)] transition-all duration-700 ease-out"
				/>


				{/* Cyberpunk Grid Animation */}
				<div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none"></div>

				{/* Content Overlay */}
				<div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-6">
					{/* Avatar with Halo */}
					<div className="avatar-halo relative mb-4 group-hover:scale-105 transition-transform duration-500 flex items-center justify-center">
						<div className="avatar-sq w-28 h-28 md:w-32 md:h-32 overflow-hidden rounded-full border-4 border-black/50 bg-[var(--card-bg)] shadow-2xl relative z-20">
							<Avatar
								src={avatarUrl}
								alt={`${nickname} avatar`}
								className="w-full h-full object-cover"
								size={48}
							/>
						</div>

						{/* Neon Rings */}
						<span className="halo-ring ring-1"></span>
						<span className="halo-ring ring-2"></span>
						<span className="halo-ring ring-3"></span>
					</div>

					{/* Nickname Glitch */}
					<div className="relative">
						<h1 className="text-2xl md:text-4xl font-black text-white tracking-wider drop-shadow-lg text-glow transition-all duration-500">
							{displayName}
						</h1>
					</div>

					{/* Stats Strip (Real Data) */}
					<div className="stats-strip mt-2 flex gap-6 md:gap-12 px-6 py-3 rounded-full">
						<div className="text-center">
							<div className="text-xs text-white/60 uppercase tracking-widest">
								{t("dashboard.games")}
							</div>
							<div className="text-xl md:text-2xl font-bold text-white">{games}</div>
						</div>
						<div className="text-center">
							<div className="text-xs text-white/60 uppercase tracking-widest">
								{t("dashboard.wins")}
							</div>
							<div className="text-xl md:text-2xl font-bold text-emerald-400">
								{winRate}%
							</div>
						</div>
						<div className="text-center">
							<div className="text-xs text-white/60 uppercase tracking-widest">
								{t("dashboard.losses")}
							</div>
							<div className="text-xl md:text-2xl font-bold text-rose-400">
								{lossRate}%
							</div>
						</div>
					</div>
				</div>
			</div>

			<style jsx>{`
				.cyber-grid {
					background-image: 
					linear-gradient(
						0deg,
						transparent 24%,
						${gridColor} 25%,
						${gridColor} 26%,
						transparent 27%,
						transparent 74%,
						${gridColor} 75%,
						${gridColor} 76%,
						transparent 77%,
						transparent
					),
					linear-gradient(
						90deg,
						transparent 24%,
						${gridColor} 25%,
						${gridColor} 26%,
						transparent 27%,
						transparent 74%,
						${gridColor} 75%,
						${gridColor} 76%,
						transparent 77%,
						transparent
					);
					background-size: 50px 50px;
					transform: perspective(500px) rotateX(60deg) translateY(0);
					animation: gridMove 20s linear infinite;
					transform-origin: top center;
				}

				@keyframes gridMove {
					0% {
					background-position: 0 0;
					}
					100% {
					background-position: 0 1000px;
					}
				}

				:global(.profile-cover:hover) .cyber-grid {
					animation-duration: 60s;
				}

				.text-glow {
					text-shadow: none;
				}

				:global(.dark) .text-glow {
					text-shadow: 0 0 20px var(--user-accent);
				}

				/* Rackets: smooth in/out + glow */
				.racket-left,
				.racket-right {
					opacity: 0;
					transition:
					opacity 450ms cubic-bezier(0.16, 1, 0.3, 1),
					transform 450ms cubic-bezier(0.16, 1, 0.3, 1),
					filter 450ms cubic-bezier(0.16, 1, 0.3, 1);
				}

				.racket-left {
					transform-origin: 100% 100%; /* bottom-right pivot */
					transform: translateX(-140%) rotate(-40deg) scale(0.8);
					/* base subtle cyan glow - REMOVED */
				}

				.racket-right {
					transform-origin: 0% 100%; /* bottom-left pivot */
					transform: translateX(140%) rotate(40deg) scale(0.8) scaleX(-1);
					/* base subtle pink glow - REMOVED */
				}

				/* Hover: glide in, tilt, and glow harder */
				:global(.profile-cover:hover) .racket-left {
					opacity: 0.9;
					transform: translateX(4%) rotate(6deg) scale(0.85);
					transform: translateX(4%) rotate(6deg) scale(0.85);
				}

				:global(.profile-cover:hover) .racket-right {
					opacity: 0.9;
					transform: translateX(-4%) rotate(-6deg) scale(0.85) scaleX(-1);
					transform: translateX(-4%) rotate(-6deg) scale(0.85) scaleX(-1);
				}

				/* --- Avatar Halo Styles --- */
				.avatar-halo {
					--pink: #ff3cac;
					--purple: #784ba0;
					--blue: #2b86c5;
					--card-bg: rgba(15, 23, 42, 0.9);
					--glass-border: rgba(148, 163, 184, 0.35);
					
					width: 160px;
					height: 160px;
				}

				.halo-ring {
					position: absolute;
					inset: -10px;
					border-radius: 50%;
					pointer-events: none;
					mix-blend-mode: screen;
					will-change: transform;
				}

				/* Ring 1: Pink/Purple fast spin */
				.ring-1 {
					inset: -5px;
					border: 2px solid transparent;
					background: conic-gradient(from 0deg, transparent 0%, var(--pink) 20%, transparent 40%, transparent 100%);
					-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
					-webkit-mask-composite: xor;
					mask-composite: exclude;
					animation: spin 4s linear infinite;
					opacity: 0.8;
				}

				/* Ring 2: Blue/Purple reverse slow spin */
				.ring-2 {
					inset: -12px;
					border: 2px solid transparent;
					background: conic-gradient(from 180deg, transparent 0%, var(--blue) 15%, transparent 30%, transparent 100%);
					-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
					-webkit-mask-composite: xor;
					mask-composite: exclude;
					animation: spin-reverse 7s linear infinite;
					opacity: 0.6;
				}

				/* Ring 3: Purple pulse/wobble */
				.ring-3 {
					inset: -20px;
					border: 1px solid transparent;
					background: conic-gradient(from 90deg, transparent 0%, var(--purple) 40%, transparent 60%, transparent 100%);
					-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
					-webkit-mask-composite: xor;
					mask-composite: exclude;
					animation: spin 12s linear infinite;
					opacity: 0.4;
				}

				@keyframes spin {
					from { transform: rotateZ(0deg); }
					to { transform: rotateZ(360deg); }
				}

				@keyframes spin-reverse {
					from { transform: rotateZ(360deg); }
					to { transform: rotateZ(0deg); }
				}

				@media (prefers-reduced-motion: reduce) {
					.halo-ring {
						animation: none;
						opacity: 0.5;
						transform: rotateZ(45deg); /* Static angle */
					}
				}

				.stats-strip {
					background-color: rgba(0, 0, 0, 0.4);
					backdrop-filter: blur(12px);
					-webkit-backdrop-filter: blur(12px);
					border: 1px solid rgba(255, 255, 255, 0.1);
					transition: none !important;
				}
				`}</style>


		</div>
	);
};

export default ProfileCover;
