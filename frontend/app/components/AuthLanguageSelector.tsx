"use client";

import { useState, useRef, useEffect } from "react";
import { Languages } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

/**
 * A standalone language switcher for Auth pages (Login, Register, 2FA).
 * Styles mimic the circular glass buttons used in those pages (e.g. #themeToggle).
 */
export default function AuthLanguageSelector() {
	const { language: currentLang, setLanguage } = useLanguage();
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const toggle = () => setIsOpen((prev) => !prev);
	const close = () => setIsOpen(false);

	// Close on click outside
	useEffect(() => {
		if (!isOpen) return;
		const handleOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				close();
			}
		};
		document.addEventListener("mousedown", handleOutside);
		return () => document.removeEventListener("mousedown", handleOutside);
	}, [isOpen]);

	return (
		<div className="relative" ref={containerRef}>
			<button
				type="button"
				onClick={toggle}
				aria-label="Change language"
				// Mimic #themeToggle style from login.css:
				// w-[38px] h-[38px] grid place-items-center rounded-full border border-white/30 bg-white/14
				// hover:ring-2ring-white/12 (using box-shadow in css but ring here for tailwind simplicity)
				className="cursor-pointer w-[38px] h-[38px] grid place-items-center rounded-full border border-white/30 bg-white/15 hover:ring-2 hover:ring-white/20 transition-all text-white relative"
			>
				<Languages className="w-5 h-5 opacity-90" />
				<span className="absolute -bottom-1 -right-1 text-[9px] font-bold bg-black/60 text-white px-1 rounded shadow-sm border border-white/10">
					{currentLang}
				</span>
			</button>

			{isOpen && (
				<div className="absolute right-0 top-[calc(100%+8px)] w-32 z-50 rounded-xl border border-white/20 bg-[#0a0a12]/90 backdrop-blur-md shadow-2xl p-1 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
					{/* Header-ish label */}
					<div className="px-3 py-2 text-xs font-bold text-white/50 uppercase tracking-wider border-b border-white/10 mb-1">
						Language
					</div>
					{(["EN", "FR", "AR"] as const).map((lang) => (
						<button
							key={lang}
							type="button"
							onClick={() => {
								setLanguage(lang);
								close();
							}}
							className={`cursor-pointer text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between group ${currentLang === lang
								? "bg-white/15 text-white font-medium"
								: "text-white/70 hover:bg-white/10 hover:text-white"
								}`}
						>
							<span>
								{lang === "EN" && "English"}
								{lang === "FR" && "Français"}
								{lang === "AR" && "العربية"}
							</span>
							{currentLang === lang && (
								<div className="w-1.5 h-1.5 rounded-full bg-[#ff3fb3] shadow-[0_0_8px_#ff3fb3]" />
							)}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
