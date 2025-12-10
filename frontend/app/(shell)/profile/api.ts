export type ApiResult<T = void> =
	| { ok: true; data: T }
	| { ok: false; error: string };

export async function fetchUserData(): Promise<ApiResult<Blob>> {
	try {
		const res = await fetch("/user/my_data", { credentials: "include" });
		if (!res.ok) {
			return { ok: false, error: `Server error (${res.status})` };
		}
		const blob = await res.blob();
		return { ok: true, data: blob };
	} catch (e) {
		return { ok: false, error: "Network error" };
	}
}

export async function fetchMe(): Promise<ApiResult<any>> {
	try {
		const res = await fetch("/user/me", { credentials: "include" });
		if (!res.ok) {
			return { ok: false, error: `Server error (${res.status})` };
		}
		const json = await res.json();
		if (!json.success) {
			return { ok: false, error: json.result || "Failed to fetch user" };
		}
		return { ok: true, data: json.result };
	} catch (e) {
		return { ok: false, error: "Network error" };
	}
}

export async function fetchUserById(id: string | number): Promise<ApiResult<any>> {
	try {
		const res = await fetch(`/user/id/${id}`, { credentials: "include" });
		if (!res.ok) {
			return { ok: false, error: `Server error (${res.status})` };
		}
		const json = await res.json();
		if (json.success === false) {
			return { ok: false, error: json.result || "Failed to fetch user" };
		}
		return { ok: true, data: json.result || json };
	} catch (e) {
		return { ok: false, error: "Network error" };
	}
}

export async function requestAccountDeletion(): Promise<ApiResult> {
	try {
		const res = await fetch("/user/delete", { method: "POST", credentials: "include" });
		if (res.status === 410) {
			return { ok: true, data: undefined };
		}
		if (!res.ok) {
			return { ok: false, error: `Server error (${res.status})` };
		}
		return { ok: true, data: undefined };
	} catch (e) {
		return { ok: false, error: "Network error" };
	}
}

export async function requestAccountAnonymization(): Promise<ApiResult> {
	try {
		const res = await fetch("/user/anonymize", { method: "POST", credentials: "include" });
		if (res.status === 410) {
			return { ok: true, data: undefined };
		}
		if (!res.ok) {
			return { ok: false, error: `Server error (${res.status})` };
		}
		return { ok: true, data: undefined };
	} catch (e) {
		return { ok: false, error: "Network error" };
	}
}

export async function updateUserProfile(userId: number, data: { nickname?: string; email?: string; new_password?: string; current_password?: string }): Promise<ApiResult<any>> {
	try {
		const res = await fetch(`/user/${userId}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
			credentials: "include",
		});
		const json = await res.json();
		if (!res.ok || !json.success) {
			return { ok: false, error: json.result || `Server error (${res.status})` };
		}
		return { ok: true, data: json.result };
	} catch (e) {
		return { ok: false, error: "Network error" };
	}
}

export async function uploadUserAvatar(formData: FormData): Promise<ApiResult<any>> {
	try {
		const res = await fetch("/user/avatar", {
			method: "POST",
			body: formData,
			credentials: "include",
		});
		const json = await res.json();
		if (!res.ok || !json.success) {
			return { ok: false, error: json.result || `Server error (${res.status})` };
		}
		return { ok: true, data: json.result };
	} catch (e) {
		return { ok: false, error: "Network error" };
	}
}

export async function generate2FA(): Promise<ApiResult<string>> {
	try {
		const res = await fetch("/auth/2fa/generate", { credentials: "include" });
		if (!res.ok) {
			return { ok: false, error: `Server error (${res.status})` };
		}
		const json = await res.json();
		if (!json.success) {
			return { ok: false, error: json.result || "Failed to generate 2FA" };
		}
		//NOTE: Backend returns the QR code Data URL directly in json.result
		return { ok: true, data: json.result };
	} catch (e) {
		return { ok: false, error: "Network error" };
	}
}

export async function verify2FA(token: string): Promise<ApiResult> {
	try {
		const res = await fetch("/auth/2fa/verify", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ token_2fa: token }),
			credentials: "include",
		});
		if (!res.ok) {
			return { ok: false, error: `Server error (${res.status})` };
		}
		const json = await res.json();
		if (!json.success) {
			return { ok: false, error: json.result || "Verification failed" };
		}
		return { ok: true, data: undefined };
	} catch (e) {
		return { ok: false, error: "Network error" };
	}
}

export async function disable2FA(): Promise<ApiResult> {
	try {
		const res = await fetch("/auth/2fa/disable", { credentials: "include" });
		if (!res.ok) {
			return { ok: false, error: `Server error (${res.status})` };
		}
		const json = await res.json();
		if (!json.success) {
			return { ok: false, error: json.result || "Failed to disable 2FA" };
		}
		return { ok: true, data: undefined };
	} catch (e) {
		return { ok: false, error: "Network error" };
	}
}
