// app/(shell)/chat/ChatHeader.tsx

import Link from "next/link";
import { MessagesSquare, User } from "lucide-react";
import Avatar from "@/app/components/Avatar";
import { useLanguage } from "@/app/context/LanguageContext";

type ChatHeaderProps = {
	title?: string;
	contactId?: string;
	contactName?: string;
	contactAvatarUrl?: string;
	statusText?: string;
	status?: "online" | "offline";
	isBlocked?: boolean;
	onBlockToggle?: () => void;
};

export default function ChatHeader({
	title,
	contactId,
	contactName,
	contactAvatarUrl = "",
	statusText,
	status = "online",
	isBlocked = false,
	onBlockToggle,
}: ChatHeaderProps) {
	const { t } = useLanguage();
	const finalTitle = title || t("chat.header.title");
	const finalContactName = contactName || "user";
	const finalStatusText = statusText || (status === "online" ? t("chat.header.online") : t("chat.header.offline"));

	const statusColor = status === "online" ? "text-emerald-400" : "text-white/60";
	const statusDot = status === "online" ? "bg-emerald-400" : "bg-white/50";

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between gap-3">
				<h2 className="text-2xl md:text-3xl 2xl:text-4xl font-extrabold leading-tight clamp-1">{finalTitle}</h2>
				<div className="w-9 h-9 rounded-full bg-white/20 border border-white/30 grid place-items-center" aria-hidden="true">
					<MessagesSquare className="w-5 h-5" />
				</div>
			</div>

			<div className="flex items-center justify-between gap-3 pb-2">
				<div className="flex items-center gap-3 2xl:gap-4">
					<span className="w-14 h-14 2xl:w-16 2xl:h-16 rounded-full overflow-hidden border-2 border-pink-500/50 bg-white/25 avatar-glow relative grid place-items-center">
						{contactAvatarUrl ? (
							<Avatar
								src={contactAvatarUrl}
								alt={`${contactName} avatar`}
								className="w-full h-full object-cover"
								size={28}
							/>
						) : (
							<User className="w-7 h-7 2xl:w-8 2xl:h-8 text-white/70" />
						)}
						<div className={`status-dot absolute bottom-1 right-1 ${status === "offline" ? "offline" : ""}`} />
					</span>
					<div>
						<span className="text-lg md:text-xl 2xl:text-2xl font-bold block">{finalContactName}</span>
						<span className={`text-xs 2xl:text-sm flex items-center gap-1 ${statusColor}`}>
							<span className={`inline-block w-2 h-2 rounded-full ${statusDot}`} />
							{finalStatusText}
						</span>
					</div>
				</div>
				<div className="flex items-center gap-2 border-b border-white/10 pb-2">
					<button
						type="button"
						onClick={onBlockToggle}
						className={`chat-pill-secondary ${isBlocked ? "bg-rose-500/20 text-rose-400 border-rose-500/50 hover:bg-rose-500/30" : ""}`}
					>
						{isBlocked ? t("chat.header.unblock") : t("chat.header.block")}
					</button>
					<Link
						href={isBlocked ? "#" : (contactId ? `/profile/${contactId}` : "/profile?tab=info")}
						className={`chat-pill-secondary ${isBlocked ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
					>
						{t("chat.header.profile")}
					</Link>
				</div>
			</div>
		</div>
	);
}
