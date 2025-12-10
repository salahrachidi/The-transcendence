// app/(auth)/layout.tsx
import { Oxanium } from "next/font/google";
// import "../globals.css";

const oxanium = Oxanium({
	subsets: ["latin"],
	weight: ["400", "600", "700"],
	variable: "--font-display",
});

export default function AuthLayout({ children }: { children: React.ReactNode }) {
	return (
		<main
			id="auth-layout"
			className={`${oxanium.variable} auth-root min-h-screen flex items-center justify-center`}
		>
			{children}
		</main>
	);
}