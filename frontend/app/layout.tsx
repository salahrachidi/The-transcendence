// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: {
		default: "ft_transcendence",
		template: "%s — ft_transcendence",
	},
	description: "Gameplay, chat, matches, and stats.",
};

import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { AccessibilityProvider } from "./context/AccessibilityContext";

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en">
			<body>
				<LanguageProvider>
					<AccessibilityProvider>
						<AuthProvider>{children}</AuthProvider>
					</AccessibilityProvider>
				</LanguageProvider>
			</body>
		</html>
	);
}
