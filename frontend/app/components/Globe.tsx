"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Globe.module.css";

export default function Globe({ className }: { className?: string }) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [scale, setScale] = useState(1);

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;

		const ro = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const { width } = entry.contentRect;
				// If width is 0 (hidden or initial), don't set scale to 0 to avoid division by zero or invisible
				if (width > 0) {
					// Base size is 300px + some padding for glow/overflow
					setScale(width / 350);
				}
			}
		});

		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	return (
		<div
			ref={containerRef}
			className={`${className || ""} flex items-center justify-center overflow-hidden relative`}
			aria-hidden="true"
			style={{ minWidth: 0, minHeight: 0 }} /* Allow shrinking in flex/grid contexts */
		>
			<div
				className={styles.sphere}
				style={{
					transform: `scale(${scale})`,
					transformOrigin: "center center"
				}}
			>
				{/* Meridians */}
				{Array.from({ length: 36 }).map((_, i) => (
					<div key={`meridian-${i}`} className={styles.meridian}></div>
				))}

				{/* Latitudes 37-48 */}
				{Array.from({ length: 12 }).map((_, i) => (
					<div key={`latitude-${i}`} className={styles.latitude}></div>
				))}

				{/* Axes */}
				<div className={styles.axis}></div>
				<div className={styles.axis}></div>
			</div>
		</div>
	);
}
