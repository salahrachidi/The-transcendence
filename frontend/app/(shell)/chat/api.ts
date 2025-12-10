import { ChatConversation, ChatMessage, BackendMessage } from "./data";

const PREFIX = "/chat";

/**
 * Validates and returns the JSON result if success is true.
 * Throws an error with the result message if success is false.
 */
async function handleResponse<T>(res: Response): Promise<T> {
	if (!res.ok) {
		try {
			const json = await res.json();
			throw new Error(json.result || `Request failed with status ${res.status}`);
		} catch (e: any) {
			throw new Error(e.message || `Request failed with status ${res.status}`);
		}
	}
	const json = await res.json();

	if (Array.isArray(json)) {
		return json as T;
	}

	if (json.success === false) {
		throw new Error(json.result || "Unknown error");
	}

	return (json.result !== undefined ? json.result : json) as T;
}

export async function fetchConversations(limit = 20, offset = 0): Promise<ChatConversation[]> {
	const res = await fetch(`${PREFIX}/conversations?limit=${limit}&offset=${offset}`, {
		headers: {
			"Content-Type": "application/json",
		},
	});
	return handleResponse<ChatConversation[]>(res);
}

export async function fetchConversationMessages(
	conversationId: string | number,
	limit = 50,
	offset = 0
): Promise<BackendMessage[]> {
	const res = await fetch(`${PREFIX}/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`, {
		headers: {
			"Content-Type": "application/json",
		},
	});
	return handleResponse<BackendMessage[]>(res);
}

export async function markMessagesAsSeen(senderUsername: string): Promise<string> {
	const res = await fetch(`${PREFIX}/messages/seen`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ senderUsername }),
	});
	return handleResponse<string>(res);
}

export async function getOnlineUsers(): Promise<{ count: number; users: string[] }> {
	const res = await fetch(`${PREFIX}/online-users`, {
		headers: {
			"Content-Type": "application/json",
		},
	});
	return handleResponse<{ count: number; users: string[] }>(res);
}

export async function blockUser(userId: string): Promise<{ success: boolean; error?: string }> {
	try {
		const res = await fetch(`/social/block/${userId}`, {
			method: "POST",
		});
		if (!res.ok) {
			return { success: false, error: `Failed to block user (${res.status})` };
		}
		return { success: true };
	} catch (err) {
		console.error("blockUser error", err);
		return { success: false, error: "Network error" };
	}
}

export async function unblockUser(userId: string): Promise<{ success: boolean; error?: string }> {
	try {
		const res = await fetch(`/social/unblock/${userId}`, {
			method: "POST",
		});
		if (!res.ok) {
			return { success: false, error: `Failed to unblock user (${res.status})` };
		}
		return { success: true };
	} catch (err) {
		console.error("unblockUser error", err);
		return { success: false, error: "Network error" };
	}
}

export async function searchUser(nickname: string): Promise<{ data?: any; error?: string }> {
	try {
		const res = await fetch(`/user/nickname/${nickname}`, {
			method: "GET",
		});
		if (!res.ok) {
			if (res.status === 404) return { error: "User not found" };
			try {
				const json = await res.json();
				return { error: json.result || `Search failed (${res.status})` };
			} catch {
				return { error: `Search failed (${res.status})` };
			}
		}
		const json = await res.json();
		if (json.success && json.result) {
			const u = json.result;
			return {
				data: {
					id: String(u.id),
					nickname: u.nickname,
					avatarUrl: u.avatar || "",
					status: "offline",
				} // returning ChatUser compliant object effectively
			};
		}
		return { error: "Invalid response" };
	} catch (err) {
		console.error("searchUser error", err);
		return { error: "Network error" };
	}
}

export async function addFriend(userId: string): Promise<{ success: boolean; error?: string }> {
	try {
		const res = await fetch(`/friend/create/${userId}`, {
			method: "POST",
		});
		if (!res.ok) {
			const json = await res.json();
			return { success: false, error: json.result || `Failed to add friend (${res.status})` };
		}
		return { success: true };
	} catch (err) {
		console.error("addFriend error", err);
		return { success: false, error: "Network error" };
	}
}

export async function checkFriendship(userId: string): Promise<boolean> {
	try {
		// Backend returns 200 if friend, 404 if not.
		const res = await fetch(`/relation/check/${userId}`, {
			method: "GET",
		});
		return res.ok;
	} catch (err) {
		console.error("checkFriendship error", err);
		return false;
	}
}

export type Friend = {
	id: number;
	nickname: string;
	avatar: string;
};

export async function fetchFriends(): Promise<Friend[]> {
	try {
		const res = await fetch(`/friend/get_all`, {
			method: "GET",
		});
		return handleResponse<Friend[]>(res);
	} catch (err) {
		console.error("fetchFriends error", err);
		return [];
	}
}
