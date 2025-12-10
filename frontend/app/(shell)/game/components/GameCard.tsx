// app/(shell)/game/GameCard.tsx
"use client";

import { useEffect, useRef } from "react";

type Props = { children: React.ReactNode; className?: string };

export default function GameCard({ children, className = "" }: Props) {
	const ref = useRef<HTMLDivElement | null>(null);

	// Removed JS height calculation in favor of CSS for stability
	// Top offset (approx): 32px (pt-8) + 64px (navbar) + 24px (mt-6) = 120px
	// Bottom padding: 40px (pb-10)
	// Total reserved: 160px. Using 170px for safety/gap.

	return (
		<div
			ref={ref}
			className={`glass card-radius overflow-hidden flex flex-col ${className}`}
			style={{ height: "calc(105vh - 170px)", minHeight: "600px" }}
		>
			{children}
		</div>
	);
}