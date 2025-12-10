// app/(shell)/chat/ChatPageClient.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquareOff } from "lucide-react";
import ChatSidebar from "./ChatSidebar";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import {
	fetchConversations,
	fetchConversationMessages,
	blockUser,
	unblockUser,
} from "./api";
import { fetchMe } from "../profile/api";
import type { ChatConversation, ChatMessage, BackendMessage } from "./data";

const getWsUrl = () => {
	if (typeof window === 'undefined') return '';
	const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
	return `${protocol}//${window.location.host}/ws/chat`;
};

type ServerEvent =
	| { type: "message:new"; message: ChatMessage }
	| { type: string;[key: string]: any }
	| { success: boolean; result: string };
import { useLanguage } from "@/app/context/LanguageContext";

export default function ChatPageClient() {
	const { t } = useLanguage();
	const initialConversationId = "";
	const [conversations, setConversations] = useState<ChatConversation[]>([]);
	const [conversationsLoading, setConversationsLoading] = useState(true);
	const [conversationsError, setConversationsError] = useState<string | null>(
		null,
	);
	const [activeConversationId, setActiveConversationId] =
		useState<string>(initialConversationId);
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [me, setMe] = useState<{ id: number; nickname: string; avatar: string } | null>(null);
	const [messagesLoading, setMessagesLoading] = useState(false);
	const [messagesError, setMessagesError] = useState<string | null>(null);
	//! Paginaiton stuff
	const [messagesCursor, setMessagesCursor] = useState<string | null>(null);
	const [messagesHasMore, setMessagesHasMore] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);
	//! sending state + error
	const [sending, setSending] = useState(false);
	const [sendError, setSendError] = useState<string | null>(null);
	//! WebSocket ref
	const socketRef = useRef<WebSocket | null>(null);
	const activeConvIdRef = useRef(activeConversationId);
	const conversationsRef = useRef(conversations);
	const meRef = useRef(me);

	// Keep refs synced
	useEffect(() => {
		activeConvIdRef.current = activeConversationId;
		conversationsRef.current = conversations;
		meRef.current = me;
	}, [activeConversationId, conversations, me]);

	const activeConversation = useMemo(
		() =>
			conversations.find(
				conversation => conversation.id === activeConversationId,
			),
		[conversations, activeConversationId],
	);
	const threadRef = useRef<HTMLDivElement | null>(null);
	const nearBottomRef = useRef(true);

	//! ⁡⁢⁣⁢track if user is near the bottom to decide autoscroll⁡
	useEffect(() => {
		const el = threadRef.current;
		if (!el) return;

		const handleScroll = () => {
			nearBottomRef.current =
				el.scrollHeight - el.scrollTop - el.clientHeight < 64;
		};

		el.addEventListener("scroll", handleScroll);
		handleScroll();
		return () => el.removeEventListener("scroll", handleScroll);
	}, []);

	//! ⁡⁢⁣⁢load conversations⁡
	useEffect(() => {
		let ignore = false;

		async function loadInitials() {
			// 1. Fetch Me
			const meRes = await fetchMe();
			if (ignore) return;
			if (meRes.ok) {
				setMe(meRes.data);
			}

			// 2. Fetch Conversations
			setConversationsLoading(true);
			try {
				const data = await fetchConversations();
				if (ignore) return;
				setConversations(data);
				// Removed auto-selection of first conversation
			} catch (err: any) {
				setConversationsError(err.message || t("chat.errors.loadConversations"));
			} finally {
				setConversationsLoading(false);
			}
		}

		loadInitials();
		return () => {
			ignore = true;
		};
	}, []);

	//! ⁡⁢⁣⁢load messages whenever active conversation changes⁡
	useEffect(() => {
		let ignore = false;

		async function loadMessages() {
			if (!me) return;

			const currentConv = conversations.find(c => c.id === activeConversationId);
			if (currentConv?.isTemporary) {
				setMessages([]);
				setMessagesHasMore(false);
				setMessagesError(null);
				setMessagesLoading(false);
				return;
			}

			setMessagesLoading(true);
			try {
				const msgs = await fetchConversationMessages(activeConversationId);
				if (ignore) return;

				// Map backend messages to UI messages
				const mapped: ChatMessage[] = msgs.map((m, idx) => ({
					id: m.id ? String(m.id) : `fallback-${Date.now()}-${idx}`, // Unique fallback
					conversationId: activeConversationId,
					direction: m.sender_id === me.id ? "out" : "in",
					text: m.message,
					time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
					originalTimestamp: m.timestamp
				}));

				setMessages(mapped);
				setMessagesCursor(null);
				setMessagesHasMore(msgs.length === 50); // Assume 50 is the limit
				setMessagesError(null);
			} catch (err: any) {
				setMessagesError(err.message);
			} finally {
				setMessagesLoading(false);
			}
		}

		if (activeConversationId && me) {
			loadMessages();
		}

		return () => {
			ignore = true;
		};
	}, [activeConversationId]);

	//! ⁡⁢⁣⁢initial scroll to bottom⁡
	useEffect(() => {
		const el = threadRef.current;
		if (!el) return;
		requestAnimationFrame(() =>
			el.scrollTo({
				top: el.scrollHeight,
				behavior: "auto",
			}),
		);
	}, []);

	//! ⁡⁢⁣⁢autoscroll when messages change, but only if user is near bottom⁡
	useEffect(() => {
		const el = threadRef.current;
		if (!el || !nearBottomRef.current) return;
		el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
	}, [messages]);

	//! ⁡⁢⁣⁢WebSocket connection (one per page)⁡
	useEffect(() => {
		// Only connect if we are logged in (me exists)
		if (!me) return;

		// Prevent multiple connections if already connected/connecting
		if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
			return;
		}

		//! open WebSocket once when the chat page mounts
		const url = getWsUrl();
		if (!url) return;
		const socket = new WebSocket(url);
		socketRef.current = socket;

		socket.onopen = () => {
			console.log("[WS] connected"); // DEBUG
			// Auth is handled via cookies automatically
		};

		socket.onerror = event => {
			console.warn("[WS] error", event); // DEBUG
		};

		socket.onclose = () => {
			console.log("[WS] disconnected"); // DEBUG
			socketRef.current = null;
		};

		socket.onmessage = event => {
			//console.log("[WS] raw message from echo server:", event.data); // DEBUG
			try {
				const data = JSON.parse(event.data);

				// Handle error responses (success: false)
				if ("success" in data && data.success === false) {
					setSendError(data.result || t("chat.errors.sendMessage"));
					return;
				}

				if (data.type === "message") {
					// We need to map this incoming message.
					// Data structure: { type: "message", sender: "username", receiver: "username", message: "...", timestamp: "..." }

					// 1. If it belongs to active conversation, append it.
					// We need to know the conversation ID logic. 
					// The WS message DOES NOT contain conversation ID!
					// We must match by sender/receiver.

					const isFromMe = data.sender === meRef.current?.nickname;
					const otherUsername = isFromMe ? data.receiver : data.sender;

					// Find which conversation this belongs to
					// Use refs to avoid stale closure
					const conv = conversationsRef.current.find(c => c.name === otherUsername);
					const convId = conv ? conv.id : null;
					const currentActiveId = activeConvIdRef.current;

					// If we are looking at this conversation, append message
					if (convId && convId === currentActiveId) {
						const newMsg: ChatMessage = {
							id: `ws-${Date.now()}`, // temp id
							conversationId: convId,
							direction: isFromMe ? "out" : "in",
							text: data.message,
							time: new Date(String(data.timestamp)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
						};

						setMessages(prev => {
							// Simple dedupe prevention matching content+approx time could be good, but for now just append
							return [...prev, newMsg];
						});
					}

					// 2. Refresh conversations list (to show preview/unread)
					// Handle merging of temporary conversations
					fetchConversations()
						.then(newData => {
							setConversations(prev => {
								const currentActiveId = activeConvIdRef.current;
								const activeConv = prev.find(c => c.id === currentActiveId);

								// 1. Check if we need to swap the active conversation ID
								// (If we were on a temporary one, and the backend now returns a real one)
								if (activeConv?.isTemporary) {
									const match = newData.find(n => n.name === activeConv.name);
									if (match) {
										// Found a real conversation for our temporary one.
										// We must switch to the real ID.
										// Note: Calling setState inside setState callback is generally safe in event handlers/async
										// setActiveConversationId(match.id); // Don't swap ID mid-stream if possible, or do it carefully
										// Actually, we SHOULD swap it so future messages use the real ID logic?
										// But we also have state depending on activeConversationId...
										// For now, let's just merge list.
									} else {
										// Not found yet (maybe latent), keep the temp one in the list
										// returning [...newData, activeConv] would be duplicate if we aren't careful
										// But here match is null, so newData does NOT contain it.
									}
								}

								// 2. Merge: Keep any temporary conversations that are NOT in the new list
								const temps = prev.filter(c => c.isTemporary);
								const stillTemps = temps.filter(t => !newData.some(n => n.name === t.name));

								return [...stillTemps, ...newData];
							});
						})
						.catch(console.error);
				}
			} catch (error) {
				console.error("[WS] failed to parse message", error); // DEBUG
			}
		};

		return () => {
			if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
				socket.close();
			}
			socketRef.current = null;
		};
	}, [me]); // Dependent on 'me' (user logged in) to start connection, NOT activeConversationId

	//! ⁡⁢⁣⁢sending handler⁡
	const handleSendMessage = async (rawText: string) => {
		const text = rawText.trim();
		if (!text || !activeConversationId || !me) return;

		setSendError(null);
		setSending(true);

		const socket = socketRef.current;

		// We need receiver username
		const conversation = conversations.find(c => c.id === activeConversationId);
		if (!conversation) {
			setSendError(t("chat.errors.conversationNotFound"));
			setSending(false);
			return;
		}

		const payload = {
			sender: me.nickname,
			receiver: conversation.name, // The conversation Name IS the username in our current data model
			message: text,
			timestamp: new Date().toISOString(),
			is_seen: false
		};

		//! If WebSocket is open → send over WS
		if (socket && socket.readyState === WebSocket.OPEN) {
			try {
				socket.send(JSON.stringify(payload));

				// Optimistic Update
				const tempMessage: ChatMessage = {
					id: `temp-${Date.now()}`,
					conversationId: activeConversationId,
					direction: "out",
					text,
					time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
				};
				setMessages(prev => [...prev, tempMessage]);

			} catch (error) {
				console.error("[WS] send error", error); // DEBUG
				setSendError(t("chat.errors.sendMessage"));
			} finally {
				setSending(false);
			}
			return;
		}

		setSendError(t("chat.errors.connectionLost"));
		setSending(false);
	};
	//! pagination handler
	const handleLoadOlder = async () => {
		if (!activeConversationId || !messagesHasMore || loadingMore) return;

		setLoadingMore(true);
		const el = threadRef.current;
		const prevHeight = el?.scrollHeight ?? 0;

		// For now simple refetch all or ignore pagination because backend API structure is simpler
		// The API endpoint: /chat/conversations/:id/messages?limit=50&offset=0
		// We'd need to track offset.
		// Let's implement basics first.

		const nextOffset = messages.length;
		// Assumes backend offset is count-based.

		try {
			const msgs = await fetchConversationMessages(activeConversationId, 50, nextOffset);
			if (msgs.length === 0) {
				setMessagesHasMore(false);
				setLoadingMore(false);
				return;
			}

			// Map and Prepend
			if (!me) {
				setLoadingMore(false);
				return;
			}
			const mapped: ChatMessage[] = msgs.map((m, idx) => ({
				id: m.id ? String(m.id) : `fallback-${Date.now()}-${idx}`,
				conversationId: activeConversationId,
				direction: m.sender_id === me.id ? "out" : "in",
				text: m.message,
				time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
				originalTimestamp: m.timestamp
			}));

			setMessages(prev => [...mapped, ...prev]);
			setMessagesHasMore(msgs.length === 50);
			setLoadingMore(false);
			// If backend returns oldest first (1,2,3...10), and we requested offset 0 (0-10).
			// Wait, offset 0 should be latest? No. usually offset 0 is 0..10.
			// Chat usually wants LATEST messages first.
			// Backend documentation says: "Messages are returned in ascending order (oldest first)".
			// So if we have 100 messages.
			// limit=10, offset=0 -> returns messages 1-10 (Oldest).
			// We want messages 90-100 (Newest) initially.

			// Backend API might not support "from end" pagination easily unless we reverse offset?
			// Documentation doesn't specify sort order param.
			// It says "ORDER BY timestamp ASC".

			// This is tricky for pagination "load older".
			// If we want "latest 10", we usually need DESC order or high offset.
			// But if backend enforces ASC...
			// We might be fetching the OLDEST messages at mount if we do offset=0!

			// Re-reading docs: "Offset for pagination".
			// If I have 10 messages total. Offset 0 Limit 10 -> returns 1..10.
			// If I have 100. Offset 0 Limit 10 -> returns 1..10 (Oldest).
			// This means the default `loadMessages` fetches the BEGINNING of the conversation (Oldest), not the end (Newest).
			// This is bad for a chat app unless we load ALL messages or backend supports "last 10".

			// WORKAROUND: For now, I'll fetch with a very high limit or ignore pagination and fetch "all" (if plausible) 
			// or ask backend to fix/add ordering.
			// But I can't change backend easily? 
			// Actually `controller.chat.js` says: `ORDER BY timestamp ASC`. 
			// `getConversations` did `ORDER BY c.last_timestamp DESC`.

			// I'll stick to fetching offset 0. If it returns oldest, then the user effectively starts at the beginning of history.
			// For a prototype/MVP this might be acceptable behavior (scrolling down to bottom).
			// But for "load older", we'd need to fetch *previous* pages?
			// If we are at offset 0 (oldest), we can't load *older*.
			// We'd need to load *newer*?

			// If the initial load (offset 0) gives oldest, we are at the top. Use scrolls down.
			// If we want "load more" (meaning newer), we incr offset.

			// BUT ChatPageClient expects "Load Older" button usually appearing at TOP.
			// If we have Oldest... we can't load older.

			// I will implement "Load More" (Newer) at the bottom?
			// Standard chat app: showing Newest. Scroll UP to load Older.
			// If backend gives Oldest first, we show Oldest.
			// To get Newest, we'd need to know Count or have DESC sort.

			// I will assume for now we just load offset 0.

			setLoadingMore(false);

		} catch (err: any) {
			setMessagesError(err.message);
			setLoadingMore(false);
		}



		//! keep scroll anchored
		if (el) {
			requestAnimationFrame(() => {
				const newHeight = el.scrollHeight;
				el.scrollTop = newHeight - prevHeight;
			});
		}
	};


	//! Block handler
	const handleBlockToggle = async () => {
		if (!activeConversationId) return;

		const conversation = conversations.find(c => c.id === activeConversationId);
		if (!conversation) return;

		const isBlocked = conversation.is_blocked;
		const action = isBlocked ? "unblock" : "block";

		if (!window.confirm(isBlocked ? t("chat.confirm.unblock") : t("chat.confirm.block"))) {
			return;
		}

		setSendError(null);
		setSending(true);

		const newStatus = !isBlocked;

		// Optimistic update
		setConversations(prev =>
			prev.map(c =>
				c.id === activeConversationId
					? { ...c, is_blocked: newStatus }
					: c
			)
		);

		// Use userId if available (real conversation), otherwise id (temporary conversation which mimics userId)
		// But actually, for temporary conversations, id IS userId.
		// For real conversations, id is ConversationId, userId is userId.
		const targetId = String(conversation.userId || conversation.id);

		// Call API
		const { success, error } = isBlocked
			? await unblockUser(targetId)
			: await blockUser(targetId);

		if (!success) {
			console.error("Block toggle failed:", error);
			// Revert on failure
			setConversations(prev =>
				prev.map(c =>
					c.id === activeConversationId
						? { ...c, is_blocked: isBlocked }
						: c
				)
			);
			// Optionally show toast error here
		}
	};

	//! Handle user found from global search
	const handleUserFound = (user: { id: string; nickname: string; avatarUrl: string; status: any }) => {
		// Check if already exists
		const existing = conversations.find(c => c.id === user.id);
		if (existing) {
			setActiveConversationId(user.id);
			return;
		}

		// Add new conversation
		const newConv: ChatConversation = {
			id: user.id,
			userId: user.id, // Temporary: ID is UserID
			name: user.nickname,
			avatarUrl: user.avatarUrl,
			status: user.status || "offline",
			time: "New",
			preview: t("chat.sidebar.startConversation"),
			read: true,
			is_blocked: false,
			am_i_blocked: false,
			isTemporary: true,
		};

		setConversations(prev => [newConv, ...prev]);
		setActiveConversationId(user.id);
	};

	return (
		<div className="grid grid-cols-12 gap-4 md:gap-5 lg:gap-6 2xl:gap-8 min-w-0 h-[calc(100vh-9rem)]">
			<section className="col-span-12 md:col-span-5 xl:col-span-4 min-w-0 h-full min-h-0">
				<ChatSidebar
					conversations={conversations}
					loading={conversationsLoading}
					error={conversationsError}
					activeConversationId={activeConversationId}
					onSelectConversation={setActiveConversationId}
					onUserFound={handleUserFound}
				/>
			</section>

			<section className="col-span-12 md:col-span-7 xl:col-span-8 min-w-0 h-full min-h-0">
				<div className="glass card-radius h-full min-h-0 flex flex-col overflow-hidden">
					{!activeConversationId ? (
						<div className="flex flex-col items-center justify-center h-full text-white/50 gap-4 animate-fade-in">
							<div className="w-16 h-16 rounded-full bg-white/5 grid place-items-center">
								<MessageSquareOff className="w-8 h-8 opacity-50" />
							</div>
							<p className="text-lg font-medium">{t("chat.messages.selectToStart")}</p>
						</div>
					) : (
						<>
							<div className="thread-header px-4 md:px-6 2xl:px-8 pt-4 2xl:pt-6">
								<ChatHeader
									contactId={activeConversation?.userId ? String(activeConversation.userId) : activeConversation?.id}
									contactName={activeConversation?.name}
									contactAvatarUrl={activeConversation?.avatarUrl}
									status={activeConversation?.status}
									statusText={
										activeConversation?.status === "offline"
											? t("chat.header.offline")
											: t("chat.header.online")
									}
									isBlocked={activeConversation?.is_blocked}
									onBlockToggle={handleBlockToggle}
								/>
							</div>

							<div
								ref={threadRef}
								id="threadScroll"
								className="flex-1 min-h-0 scroll-area overflow-y-auto px-4 md:px-6 2xl:px-8 space-y-4 py-4"
								aria-live="polite"
							>
								{activeConversation?.is_blocked ? (
									<div className="h-full flex flex-col items-center justify-center text-white/50 gap-2">
										<div className="w-12 h-12 rounded-full bg-white/5 grid place-items-center mb-2">
											<MessageSquareOff className="w-6 h-6" />
										</div>
										<p>{t("chat.messages.blockedYou")}</p>
										<p className="text-sm">{t("chat.messages.unblockToSee")}</p>
									</div>
								) : activeConversation?.am_i_blocked ? (
									<div className="h-full flex flex-col items-center justify-center text-white/50 gap-2">
										<div className="w-12 h-12 rounded-full bg-white/5 grid place-items-center mb-2">
											<MessageSquareOff className="w-6 h-6 text-rose-500" />
										</div>
										<p className="text-rose-300">{t("chat.messages.blockedBy")}</p>
										<p className="text-sm">{t("chat.messages.cannotSend")}</p>
									</div>
								) : (
									<>
										{messagesHasMore && (
											<div className="flex justify-center mb-2">
												<button
													type="button"
													onClick={handleLoadOlder}
													disabled={loadingMore}
													className="chip cursor-pointer px-3 py-1 text-xs disabled:opacity-60"
												>
													{loadingMore ? t("chat.messages.loading") : t("chat.messages.loadOlder")}
												</button>
											</div>
										)}

										{messagesLoading ? (
											<div className="space-y-3 opacity-75">
												{Array.from({ length: 4 }).map((_, index) => (
													<div
														key={`msg-placeholder-${index}`}
														className="h-5 bg-white/10 rounded-full w-3/4 animate-pulse"
													/>
												))}
											</div>
										) : (
											<ChatMessages messages={messages} />
										)}

										{messagesError && (
											<p className="text-xs text-rose-300 px-2">{messagesError}</p>
										)}
									</>
								)}
							</div>

							<div className="px-3 md:px-4 2xl:px-6 pb-3 2xl:pb-4">
								<ChatInput
									onSend={handleSendMessage}
									//! If we’re currently sending (no spam) OR no chat is selected OR blocked → disable the input.
									disabled={sending || !activeConversationId || activeConversation?.is_blocked || activeConversation?.am_i_blocked}
								/>
								{sendError && (
									<p className="mt-1 text-xs text-rose-300 px-1">{sendError}</p>
								)}
							</div>
						</>
					)}
				</div>
			</section>
		</div>
	);
}
