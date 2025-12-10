"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { en, Translations } from "../locales/en";
import { fr } from "../locales/fr";
import { ar } from "../locales/ar";

type Language = "EN" | "FR" | "AR";

type LanguageContextType = {
	language: Language;
	setLanguage: (lang: Language) => void;
	t: (key: string) => string;
	dir: "ltr" | "rtl";
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const dictionaries: Record<Language, Translations> = {
	EN: en,
	FR: fr,
	AR: ar,
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
	const [language, setLanguage] = useState<Language>("EN");
	const [isLoaded, setIsLoaded] = useState(false);

	// Load from local storage on mount
	useEffect(() => {
		const storedLang = localStorage.getItem("app-language") as Language;
		if (storedLang && ["EN", "FR", "AR"].includes(storedLang)) {
			setLanguage(storedLang);
		}
		setIsLoaded(true);
	}, []);

	// Save to local storage on change
	const [isTransitioning, setIsTransitioning] = useState(false);

	const handleSetLanguage = (lang: Language) => {
		if (lang === language) return;
		setIsTransitioning(true);
		setTimeout(() => {
			setLanguage(lang);
			localStorage.setItem("app-language", lang);
			setIsTransitioning(false);
		}, 300);
	};

	const t = (path: string): string => {
		const keys = path.split(".");
		let current: any = dictionaries[language];
		for (const key of keys) {
			if (current[key] === undefined) {
				console.warn(`Missing translation for key: ${path} in language: ${language}`);
				return path; // Fallback to key
			}
			current = current[key];
		}
		return current as string;
	};

	// const dir = language === "AR" ? "rtl" : "ltr";
	const dir = "ltr";

	return (
		<LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t, dir }}>
			<div
				dir={dir}
				className={`min-h-screen transition-opacity duration-300 ease-in-out ${isTransitioning ? "opacity-0" : "opacity-100"
					}`}
			>
				{children}
			</div>
		</LanguageContext.Provider>
	);
}

export function useLanguage() {
	const context = useContext(LanguageContext);
	if (context === undefined) {
		throw new Error("useLanguage must be used within a LanguageProvider");
	}
	return context;
}
