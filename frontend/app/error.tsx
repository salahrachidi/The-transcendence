// app/error.tsx
"use client";

import * as React from "react";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import styles from "./err/error.module.css";

import { Oxanium } from "next/font/google";
import { checkAuth } from "./utils/auth";
import { useLanguage } from "@/app/context/LanguageContext";

const oxanium = Oxanium({
	subsets: ["latin"],
	weight: ["400", "600", "700"],
	variable: "--font-display",
});

export default function GlobalError({
	error,
	reset, // Next.js retry function (re-renders the segment)
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	const router = useRouter();
	const pathname = usePathname();
	const { t } = useLanguage();

	const videoRef = React.useRef<HTMLVideoElement | null>(null);
	const [canPlay, setCanPlay] = React.useState(false);
	const [isClient, setIsClient] = React.useState(false);
	const [isFiring, setIsFiring] = React.useState(false);
	const [time, setTime] = React.useState("");
	const [homeLink, setHomeLink] = useState("/login"); // Default to login

	const pauseVideo = useCallback(() => {
		const vid = videoRef.current;
		if (!vid) return;
		try {
			vid.pause();
			vid.currentTime = 0;
		} catch { }
		setIsFiring(false);
	}, []);

	const playVideo = useCallback(async (fromStart = false) => {
		const vid = videoRef.current;
		if (!vid) return;

		if (fromStart) {
			try {
				vid.currentTime = 0;
			} catch { }
		}

		vid.muted = false;
		await vid.play().catch(() => { });
		setIsFiring(true);
	}, []);

	const togglePlayback = useCallback(
		async (fromStart = false) => {
			const vid = videoRef.current;
			if (!vid || !canPlay) return;
			const playing = !vid.paused && !vid.ended;
			if (playing) {
				pauseVideo();
			} else {
				await playVideo(fromStart);
			}
		},
		[canPlay, pauseVideo, playVideo]
	);

	const fireSomeone = useCallback(async () => {
		await togglePlayback(true);
	}, [togglePlayback]);

	// lightweight “diagnostics”
	const reqId = useMemo(
		() => (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)),
		[]
	);
	useEffect(() => {
		if (!time) return;
		// fetch("/api/log", { method: "POST", body: JSON.stringify({ message: error.message, digest: error.digest, path: pathname, reqId, time }) })
		//   .catch(() => {});
		// Helpful while developing:
		// eslint-disable-next-line no-console
		console.error("App error boundary:", { error, digest: error.digest, path: pathname, reqId, time }); // DEBUG
	}, [error, pathname, reqId, time]);

	useEffect(() => {
		setIsClient(true);
		checkAuth().then(isLoggedIn => {
			setHomeLink(isLoggedIn ? "/dashboard" : "/login");
		});
	}, []);

	useEffect(() => {
		if (!isClient) return;
		if (!time) setTime(new Date().toLocaleString());
	}, [isClient, time]);

	useEffect(() => {
		if (!isClient) return;

		const onKey = (e: KeyboardEvent) => {
			const k = e.key.toLowerCase();
			if (k === "r") {
				reset();
				return;
			}
			if (k === "h") {
				router.push(homeLink);
				return;
			}
			if (k === " ") {
				e.preventDefault();
				void togglePlayback(false);
			}
		};

		document.addEventListener("keydown", onKey);

		const vid = videoRef.current;
		let handleEnded: (() => void) | undefined;
		if (vid) {
			pauseVideo();

			handleEnded = () => pauseVideo();
			vid.addEventListener("ended", handleEnded);
		}

		return () => {
			document.removeEventListener("keydown", onKey);
			if (vid && handleEnded) {
				vid.removeEventListener("ended", handleEnded);
			}
		};
	}, [isClient, pauseVideo, reset, router, togglePlayback, homeLink]);

	return (
		<main
			className={`${styles.wrap} ${oxanium.variable} ${oxanium.className}`}
			role="main"
		>
			<section className={styles.card} aria-labelledby="title">
				{/* Background video (Monsters vs Aliens "Fire somebody!" vibe) */}
				{isClient ? (
					<video
						ref={videoRef}
						className={`${styles.errBgVideo}${isFiring ? ` ${styles.errBgVideoPlaying}` : ""}`}
						playsInline
						loop
						muted
						preload="metadata"
						poster="/bg.webp"
						onCanPlay={() => setCanPlay(true)}
						onError={() => {
							console.warn("Error video failed to load"); // DEBUG
							setCanPlay(false);
							pauseVideo();
						}}
					>
						<source src="/assets/505.webm" type="video/webm" />
						<source src="/assets/505.mp4" type="video/mp4" />
					</video>
				) : null}
				<div className={`${styles.overlay}${isFiring ? ` ${styles.overlayPlaying}` : ""}`}></div>
				<h1 id="title" className={styles.title}>
					{t("errors.500.title")}
					<span className={styles.layers} aria-hidden="true"></span>
				</h1>
				<p className={styles.subtitle}>{t("errors.500.subtitle")}</p>

				<div className={styles.teamActions}>
					<button
						className={`${styles.btn} ${styles.fire}`}
						disabled={!canPlay}
						onClick={() => void fireSomeone()}
					>
						{isFiring ? `⏸ ${t("errors.500.notFiring")}` : `🔥 ${t("errors.500.fire")}`}
					</button>
				</div>

				<div className={styles.diag} role="status" aria-live="polite">
					<div><strong>{t("errors.500.time")}:</strong> <span>{time}</span></div>

					{/* The following fields are commented out to avoid exposing sensitive info in production.
              Uncomment when you explicitly need them for debugging: */}

					{/*
          <div><strong>Request ID:</strong> <span>{reqId}</span></div>
          <div><strong>Path:</strong> <span>{pathname}</span></div>
          */}
					{/*
          {error?.digest ? (
            <div><strong>Digest:</strong> <span>{error.digest}</span></div>
          ) : null}
          */}
				</div>

				<div className={styles.actions} role="group" aria-label="Primary actions">
					<button className={`${styles.btn} ${styles.primary}`} onClick={() => reset()}>{t("errors.500.tryAgain")}</button>
					<button className={styles.btn} onClick={() => router.push(homeLink)}>{t("errors.500.goHome")}</button>
				</div>

				<p className={styles.hint}>
					{t("errors.500.hint")}
				</p>
			</section>
		</main>
	);
}
