"use client";

import { useState, useEffect } from "react";
import { User } from "lucide-react";

type AvatarProps = {
	src?: string;
	alt?: string;
	className?: string;
	size?: number; // size prop for the fallback icon scaling
};

export default function Avatar({ src, alt, className = "", size = 24 }: AvatarProps) {
	const [error, setError] = useState(false);

	// Reset error state if src changes
	useEffect(() => {
		setError(false);
	}, [src]);

	if (!src || error) {
		return (
			<div
				className={`flex items-center justify-center bg-white/10 text-white/50 ${className}`}
				aria-label={alt || "User avatar"}
			>
				<User size={size} />
			</div>
		);
	}

	return (
		<img
			src={src}
			alt={alt || "User avatar"}
			className={className}
			onError={() => setError(true)}
		/>
	);
}
