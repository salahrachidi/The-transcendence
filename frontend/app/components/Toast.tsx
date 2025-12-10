"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export type ToastStatus = "idle" | "loading" | "success" | "error";

type ToastProps = {
	status: ToastStatus;
	message: string | null;
	/**  custom position override */
	positionClassName?: string;
};

const Toast: React.FC<ToastProps> = ({ status, message, positionClassName }) => {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (status !== "idle" && message) {
			setVisible(true);
		} else {
			setVisible(false);
		}
	}, [status, message]);

	if (!visible && status === "idle") return null;

	const wrapperClass = positionClassName ?? "fixed top-24 right-6 z-[100]";

	// Base glass effect
	const glassBase = "backdrop-blur-xl bg-white/5 border shadow-2xl";

	const statusStyles = {
		idle: "border-white/10 text-white/80",
		loading: "border-sky-500/30 text-sky-200 bg-sky-500/5",
		success: "border-emerald-500/30 text-emerald-200 bg-emerald-500/5",
		error: "border-rose-500/30 text-rose-200 bg-rose-500/5",
	};

	const iconStyles = {
		idle: "text-white/50",
		loading: "text-sky-400 animate-spin",
		success: "text-emerald-400",
		error: "text-rose-400",
	};

	return (
		<div className={`${wrapperClass} transition-all duration-500 ease-out transform ${visible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"}`}>
			<div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border ${glassBase} ${statusStyles[status]}`}>
				<div className={`shrink-0 ${iconStyles[status]}`}>
					{status === "loading" && <Loader2 size={20} />}
					{status === "success" && <CheckCircle2 size={20} />}
					{status === "error" && <XCircle size={20} />}
				</div>
				<div className="flex flex-col">
					<span className="font-medium tracking-wide text-sm">{message}</span>
				</div>
			</div>
		</div>
	);
};

export default Toast;