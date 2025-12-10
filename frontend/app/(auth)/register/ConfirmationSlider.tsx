"use client";

import {
	useEffect,
	useRef,
	useState,
	type MouseEvent as ReactMouseEvent,
	type TouchEvent as ReactTouchEvent,
	type KeyboardEvent,
} from "react";
import { Check, ChevronsRight } from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";

type ConfirmationSliderProps = {
	onConfirm: (confirmed: boolean) => void;
	confirmed: boolean;
};

export default function ConfirmationSlider({ onConfirm, confirmed }: ConfirmationSliderProps) {
	const [value, setValue] = useState(confirmed ? 100 : 0);
	const [isDragging, setIsDragging] = useState(false);
	const sliderRef = useRef<HTMLDivElement>(null);
	const { t } = useLanguage();

	// Sync with external "confirmed" state
	useEffect(() => {
		if (confirmed) {
			setValue(100);
		} else if (!isDragging) {
			setValue(0);
		}
	}, [confirmed, isDragging]);

	useEffect(() => {
		const handleMove = (event: MouseEvent | TouchEvent) => {
			if (!isDragging || !sliderRef.current || confirmed) return;

			const slider = sliderRef.current;
			const rect = slider.getBoundingClientRect();
			const clientX =
				"touches" in event ? event.touches[0].clientX : event.clientX;

			let next = ((clientX - rect.left) / rect.width) * 100;
			next = Math.min(100, Math.max(0, next));
			setValue(next);
		};

		const handleUp = () => {
			if (!isDragging) return;
			setIsDragging(false);

			const shouldConfirm = value > 90;
			onConfirm(shouldConfirm);

			if (shouldConfirm) {
				setValue(100);
			} else {
				setValue(0);
			}
		};

		window.addEventListener("mousemove", handleMove);
		window.addEventListener("mouseup", handleUp);
		window.addEventListener("touchmove", handleMove);
		window.addEventListener("touchend", handleUp);

		return () => {
			window.removeEventListener("mousemove", handleMove);
			window.removeEventListener("mouseup", handleUp);
			window.removeEventListener("touchmove", handleMove);
			window.removeEventListener("touchend", handleUp);
		};
	}, [isDragging, value, confirmed, onConfirm]);

	const startDrag = (event: ReactMouseEvent | ReactTouchEvent) => {
		event.preventDefault();
		if (confirmed) return;
		setIsDragging(true);
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (confirmed) return;
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			onConfirm(true);
			setValue(100);
		}
	};

	const progress = value;
	const glowOpacity = 0.25 + (progress / 100) * 0.5;

	return (
		<div
			ref={sliderRef}
			className={`reg_confirmation_slider reg_cyber_slider ${confirmed ? "is-confirmed" : ""
				} ${isDragging ? "is-dragging" : ""}`}
			role="button"
			tabIndex={0}
			aria-pressed={confirmed}
			aria-label="Slide to confirm that you understand the risks"
			onMouseDown={startDrag}
			onTouchStart={startDrag}
			onKeyDown={handleKeyDown}
		>


			{/* Track */}
			<div className="reg_cyber_slider__track">
				<div
					className="reg_cyber_slider__fill"
					style={{ width: `${progress}%` }}
				/>
				<div
					className="reg_cyber_slider__label"
					style={{ opacity: confirmed ? 0.8 : 1 }}
				>
					{confirmed
						? t("auth.register.slider.locked")
						: t("auth.register.slider.caution")}
				</div>
			</div>

			{/* Thumb */}
			<div className="reg_cyber_slider__thumb"
				style={{ left: `calc(${progress}% + ${22 - progress * 0.44}px)`, transform: "translate(-50%, -50%)" }}
			>
				<div className="reg_cyber_slider__thumb-core">
					{confirmed ? (
						<Check size={16} className="text-white" />
					) : (
						<ChevronsRight size={16} className="reg_cyber_slider__arrow" />
					)}
				</div>
			</div>
		</div>
	);
}