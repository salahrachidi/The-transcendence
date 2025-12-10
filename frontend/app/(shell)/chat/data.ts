
// =========================================
// BACKEND TYPES
// =========================================

export type BackendConversation = {
	id: number; // Backend returns number
	name: string;
	time: string;
	preview: string;
	avatarUrl: string;
	status: "online" | "offline";
	read: boolean;
	// is_blocked is missing from main conversation endpoint currently
};

export type BackendMessage = {
	id?: number; // Backend DB id
	sender_id: number;
	receiver_id: number;
	message: string;
	timestamp: string;
	is_seen: number; // 0 or 1
};

// =========================================
// UI TYPES 
// =========================================

export type ChatConversation = {
	id: string; // Conversation ID
	userId?: string | number; // User ID (for blocking etc)
	name: string;
	time: string;
	preview: string;
	avatarUrl: string;
	status: "online" | "offline";
	read: boolean;
	is_blocked: boolean;
	am_i_blocked: boolean;
	isTemporary?: boolean;
};

export type ChatUser = {
	id: string;
	nickname: string;
	avatarUrl: string;
	status: "online" | "offline" | "ingame";
};

export type ChatMessage = {
	id: string;
	conversationId: string;
	direction: "in" | "out";	// "in" = received, "out" = sent by me
	text: string;
	time?: string;				// e.g. "6:32 PM"
	// Added to helpful debugging/conversions
	originalTimestamp?: string;
};
