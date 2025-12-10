"use client";

import { useState, useRef, useEffect } from "react";
import { Eye, Type, Minus, Plus, Settings2 } from "lucide-react";
import { useAccessibility } from "../context/AccessibilityContext";

/**
 * A dropdown menu for accessibility settings.
 * Can be used in Auth pages (round button) or Navbar.
 */
type AccessibilityMenuProps = {
	variant?: "round" | "navbar"; // 'round' for auth pages, 'navbar' for main nav
};

export default function AccessibilityMenu({ variant = "round" }: AccessibilityMenuProps) {
	const { highContrast, setHighContrast, fontSize, setFontSize } = useAccessibility();
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
				aria-label="Accessibility settings"
				aria-expanded={isOpen}
				className={
					variant === "round"
						? "cursor-pointer w-[38px] h-[38px] grid place-items-center rounded-full border border-white/30 bg-white/15 hover:ring-2 hover:ring-white/20 transition-all text-white relative"
						: "cursor-pointer w-9 h-9 rounded-full bg-white/20 border border-white/30 grid place-items-center text-white hover:bg-white/30 transition-colors"
				}
			>
				{variant === "round" ? (
					<Settings2 className="w-5 h-5 opacity-90" />
				) : (
					<Eye className="w-5 h-5" />
				)}
			</button>

			{isOpen && (
				<div
					className="absolute right-0 top-[calc(100%+8px)] w-48 z-50 rounded-xl border border-white/20 bg-[#0a0a12]/95 backdrop-blur-xl shadow-2xl p-3 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-100 origin-top-right text-white"
					role="dialog"
					aria-label="Accessibility controls"
				>
					{/* Header */}
					<div className="flex items-center gap-2 pb-2 border-b border-white/10">
						<Eye className="w-4 h-4 text-white/50" />
						<span className="text-xs font-bold text-white/50 uppercase tracking-wider">
							Accessibility
						</span>
					</div>

					{/* High Contrast Toggle */}
					<div className="flex items-center justify-between">
						<span className="text-sm font-medium">High Contrast</span>
						<button
							type="button"
							onClick={() => setHighContrast(!highContrast)}
							aria-checked={highContrast}
							role="switch"
							className={`cursor-pointer w-10 h-5 rounded-full relative transition-colors ${highContrast ? "bg-[#ff3fb3]" : "bg-white/20"
								}`}
						>
							<span
								className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${highContrast ? "translate-x-5" : "translate-x-0"
									}`}
							/>
						</button>
					</div>

					{/* Font Size Control */}
					<div className="flex flex-col gap-2">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">Text Size</span>
							<span className="text-xs text-white/50">
								{Math.round(fontSize * 100)}%
							</span>
						</div>

						<div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
							<button
								type="button"
								onClick={() => setFontSize(Math.max(1, fontSize - 0.25))}
								disabled={fontSize <= 1}
								className="cursor-pointer flex-1 p-1 hover:bg-white/10 rounded disabled:opacity-30 disabled:hover:bg-transparent grid place-items-center"
								aria-label="Decrease text size"
							>
								<Minus className="w-4 h-4" />
							</button>

							<div className="w-px h-4 bg-white/10" />

							<button
								type="button"
								onClick={() => setFontSize(Math.min(1.5, fontSize + 0.25))}
								disabled={fontSize >= 1.5}
								className="cursor-pointer flex-1 p-1 hover:bg-white/10 rounded disabled:opacity-30 disabled:hover:bg-transparent grid place-items-center"
								aria-label="Increase text size"
							>
								<Plus className="w-4 h-4" />
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
