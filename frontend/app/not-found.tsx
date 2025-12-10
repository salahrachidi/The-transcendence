"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Oxanium } from "next/font/google";
import styles from "./err/not-found.module.css";
import { checkAuth } from "./utils/auth";
import { useLanguage } from "@/app/context/LanguageContext";

const oxanium = Oxanium({
	subsets: ["latin"],
	weight: ["400", "600", "700"],
	variable: "--font-display",
});

export default function NotFound() {
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const btnRef = useRef<HTMLButtonElement | null>(null);
	const [canPlay, setCanPlay] = useState(false);
	const [isClient, setIsClient] = useState(false);
	const [isPlaying, setIsPlaying] = useState(false);
	const [homeLink, setHomeLink] = useState("/login"); // Default to login
	const { t } = useLanguage();

	useEffect(() => {
		setIsClient(true);
		checkAuth().then(isLoggedIn => {
			setHomeLink(isLoggedIn ? "/dashboard" : "/login");
		});
	}, []);

	const pauseVideo = useCallback(() => {
		const video = videoRef.current;
		const btn = btnRef.current;
		if (video) {
			try {
				video.pause();
			} catch { }
		}
		if (btn) btn.textContent = `▶ ${t("errors.404.play")}`;
		setIsPlaying(false);
	}, [t]);

	const playVideo = useCallback(
		async (fromStart = false) => {
			const video = videoRef.current;
			const btn = btnRef.current;
			if (!video) return;

			if (fromStart) {
				try {
					video.currentTime = 0;
				} catch { }
			}

			video.muted = false;
			await video.play().catch(() => { });
			const playingNow = !video.paused && !video.ended;
			if (btn) btn.textContent = playingNow ? `⏸ ${t("errors.404.pause")}` : `▶ ${t("errors.404.play")}`;
			setIsPlaying(playingNow);
		},
		[t]
	);

	useEffect(() => {
		if (!isClient) return;

		const handleKey = (e: KeyboardEvent) => {
			const k = e.key.toLowerCase();
			if (k === "r") {
				void playVideo(true);
				return;
			}
			if (k === " ") {
				e.preventDefault();
				const video = videoRef.current;
				const playingNow = !!video && !video.paused && !video.ended;
				if (playingNow) {
					pauseVideo();
				} else {
					void playVideo(false);
				}
				return;
			}
			if (k === "h") window.location.href = "/";
			if (k === "b") window.history.back();
		};

		const video = videoRef.current;
		if (video) {
			try {
				video.pause();
				video.currentTime = 0;
			} catch { }
		}
		pauseVideo();

		document.addEventListener("keydown", handleKey);
		return () => {
			document.removeEventListener("keydown", handleKey);
		};
	}, [isClient, pauseVideo, playVideo]);

	return (
		<main role="main" className={`${styles.wrap} ${oxanium.variable} ${oxanium.className}`}>
			<section className={styles.card} aria-labelledby="title">
				{/* background video */}
				{isClient ? (
					<video
						ref={videoRef}
						muted
						loop
						playsInline
						preload="metadata"
						poster="/bg.webp"
						id="rickVideo"
						className={`${styles.rickBg}${isPlaying ? ` ${styles.rickBgPlaying}` : ""}`}
						onCanPlay={() => setCanPlay(true)}
						onError={() => {
							console.warn("Video failed to load"); // DEBUG
							setCanPlay(false);
							pauseVideo();
						}}
					>
						<source src="/assets/404.webm" type="video/webm" />
						<source src="/assets/404.mp4" type="video/mp4" />
					</video>
				) : null}

				<div className={`${styles.overlay}${isPlaying ? ` ${styles.overlayPlaying}` : ""}`} />

				{/* play/pause */}
				<button
					ref={btnRef}
					id="soundChip"
					className={styles.btn}
					style={{ position: "absolute", top: 12, right: 12, zIndex: 3 }}
					disabled={!canPlay}
					onClick={() => {
						const v = videoRef.current;
						if (!v) return;
						const playingNow = !v.paused && !v.ended;
						if (playingNow) {
							pauseVideo();
						} else {
							void playVideo(false);
						}
					}}
				>
					▶ {t("errors.404.play")}
				</button>

				<header>
					<h1 id="title" className={styles.title}>
						{t("errors.404.title")}
						<span className={styles.layers} aria-hidden="true"></span>
					</h1>
					<p className={styles.subtitle}>{t("errors.404.subtitle")}</p>
				</header>

				<div className={styles.actions}>
					<Link href={homeLink} className={`${styles.btn} ${styles.primary}`}>{t("errors.404.goHome")}</Link>
					<button className={styles.btn} onClick={() => window.history.back()}>
						{t("errors.404.goBack")}
					</button>
				</div>
			</section>
		</main>
	);
}