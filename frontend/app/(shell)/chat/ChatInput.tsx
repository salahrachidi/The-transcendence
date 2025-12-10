// app/(shell)/chat/ChatInput.tsx
"use client";

import { useState } from "react";
import { SendHorizonal } from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";

type ChatInputProps = {
	onSend: (text: string) => void | Promise<void>;
	placeholder?: string;
	disabled?: boolean;
};

export default function ChatInput({
	onSend,
	placeholder,
	disabled,
}: ChatInputProps) {
	const { t } = useLanguage();
	const finalPlaceholder = placeholder || t("chat.input.placeholder");
	const [value, setValue] = useState("");

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		if (disabled) return;

		const text = value.trim();
		if (!text) return;

		onSend(text);
		setValue("");
	};

	return (
		<form onSubmit={handleSubmit} className="w-full">
			<div className="input-wrapper flex items-center gap-2">
				<input
					type="text"
					className="input flex-1"
					placeholder={finalPlaceholder}
					aria-label="Message input"
					value={value}
					disabled={disabled}
					onChange={event => setValue(event.target.value)}
				/>
				<button
					type="submit"
					className="send-btn"
					aria-label="Send message"
					disabled={disabled}
				>
					<SendHorizonal className="w-4 h-4" />
				</button>
			</div>
		</form>
	);
}
