"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Gamepad2, Home, Trophy, UserPlus, CheckCircle, X, Trash2 } from "lucide-react";
import { generateShortId } from "@/app/lib/matches";
import Avatar from "@/app/components/Avatar";
import { useAuth } from "@/app/context/AuthContext";
import { useLanguage } from "@/app/context/LanguageContext";
import LoadingOverlay from "@/app/components/LoadingOverlay";
import { verifyPlayerCredentials, VerifiedUser } from "@/app/lib/auth/verifyPlayer";

type Mode = "1v1" | "tournament" | "local";
type QueueState = "idle" | "searching" | "found";

type TournamentSlot = {
	id?: number;
	nickname: string;
	alias?: string;
	avatar?: string;
	verified: boolean;
	isSelf?: boolean;
};

export default function HeroPanel() {
	const [mode, setMode] = useState<Mode>("1v1");
	const [modalOpen, setModalOpen] = useState(false);
	const [localModalOpen, setLocalModalOpen] = useState(false);
	const [tournamentModalOpen, setTournamentModalOpen] = useState(false);
	const [queueState, setQueueState] = useState<QueueState>("idle");
	const [isRedirecting, setIsRedirecting] = useState(false);
	const [p1Name, setP1Name] = useState("Player 1");
	const [p2Name, setP2Name] = useState("Player 2");
	const [bestOf, setBestOf] = useState<3 | 5 | 7>(5);
	const [tournamentName, setTournamentName] = useState("Tournament");
	const [tournamentSize, setTournamentSize] = useState<4>(4);

	// Tournament State
	const [tournamentSlots, setTournamentSlots] = useState<TournamentSlot[]>([]);
	const [activeSlotIdx, setActiveSlotIdx] = useState<number | null>(null); // Which slot is currently being edited/added

	// Auth Form State (for the active slot)
	const [authNickname, setAuthNickname] = useState("");
	const [authAlias, setAuthAlias] = useState("");
	const [authPassword, setAuthPassword] = useState("");
	const [authError, setAuthError] = useState("");
	const [isVerifying, setIsVerifying] = useState(false);

	const timerRef = useRef<number | null>(null);
	const router = useRouter();
	const { user } = useAuth();
	const { t } = useLanguage();

	// Sync Player 1 name with authenticated user
	useEffect(() => {
		if (user?.nickname) {
			setP1Name(user.nickname);
		}
	}, [user]);

	// Initialize tournament slots
	useEffect(() => {
		if (user && tournamentSlots.length === 0 && tournamentModalOpen) {
			// Initialize with Logged in user as Player 1
			const initialSlots: TournamentSlot[] = Array(4).fill(null).map((_, i) => {
				if (i === 0) {
					return {
						id: user.id || 0, // Fallback if id missing
						nickname: user.nickname,
						avatar: user.avatar || "",
						verified: true,
						isSelf: true
					};
				}
				return { nickname: "", verified: false };
			});
			setTournamentSlots(initialSlots);
		} else if (!user && tournamentSlots.length === 0 && tournamentModalOpen) {
			// If no user, initialize all slots as empty
			setTournamentSlots(Array(4).fill({ nickname: "", verified: false }));
		}
	}, [user, tournamentModalOpen, tournamentSlots.length]);

	// ---------- primary CTA behaviour ----------
	const primaryLabel =
		mode === "1v1" ? t("dashboard.findMatch") : mode === "tournament" ? t("dashboard.playTournament") : t("dashboard.localPlay");

	const updateMode = (next: Mode) => {
		setMode(next);
	};

	const handlePrimaryClick = () => {
		//console.log("[HeroPanel] primary click, mode =", mode); // DEBUG
		if (mode === "1v1") {
			// open matchmaking modal
			setQueueState("idle");
			setModalOpen(true);
		} else if (mode === "tournament") {
			setTournamentModalOpen(true);
		} else {
			// local/offline setup modal
			setLocalModalOpen(true);
		}
	};

	// ---------- modal queue logic (demo) ----------
const handleJoinQueue = () => {
setModalOpen(false);
router.push('/game/queue');
};

	const handleCancelQueue = () => {
		if (timerRef.current) {
			window.clearTimeout(timerRef.current);
			timerRef.current = null;
		}
		setQueueState("idle");
	};

	const closeModal = () => {
		handleCancelQueue();
		setModalOpen(false);
	};

	const closeLocalModal = () => {
		setLocalModalOpen(false);
	};

	const closeTournamentModal = () => {
		setTournamentModalOpen(false);
		setActiveSlotIdx(null);
		setAuthNickname("");
		setAuthPassword("");
		setAuthError("");
	};

	const startLocalGame = () => {
		if (!localValidation.valid) return;
		const safeP1 = p1Name.trim();
		const safeP2 = p2Name.trim();
		const id = generateShortId("local");
		const params = new URLSearchParams({
			mode: "local",
			p1: safeP1,
			p2: safeP2,
			bestOf: String(bestOf),
		});
		setIsRedirecting(true);
		router.push(`/game/${id}?${params.toString()}`);
		setLocalModalOpen(false);
	};

	// ---------- Tournament Auth Logic ----------

	const openAuthForSlot = (idx: number) => {
		setActiveSlotIdx(idx);
		// Pre-fill alias if editing existing slot (like Self)
		const existingSlot = tournamentSlots[idx];
		setAuthAlias(existingSlot?.alias || "");
		setAuthNickname("");
		setAuthPassword("");
		setAuthError("");
	};

	// Check duplicates (excluding self)
	const saveSelfAlias = () => {
		const aliasInput = authAlias.trim();

		if (aliasInput) {
			const isDuplicate = tournamentSlots.some((s, i) => {
				if (i === activeSlotIdx) return false;
				const target = aliasInput.toLowerCase();
				// Check against nickname AND alias of others
				return (s.nickname.toLowerCase() === target) || (s.alias?.toLowerCase() === target);
			});

			if (isDuplicate) {
				setAuthError("Alias matches another player's nickname or alias.");
				return;
			}
		}

		setTournamentSlots(prev => {
			const next = [...prev];
			if (activeSlotIdx !== null) {
				next[activeSlotIdx] = {
					...next[activeSlotIdx],
					alias: aliasInput // Can be empty string (optional)
				};
			}
			return next;
		});
		cancelAuth();
	};

	const cancelAuth = () => {
		setActiveSlotIdx(null);
		setAuthError("");
		setAuthNickname("");
		setAuthAlias("");
		setAuthPassword("");
	};

	const removePlayer = (idx: number) => {
		setTournamentSlots(prev => {
			const next = [...prev];
			next[idx] = { nickname: "", verified: false };
			return next;
		});
	};

	const handleVerifyPlayer = async () => {
		if (!authNickname || !authPassword) {
			setAuthError("Please enter both nickname and password.");
			return;
		}

		// Check duplicates (nickname vs everyone's nickname AND alias)
		const nickInput = authNickname.trim().toLowerCase();
		const aliasInput = authAlias.trim().toLowerCase();

		const nickTaken = tournamentSlots.some(s => {
			if (!s.verified) return false;
			const sNick = s.nickname.toLowerCase();
			const sAlias = s.alias?.toLowerCase();
			return sNick === nickInput || sAlias === nickInput;
		});

		if (nickTaken) {
			setAuthError("Nickname matches another player's name or alias.");
			return;
		}

		// Check duplicates (alias vs everyone's nickname AND alias)
		if (aliasInput) {
			const aliasTaken = tournamentSlots.some(s => {
				if (!s.verified) return false;
				const sNick = s.nickname.toLowerCase();
				const sAlias = s.alias?.toLowerCase();
				return sNick === aliasInput || sAlias === aliasInput;
			});
			if (aliasTaken) {
				setAuthError("Alias matches another player's name or alias.");
				return;
			}
		}

		setIsVerifying(true);
		setAuthError("");

		const verifiedUser = await verifyPlayerCredentials(authNickname, authPassword);
		setIsVerifying(false);

		if (verifiedUser && activeSlotIdx !== null) {
			setTournamentSlots(prev => {
				const next = [...prev];
				next[activeSlotIdx] = {
					id: verifiedUser.id,
					nickname: verifiedUser.nickname,
					alias: authAlias.trim(),
					avatar: verifiedUser.avatar,
					verified: true,
					isSelf: false
				};
				return next;
			});
			cancelAuth(); // Close form
		} else {
			setAuthError("Invalid credentials.");
		}
	};


	const startTournament = () => {
		if (!tournamentValidation.valid) return;

		const finalizedNames = tournamentSlots.map(s => s.alias || s.nickname);

		const params = new URLSearchParams({
			mode: "tournament",
			name: tournamentName.trim() || "Tournament",
			size: String(tournamentSize),
			players: finalizedNames.join(","),
		});
		// Remove ID from URL since we use search params only for ad-hoc
		setIsRedirecting(true);
		router.push(`/tournament?${params.toString()}`);
		setTournamentModalOpen(false);
	};

	// cleanup on unmount
	useEffect(() => {
		return () => {
			if (timerRef.current) {
				window.clearTimeout(timerRef.current);
			}
		};
	}, []);

	const localValidation = useMemo(() => {
		const a = p1Name.trim();
		const b = p2Name.trim();
		if (!a || !b) return { valid: false, message: t("dashboard.enterBothNames") };
		if (a.toLowerCase() === b.toLowerCase()) return { valid: false, message: t("dashboard.namesDiff") };
		return { valid: true, message: "" };
	}, [p1Name, p2Name]);

	const tournamentValidation = useMemo(() => {
		const verifiedCount = tournamentSlots.filter(s => s.verified).length;
		if (verifiedCount !== tournamentSize) {
			return { valid: false, message: `Need ${tournamentSize} verified players (Current: ${verifiedCount})` };
		}
		return { valid: true, message: "" };
	}, [tournamentSlots, tournamentSize]);

	// small helpers for text / button states
	const statusText =
		queueState === "idle"
			? t("dashboard.readyToJoin")
			: queueState === "searching"
				? t("dashboard.waitingForOpponent")
				: t("dashboard.opponentFoundExcl");

	const joinDisabled = queueState === "searching" || queueState === "found";
	const cancelDisabled = queueState === "idle";

	return (
		<>
			{/* HERO PANEL */}
			<div className="glass p-0 rounded-2xl h-full min-h-full overflow-hidden">
				<div className="relative h-full p-6 lg:p-10">
					{/* background layers (grid + gradients) */}
					<div className="absolute inset-0 -z-10 pointer-events-none">
						<div
							className="absolute inset-0"
							style={{
								background:
									"radial-gradient(60% 60% at 70% 30%, rgba(255,255,255,0.16), transparent 60%)," +
									"radial-gradient(50% 50% at 20% 80%, rgba(255,255,255,0.10), transparent 60%)",
							}}
						/>
						<div className="absolute inset-0 bg-linear-to-tr from-black/55 via-black/25 to-transparent" />
						<svg
							className="absolute inset-0 w-full h-full opacity-30"
							viewBox="0 0 1600 900"
							preserveAspectRatio="none"
						>
							<rect
								x="0"
								y="0"
								width="1600"
								height="900"
								fill="none"
								stroke="white"
								strokeOpacity=".12"
							/>
							<rect
								x="80"
								y="80"
								width="1440"
								height="740"
								fill="none"
								stroke="white"
								strokeOpacity=".22"
							/>
							<line
								x1="800"
								y1="80"
								x2="800"
								y2="820"
								stroke="white"
								strokeWidth="3"
								strokeOpacity=".28"
							/>
						</svg>
					</div>

					{/* pong paddles / ball animation */}
					<div aria-hidden="true" className="absolute inset-0 z-0 pointer-events-none">
						<div className="paddle paddle-left" />
						<div className="paddle paddle-right" />
						<div className="ball" />
					</div>

					{/* foreground content */}
					<div className="relative z-10 h-full flex flex-col gap-4 min-w-0">
						<div className="max-w-xl space-y-2">
							<p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-white/70">
								ft_transcendence
								<span className="inline-flex h-px w-10 bg-white/40" />
							</p>
							<h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight">
								{t("dashboard.tagline1")}
								<br className="hidden sm:block" /> {t("dashboard.tagline2")}
							</h2>
							<p className="text-sm sm:text-base text-white/75">
								{t("dashboard.subtext")}
							</p>
						</div>

						{/* mode toggle */}
						<div className="flex flex-wrap items-center gap-3">
							<div className="inline-flex flex-wrap gap-2 bg-white/20 border border-white/30 rounded-full p-1 backdrop-blur-sm">
								{(() => {
									const base =
										"px-4 py-1.5 rounded-full text-sm transition-all duration-300 ease-out cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70";
									return (
										<>
											<button
												type="button"
												onClick={() => updateMode("1v1")}
												aria-pressed={mode === "1v1"}
												className={`${base} ${mode === "1v1"
													? "bg-white/90 text-gray-900 font-semibold shadow scale-[1.03]"
													: "hover:bg-white/25"
													}`}
											>
												1v1
											</button>
											<button
												type="button"
												onClick={() => updateMode("tournament")}
												aria-pressed={mode === "tournament"}
												className={`${base} ${mode === "tournament"
													? "bg-white/90 text-gray-900 font-semibold shadow scale-[1.03]"
													: "hover:bg-white/25"
													}`}
											>
												{t("dashboard.tournament")}
											</button>
											<button
												type="button"
												onClick={() => updateMode("local")}
												aria-pressed={mode === "local"}
												className={`${base} ${mode === "local"
													? "bg-white/90 text-gray-900 font-semibold shadow scale-[1.03]"
													: "hover:bg-white/25"
													}`}
											>
												{t("dashboard.local")}
											</button>
										</>
									);
								})()}
							</div>
						</div>

						<div className="flex-1 min-h-0" />

						{/* bottom row: tagline + primary CTA */}
						<div className="flex items-end justify-between gap-3">
							<div className="text-xs text-white/80 truncate">
								{t("dashboard.quote")}
							</div>

							<div className="flex items-center gap-3">
								<button
									type="button"
									onClick={handlePrimaryClick}
									className="group inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/95 text-gray-900 font-semibold shadow hover:bg-white transition disabled:opacity-70 cursor-pointer"
								>
									<span
										key={mode}
										className="inline-grid place-items-center w-7 h-7 rounded-full bg-gray-900 text-white group-hover:translate-x-0.5 transition-transform duration-300 cta-icon-swap"
									>
										{mode === "1v1" ? (
											<span className="text-[11px] font-bold tracking-wide">
												VS
											</span>
										) : mode === "tournament" ? (
											<Trophy className="w-6 h-6" aria-hidden="true" />
										) : (
											<Gamepad2 className="w-6 h-6" aria-hidden="true" />
										)}
									</span>
									<span className="btn-label">{primaryLabel}</span>
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* MATCHMAKING MODAL (same idea as template.html, but React state-driven) */}
			<div className={`mmodal ${modalOpen ? "open" : ""}`} aria-hidden={!modalOpen}>
				{/* backdrop click closes modal */}
				<div className="mm-backdrop" onClick={closeModal} />

				<div
					role="dialog"
					aria-modal="true"
					aria-labelledby="mmTitle"
					className="mm-panel glass border border-white/30 p-4 sm:p-6"
				>
					{/* header */}
					<header className="mm-head flex items-center justify-between gap-3 pb-3">
						<div className="flex items-center gap-2 min-w-0">
							<div className="w-8 h-8 rounded-full bg-white/25 grid place-items-center border border-white/30 shrink-0">
								<svg
									viewBox="0 0 24 24"
									className="w-5 h-5"
									fill="none"
									stroke="currentColor"
									strokeWidth={2}
								>
									<circle cx="11" cy="11" r="6" />
									<path d="m17 17 4 4" />
								</svg>
							</div>
							<h2 id="mmTitle" className="text-lg sm:text-xl font-semibold truncate">
								{queueState === "found" ? t("dashboard.opponentFound") : t("dashboard.findingOpponent")}
							</h2>
						</div>
						<button
							type="button"
							className="w-9 h-9 rounded-full bg-white/20 border border-white/30 grid place-items-center cursor-pointer"
							aria-label="Close"
							onClick={closeModal}
						>
							<svg
								viewBox="0 0 24 24"
								className="w-5 h-5"
								fill="none"
								stroke="currentColor"
								strokeWidth={2}
							>
								<path d="M6 6l12 12M6 18L18 6" />
							</svg>
						</button>
					</header>

					{/* pong mini-stage */}
					<div className="mm-pong relative mt-2">
						<div className="paddle paddle-left" />
						<div className="paddle paddle-right" />
						<div className="ball" />
						<div
							aria-hidden="true"
							className="absolute left-1/2 top-2 bottom-2 -translate-x-1/2 w-0.5 bg-white/30 rounded-full"
						/>
					</div>

					{/* queue preview: you vs opponent */}
					<div className="mt-3">
						<div className="flex items-center justify-center gap-4 sm:gap-6">
							{/* You */}
							<div className="flex flex-col items-center gap-2">
								<div className="w-16 h-16 rounded-full overflow-hidden border border-white/35 bg-white/20">
									<Avatar
										src=""
										alt="You"
										className="w-full h-full object-cover"
										size={32}
									/>
								</div>
								<div className="text-xs text-white/80">{t("dashboard.you")}</div>
							</div>

							<div className="text-sm font-semibold px-2 py-1 rounded-full bg-white/80 text-gray-900/90 shadow">
								VS
							</div>

							{/* Opponent */}
							<div className="flex flex-col items-center gap-2">
								<div
									className={[
										"w-16 h-16 rounded-full border border-white/35 bg-white/25 grid place-items-center",
										queueState === "searching" ? "animate-pulse" : "",
										queueState === "found"
											? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-white/20"
											: "",
									]
										.filter(Boolean)
										.join(" ")}
								>
									<svg
										viewBox="0 0 24 24"
										className="w-7 h-7 opacity-80"
										fill="none"
										stroke="currentColor"
										strokeWidth={2}
									>
										<circle cx="12" cy="8" r="4" />
										<path d="M4 20a8 8 0 0 1 16 0" />
									</svg>
								</div>
								<div className="text-xs text-white/70">
									{queueState === "found" ? t("dashboard.opponentReady") : t("dashboard.searching")}
								</div>
							</div>
						</div>
					</div>

					{/* status + actions */}
					<div className="mt-4 flex items-center justify-between gap-3">
						<div className="text-sm text-white/85">{statusText}</div>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={handleCancelQueue}
								className="px-3 py-1.5 rounded-full bg-white/15 border border-white/30 hover:bg-white/25 disabled:opacity-60 cursor-pointer"
								disabled={cancelDisabled}
							>
								{t("dashboard.cancel")}
							</button>
							<button
								type="button"
								onClick={handleJoinQueue}
								className="px-4 py-2 rounded-full bg-white/90 text-gray-900 font-semibold shadow hover:bg-white disabled:opacity-60 cursor-pointer"
								disabled={joinDisabled}
							>
								{t("dashboard.joinQueue")}
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* TOURNAMENT SETUP MODAL */}
			<div className={`mmodal ${tournamentModalOpen ? "open" : ""}`} aria-hidden={!tournamentModalOpen}>
				<div className="mm-backdrop" onClick={closeTournamentModal} />
				<div
					role="dialog"
					aria-modal="true"
					aria-labelledby="tournamentTitle"
					className="mm-panel glass border border-white/30 p-4 sm:p-6"
				>
					<header className="mm-head flex items-center justify-between gap-3 pb-3">
						<div className="flex items-center gap-2 min-w-0">
							<div className="w-8 h-8 rounded-full bg-white/25 grid place-items-center border border-white/30 shrink-0">
								<Trophy className="w-5 h-5" />
							</div>
							<h2 id="tournamentTitle" className="text-lg sm:text-xl font-semibold truncate">
								{t("dashboard.createTournament")}
							</h2>
						</div>
						<button
							type="button"
							className="w-9 h-9 rounded-full bg-white/20 border border-white/30 grid place-items-center cursor-pointer"
							aria-label="Close"
							onClick={closeTournamentModal}
						>
							<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
								<path d="M6 6l12 12M6 18L18 6" />
							</svg>
						</button>
					</header>

					<div className="space-y-4">
						<label className="flex flex-col gap-1 text-sm text-white/80">
							<span>{t("dashboard.tournamentName")}</span>
							<input
								type="text"
								value={tournamentName}
								onChange={e => setTournamentName(e.target.value)}
								className="px-3 py-2 rounded-lg bg-white/10 border border-white/25 text-white placeholder:text-white/50"
								placeholder="e.g. Neon Cup 2024"
							/>
						</label>

						<div className="flex flex-col gap-1 text-sm text-white/80 max-w-xs">
							<span>{t("dashboard.bracketSize")}</span>
							<div className="px-3 py-2 rounded-lg bg-white/10 border border-white/25 text-white opacity-70">
								{/* Assuming fixed number, or translate 'players' suffix */}
								4 {t("dashboard.players")}
							</div>
						</div>

						<div className="bg-white/10 border border-white/20 rounded-lg p-3">
							<p className="font-semibold mb-2 text-sm text-white/85">
								{t("dashboard.playerAliases")} ({tournamentSlots.filter(s => s.verified).length}/{tournamentSize})
							</p>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
								{tournamentSlots.map((slot, idx) => {
									const isEditing = activeSlotIdx === idx;

									if (isEditing) {
										return (
											<div key={`slot-edit-${idx}`} className="col-span-1 sm:col-span-2 bg-white/5 border border-white/20 rounded-lg p-3 flex flex-col gap-2">
												<p className="text-xs uppercase tracking-wider text-white/60">
													{slot.isSelf ? "Edit Your Alias" : `Add Player to Slot ${idx + 1}`}
												</p>
												<div className="flex flex-col gap-1">
													<input
														type="text"
														placeholder="Alias (optional)"
														value={authAlias}
														onChange={e => setAuthAlias(e.target.value)}
														className="px-3 py-2 rounded bg-black/40 border border-white/10 text-white text-sm"
														autoFocus
													/>
												</div>

												{!slot.isSelf && (
													<>
														<input
															type="text"
															placeholder="Nickname (required)"
															value={authNickname}
															onChange={e => setAuthNickname(e.target.value)}
															className="px-3 py-2 rounded bg-black/40 border border-white/10 text-white text-sm"
														/>
														<input
															type="password"
															placeholder="Password"
															value={authPassword}
															onChange={e => setAuthPassword(e.target.value)}
															className="px-3 py-2 rounded bg-black/40 border border-white/10 text-white text-sm"
														/>
													</>
												)}

												{authError && <p className="text-xs text-rose-400">{authError}</p>}
												<div className="flex justify-end gap-2 mt-1">
													<button onClick={cancelAuth} className="text-xs px-2 py-1 text-white/60 hover:text-white cursor-pointer">Cancel</button>
													{slot.isSelf ? (
														<button
															onClick={saveSelfAlias}
															className="text-xs px-3 py-1 bg-indigo-500/80 hover:bg-indigo-500 text-white rounded font-medium cursor-pointer"
														>
															Save Alias
														</button>
													) : (
														<button
															onClick={handleVerifyPlayer}
															className="text-xs px-3 py-1 bg-emerald-500/80 hover:bg-emerald-500 text-white rounded font-medium flex items-center gap-1 cursor-pointer"
															disabled={isVerifying}
														>
															{isVerifying ? "Verifying..." : "Verify & Add"}
														</button>
													)}
												</div>
											</div>
										);
									}

									return (
										<div
											key={`slot-${idx}`}
											className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${slot.verified
												? "bg-emerald-500/10 border-emerald-500/30"
												: "bg-white/5 border-white/10 border-dashed hover:bg-white/10 cursor-pointer"
												}`}
											onClick={() => (slot.isSelf || !slot.verified) && openAuthForSlot(idx)}
										>
											{slot.verified ? (
												<>
													<Avatar
														src={slot.avatar || ""}
														alt={slot.nickname}
														size={24}
														className="w-6 h-6 rounded-full border border-white/20"
													/>
													<div className="flex flex-col min-w-0 flex-1">
														<span className="text-sm font-medium text-white truncate">{slot.alias || slot.nickname}</span>
														{slot.alias && slot.alias !== slot.nickname && (
															<span className="text-[10px] text-white/50 truncate">@{slot.nickname}</span>
														)}
													</div>
													{slot.isSelf ? (
														<span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white/70">YOU</span>
													) : (
														<button
															onClick={(e) => { e.stopPropagation(); removePlayer(idx); }}
															className="text-white/40 hover:text-rose-400 p-1"
														>
															<Trash2 className="w-4 h-4" />
														</button>
													)}
												</>
											) : (
												<>
													<div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 grid place-items-center">
														<UserPlus className="w-3 h-3 text-white/40" />
													</div>
													<span className="text-sm text-white/40 italic">Empty Slot {idx + 1}</span>
												</>
											)}
										</div>
									);
								})}
							</div>

							{!tournamentValidation.valid && (
								<p className="text-xs text-rose-300 mt-3 pt-2 border-t border-white/10">{tournamentValidation.message}</p>
							)}
						</div>
					</div>

					<div className="mt-5 flex items-center justify-end gap-2">
						<button
							type="button"
							onClick={closeTournamentModal}
							className="px-3 py-1.5 rounded-full bg-white/15 border border-white/25 hover:bg-white/25 cursor-pointer"
						>
							{t("dashboard.cancel")}
						</button>
						<button
							type="button"
							onClick={startTournament}
							className="px-4 py-2 rounded-full bg-white/90 text-gray-900 font-semibold shadow hover:bg-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
							disabled={!tournamentValidation.valid}
						>
							{t("dashboard.startTournament")}
						</button>
					</div>
				</div>
			</div>

			{/* LOCAL / OFFLINE SETUP MODAL */}
			<div className={`mmodal ${localModalOpen ? "open" : ""}`} aria-hidden={!localModalOpen}>
				<div className="mm-backdrop" onClick={closeLocalModal} />
				<div
					role="dialog"
					aria-modal="true"
					aria-labelledby="localTitle"
					className="mm-panel glass border border-white/30 p-4 sm:p-6"
				>
					<header className="mm-head flex items-center justify-between gap-3 pb-3">
						<div className="flex items-center gap-2 min-w-0">
							<div className="w-8 h-8 rounded-full bg-white/25 grid place-items-center border border-white/30 shrink-0">
								<Home className="w-5 h-5" />
							</div>
							<h2 id="localTitle" className="text-lg sm:text-xl font-semibold truncate">
								{t("dashboard.localMode")}
							</h2>
						</div>
						<button
							type="button"
							className="w-9 h-9 rounded-full bg-white/20 border border-white/30 grid place-items-center cursor-pointer"
							aria-label="Close"
							onClick={closeLocalModal}
						>
							<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
								<path d="M6 6l12 12M6 18L18 6" />
							</svg>
						</button>
					</header>

					<div className="space-y-4">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<label className="flex flex-col gap-1 text-sm text-white/80">
								<span>{t("dashboard.p1Name")}</span>
								<input
									type="text"
									value={p1Name}
									onChange={e => setP1Name(e.target.value)}
									className="px-3 py-2 rounded-lg bg-white/10 border border-white/25 text-white placeholder:text-white/50 opacity-50 cursor-not-allowed"
									placeholder="Player 1"
									disabled
								/>
							</label>
							<label className="flex flex-col gap-1 text-sm text-white/80">
								<span>{t("dashboard.p2Name")}</span>
								<input
									type="text"
									value={p2Name}
									onChange={e => setP2Name(e.target.value)}
									className="px-3 py-2 rounded-lg bg-white/10 border border-white/25 text-white placeholder:text-white/50"
									placeholder="Player 2"
								/>
							</label>
						</div>

						<label className="flex flex-col gap-1 text-sm text-white/80 max-w-xs">
							<span>{t("dashboard.bestOf")}</span>
							<select
								value={bestOf}
								onChange={e => setBestOf(Number(e.target.value) as 3 | 5 | 7)}
								className="px-3 py-2 rounded-lg bg-white/10 border border-white/25 text-white cursor-pointer"
							>
								<option value={3}>3</option>
								<option value={5}>5</option>
								<option value={7}>7</option>
							</select>
						</label>

						<div className="text-sm text-white/75 bg-white/10 border border-white/20 rounded-lg p-3">
							<p className="font-semibold mb-1">{t("dashboard.controlScheme")}</p>
							<ul className="space-y-1">
								<li>{t("dashboard.p1Controls")}</li>
								<li>{t("dashboard.p2Controls")}</li>
							</ul>
						</div>
						{!localValidation.valid && (
							<p className="text-xs text-rose-300 mt-1">{localValidation.message}</p>
						)}
					</div>

					<div className="mt-5 flex items-center justify-end gap-2">
						<button
							type="button"
							onClick={closeLocalModal}
							className="px-3 py-1.5 rounded-full bg-white/15 border border-white/25 hover:bg-white/25 cursor-pointer"
						>
							{t("dashboard.cancel")}
						</button>
						<button
							type="button"
							onClick={startLocalGame}
							className="px-4 py-2 rounded-full bg-white/90 text-gray-900 font-semibold shadow hover:bg-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
							disabled={!localValidation.valid}
						>
							{t("dashboard.startGame")}
						</button>
					</div>
				</div>
			</div>


			<LoadingOverlay isVisible={isRedirecting} />
		</>
	);
}
