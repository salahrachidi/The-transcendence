"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type AccessibilityContextType = {
	highContrast: boolean;
	setHighContrast: (enabled: boolean) => void;
	fontSize: number; // 1 | 1.25 | 1.5
	setFontSize: (scale: number) => void;
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
	const [highContrast, setHighContrast] = useState(false);
	const [fontSize, setFontSize] = useState(1);
	const [isLoaded, setIsLoaded] = useState(false);

	// Load from storage
	useEffect(() => {
		const storedHC = localStorage.getItem("a11y-hc") === "true";
		const storedFS = parseFloat(localStorage.getItem("a11y-fs") || "1");

		if (storedHC) setHighContrast(true);
		if ([1, 1.25, 1.5].includes(storedFS)) setFontSize(storedFS);
		setIsLoaded(true);
	}, []);

	// Apply effects
	useEffect(() => {
		if (!isLoaded) return;
		const root = document.documentElement;

		// Contrast
		if (highContrast) {
			root.classList.add("a11y-hc");
			localStorage.setItem("a11y-hc", "true");
		} else {
			root.classList.remove("a11y-hc");
			localStorage.removeItem("a11y-hc");
		}

		// Font size
		root.classList.remove("text-lg", "text-xl");
		if (fontSize === 1.25) root.classList.add("text-lg");
		if (fontSize === 1.5) root.classList.add("text-xl");
		localStorage.setItem("a11y-fs", String(fontSize));

	}, [highContrast, fontSize, isLoaded]);

	return (
		<AccessibilityContext.Provider
			value={{
				highContrast,
				setHighContrast,
				fontSize,
				setFontSize,
			}}
		>
			{children}
		</AccessibilityContext.Provider>
	);
}

export function useAccessibility() {
	const context = useContext(AccessibilityContext);
	if (!context) {
		throw new Error("useAccessibility must be used within AccessibilityProvider");
	}
	return context;
}
