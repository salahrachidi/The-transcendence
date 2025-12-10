// app/(shell)/chat/ChatSidebar.tsx
"use client";

import { useMemo, useState } from "react";
import { ChatConversation, ChatUser } from "./data";
import { searchUser, addFriend, checkFriendship } from "./api";
import { Inbox, Search, UserPlus, User, MessageCircle, UserCheck, Loader2 } from "lucide-react";
import Avatar from "@/app/components/Avatar";
import { useLanguage } from "@/app/context/LanguageContext";


type ChatSidebarProps = {
	conversations: ChatConversation[];
	loading: boolean;
	error?: string | null;
	activeConversationId: string;
	onSelectConversation: (id: string) => void;
	onUserFound: (user: ChatUser) => void;
};

export default function ChatSidebar({ conversations, loading, error, activeConversationId, onSelectConversation, onUserFound }: ChatSidebarProps) {
	const { t } = useLanguage();

	const [searchQuery, setSearchQuery] = useState("");
	const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
	const [globalError, setGlobalError] = useState<string | null>(null);
	const [globalSearchResult, setGlobalSearchResult] = useState<ChatUser | null>(null);
	const [addFriendLoading, setAddFriendLoading] = useState(false);
	const [addFriendSuccess, setAddFriendSuccess] = useState<string | null>(null);
	const [isFriend, setIsFriend] = useState(false);

	const filteredConversations = useMemo(() => {
		let result = conversations;

		// Filter by search query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(conv => conv.name.toLowerCase().includes(query));
		}

		return result;
	}, [conversations, searchQuery]);

	const showSkeleton = loading && conversations.length === 0;

	const handleSearch = async () => {
		setIsSearchingGlobal(true);
		setGlobalError(null);
		setGlobalSearchResult(null);
		setAddFriendSuccess(null);
		setIsFriend(false);

		const { data, error } = await searchUser(searchQuery);

		if (data) {
			const alreadyFriend = await checkFriendship(data.id);
			setIsFriend(alreadyFriend);
			setGlobalSearchResult(data);
		} else {
			setGlobalError(error || t("chat.sidebar.userNotFound"));
		}
		setIsSearchingGlobal(false);
	};

	const handleAddFriend = async () => {
		if (!globalSearchResult) return;
		setAddFriendLoading(true);
		const { success, error } = await addFriend(globalSearchResult.id);
		setAddFriendLoading(false);

		if (success) {
			setAddFriendSuccess("Friend added!");
			setIsFriend(true);
		} else {
			setGlobalError(error || "Failed to add friend");
		}
	};

	return (
		<div className="glass card-radius p-4 md:p-5 2xl:p-6 h-full flex flex-col">
			<header className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-3">
					<div className="w-9 h-9 rounded-full bg-white/20 border border-white/30 grid place-items-center">
						<Inbox className="w-5 h-5" />
					</div>
					<h2 className="text-xl 2xl:text-2xl font-bold">{t("chat.sidebar.inbox")}</h2>
				</div>
			</header>

			<div className="flex-1 min-h-0">
				<div className="bg-white/15 rounded-2xl p-2 h-full flex flex-col">
					{/* Search Bar */}
					<div className="relative mb-2">
						<div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" aria-hidden="true">
							<Search className="w-4 h-4" />
						</div>
						<input
							type="text"
							placeholder={t("chat.sidebar.searchPlaceholder")}
							aria-label="Search users"
							value={searchQuery}
							onChange={(e) => {
								setSearchQuery(e.target.value);
								if (!e.target.value) {
									setGlobalSearchResult(null);
									setGlobalError(null);
									setAddFriendSuccess(null);
									setIsFriend(false);
								}
							}}
							onKeyDown={(e) => {
								if (e.key === 'Enter' && searchQuery && filteredConversations.length === 0) {
									handleSearch();
								}
							}}
							className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-9 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:bg-white/10 focus:border-white/20 transition-colors"
						/>
					</div>

					<div className="h-px bg-white/15 mb-2" />
					{error && (
						<p className="text-xs text-rose-300 mb-2 px-1">
							{error}
						</p>
					)}

					<ul className="flex-1 min-h-0 scroll-area overflow-y-auto pr-1 space-y-2" aria-live="polite">
						{showSkeleton &&
							Array.from({ length: 5 }).map((_, index) => (
								<li key={`placeholder-${index}`} className="inbox-item flex items-center gap-3 card-radius p-3 opacity-60">
									<div className="w-12 h-12 rounded-full bg-white/10 animate-pulse" />
									<div className="flex-1 space-y-2">
										<div className="h-3 bg-white/15 rounded-full w-3/4 animate-pulse" />
										<div className="h-3 bg-white/10 rounded-full w-1/2 animate-pulse" />
									</div>
								</li>
							))}
						{!showSkeleton && filteredConversations.length === 0 && (
							<li className="inbox-item flex flex-col items-center justify-center card-radius p-4 text-sm text-white/80 gap-3">
								{!globalSearchResult ? (
									<>
										<p>{searchQuery ? t("chat.sidebar.noResults") : t("chat.sidebar.noConversations")}</p>

										{searchQuery && (
											<button
												onClick={handleSearch}
												disabled={isSearchingGlobal}
												className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 rounded-full transition text-xs font-medium"
											>
												{isSearchingGlobal ? (
													<Loader2 className="w-4 h-4 animate-spin" />
												) : (
													<Search className="w-4 h-4" />
												)}
												{t("chat.sidebar.findGlobal")}
											</button>
										)}

										{globalError && (
											<p className="text-xs text-rose-300 mt-2">{globalError}</p>
										)}
									</>
								) : (
									<div className="w-full">
										<div className="flex items-center gap-3 mb-3">
											<div className="w-12 h-12 rounded-full overflow-hidden border border-white/30">
												<Avatar src={globalSearchResult.avatarUrl} alt={globalSearchResult.nickname} size={24} className="w-full h-full object-cover" />
											</div>
											<div>
												<p className="font-bold">{globalSearchResult.nickname}</p>
												<p className="text-xs text-white/50">{t("chat.sidebar.userFound")}</p>
											</div>
										</div>

										<div className="flex gap-2">
											<button
												onClick={handleAddFriend}
												disabled={addFriendLoading || !!addFriendSuccess || isFriend}
												className={`flex-1 py-1.5 px-3 text-xs rounded-lg flex items-center justify-center gap-2 transition ${isFriend || addFriendSuccess
													? "bg-emerald-500/20 text-emerald-200 cursor-default"
													: "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 cursor-pointer"
													}`}
											>
												{addFriendLoading ? (
													<Loader2 className="w-3.5 h-3.5 animate-spin" />
												) : isFriend || addFriendSuccess ? (
													<UserCheck className="w-3.5 h-3.5" />
												) : (
													<UserPlus className="w-3.5 h-3.5" />
												)}
												{addFriendSuccess ? "Added" : isFriend ? "Friend" : "Add Friend"}
											</button>
											<button
												onClick={() => {
													onUserFound(globalSearchResult);
													setSearchQuery("");
													setGlobalSearchResult(null);
												}}
												className="flex-1 py-1.5 px-3 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg flex items-center justify-center gap-2 transition cursor-pointer"
											>
												<MessageCircle className="w-3.5 h-3.5" />
												Chat
											</button>
										</div>
										{addFriendSuccess && <p className="text-xs text-emerald-300 mt-2 text-center">{addFriendSuccess}</p>}
										{globalError && <p className="text-xs text-rose-300 mt-2 text-center">{globalError}</p>}
									</div>
								)}
							</li>
						)}
						{filteredConversations.map(conv => {
							const isActive = conv.id === activeConversationId;
							return (
								<li
									key={conv.id}
									data-status={conv.status}
									data-read={conv.read}
								>
									<button
										onClick={() => onSelectConversation(conv.id)}
										role="button"
										tabIndex={0}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === " ") {
												e.preventDefault();
												onSelectConversation(conv.id);
											}
										}}
										className={
											"w-full text-left p-2 md:p-3 rounded-xl transition-all flex items-center gap-3 cursor-pointer " +
											(activeConversationId === conv.id
												? "bg-white/10"
												: "hover:bg-white/5") +
											(conv.am_i_blocked ? " opacity-50 grayscale" : "")
										}
									>
										<div className="shrink-0 w-12 h-12 2xl:w-14 2xl:h-14 rounded-full overflow-hidden border-2 border-purple-500/40 bg-white/20 avatar-glow relative grid place-items-center">
											{conv.avatarUrl ? (
												<Avatar
													src={conv.avatarUrl}
													alt={conv.name}
													className="w-full h-full object-cover"
													size={24}
												/>
											) : (
												<User className="w-6 h-6 2xl:w-7 2xl:h-7 text-white/70" />
											)}
											<div className={`status-dot absolute bottom-0 right-0 ${conv.status === "offline" ? "offline" : ""}`} />
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex items-center justify-between gap-2">
												<h3 className="text-sm 2xl:text-base font-semibold clamp-1">{conv.name}</h3>
												<time className="timestamp">
													{conv.time === "New" ? t("chat.sidebar.new") : new Date(conv.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
												</time>
											</div>
											<p className="text-xs 2xl:text-sm text-white/70 clamp-1">
												{conv.am_i_blocked ? <span className="text-rose-400">{t("chat.sidebar.blocked")}</span> : (conv.preview === "Start a conversation" ? t("chat.sidebar.startConversation") : conv.preview)}
											</p>
										</div>
									</button>
								</li>
							);
						})}
					</ul>
				</div>
			</div>
		</div>
	);
}
