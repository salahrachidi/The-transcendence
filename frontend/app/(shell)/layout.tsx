"use client";

import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import PageTransition from "../components/PageTransition";
import { GameSocketProvider } from "../context/GameSocketContext";
import { useAuth } from "../context/AuthContext";
import "./shell.css";
import { Oxanium } from "next/font/google";

const oxanium = Oxanium({
	subsets: ["latin"],
	weight: ["400", "600", "700"],
	variable: "--font-display",
});

export default function ShellLayout({ children }: { children: React.ReactNode }) {
	const [theme, setTheme] = useState<"glass" | "dark-neon">("glass");
	const { loading } = useAuth();

	useEffect(() => {
		const html = document.documentElement;
		const saved = localStorage.getItem("themeMode");
		const supportsGlass = CSS.supports("backdrop-filter", "blur(1px)") || CSS.supports("-webkit-backdrop-filter", "blur(1px)");

		if (saved === "black" || (!supportsGlass && !saved)) {
			setTheme("dark-neon");
			html.classList.add("no-glass", "neon");
			html.classList.remove("has-glass");
		} else {
			setTheme("glass");
			html.classList.add("has-glass");
			html.classList.remove("no-glass", "neon");
		}
	}, []);

	const toggleTheme = () => {
		setTheme(prev => {
			const next = prev === "glass" ? "dark-neon" : "glass";
			const html = document.documentElement;
			if (next === "dark-neon") {
				html.classList.add("no-glass", "neon");
				html.classList.remove("has-glass");
				localStorage.setItem("themeMode", "black");
			} else {
				html.classList.remove("no-glass", "neon");
				html.classList.add("has-glass");
				localStorage.setItem("themeMode", "glass");
			}
			return next;
		});
	};

	if (loading) {
		return <div className="min-h-screen flex items-center justify-center bg-[#070b14] text-white">Loading...</div>;
	}

	const baseShell = "min-h-screen px-4 md:px-6 2xl:px-10 pt-8 pb-10";

	return (
		<GameSocketProvider>
			<section
				id="shell-root"
				className={`${oxanium.variable} ${theme === "glass"
					? `theme-glass ${baseShell}`
					: `theme-dark-neon ${baseShell}`
					}`}
			>
				{/* Preload background for instant rendering */}
				<link rel="preload" href="/bg.webp" as="image" />

				{/* Fixed background layer (like #bg-layer in the HTML) */}
				<div id="bg-layer" className="fixed inset-0 -z-10 pointer-events-none" />

				{/* subtle grid background */}
				<div className="scene" aria-hidden="true">
					<div className="shell-bg-grid" />
				</div>

				{/* Shared navbar for all (shell) pages */}
				<Navbar theme={theme} onToggleTheme={toggleTheme} />

				{/* Shared main container for all (shell) pages */}
				<main className="mx-auto mt-6 w-full max-w-[min(2100px,92vw)] min-[2560px]:max-w-[2200px]">
					<PageTransition>{children}</PageTransition>
				</main>
			</section>
		</GameSocketProvider>
	);
}