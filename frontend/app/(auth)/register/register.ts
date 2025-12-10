export function isEmail(value: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function validateNickname(nickname: string): boolean {
	// 1-15 chars, letters, numbers, dot, underscore
	const re = /^[a-zA-Z0-9_.]{1,15}$/;
	return re.test(nickname);
}

export function avatarIsValid(file: File | null): boolean {
	if (!file) return true;
	const validType = /image\/(png|jpeg|webp|gif)/.test(file.type);
	const validSize = file.size <= 2 * 1024 * 1024;
	return validType && validSize;
}

export function avatarHintText(file: File | null): string {
	if (!file) return "Allowed: png, jpg, webp, gif. Max 2 MB.";
	if (file.size > 2 * 1024 * 1024) return "Max size is 2 MB.";
	if (!/image\/(png|jpeg|webp|gif)/.test(file.type)) return "Allowed types: png, jpg, webp, gif.";
	return "Allowed: png, jpg, webp, gif. Max 2 MB.";
}



const BACKEND_URL = "http://localhost:5555";

type ApiUser = {
	id: number;
	nickname: string;
	email: string;
	avatar: string | null;
	is_two_factor_enabled: number;
	created_at: string;
};

type RegisterResult =
	| { ok: true; user: ApiUser; message?: string }
	| { ok: false; error: string };

export async function submitRegister(formData: FormData): Promise<RegisterResult> {
	const nickname = String(formData.get("nickname") ?? "").trim();
	const email = String(formData.get("email") ?? "").trim();
	const password = String(formData.get("password") ?? "");

	let res: Response;

	try {
		res = await fetch("/auth/signup", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ nickname, email, password }),
			credentials: "include",          // For middleware
		});
	} catch (e) {
		// REAL network error (backend down, etc.)
		return { ok: false, error: "Network error while registering" };
	}

	let data: any = null;
	try {
		data = await res.json();
	} catch {
		if (!res.ok) {
			return { ok: false, error: `Server error (${res.status})` };
		}
		return { ok: false, error: "Unexpected server response" };
	}

	// HTTP status error (400, 500, …) → show backend message, but DON'T throw
	if (!res.ok) {
		const msg =
			data?.result || data?.message || `Server error (${res.status})`;
		return { ok: false, error: msg };
	}

	// Backend "logical" failure: success: false
	if (!data.success) {
		return {
			ok: false,
			error: data.result || "Registration failed",
		};
	}

	// 3. Upload Avatar if present
	const avatarFile = formData.get("avatar");
	if (avatarFile instanceof File && avatarFile.size > 0) {
		try {
			// We can reuse the existing uploadUserAvatar from profile api
			// But we need to import it. Since this is a client-side function, it's fine.
			// However, to avoid circular deps or path issues, let's just do a fetch here
			// or dynamically import.
			// Let's try a direct fetch to keep it self-contained in this helper
			const uploadData = new FormData();
			uploadData.append("avatar", avatarFile);

			await fetch("/user/avatar", {
				method: "POST",
				body: uploadData,
				// credentials included by default in some browsers, but let's be explicit
				// actually, the signup response set the cookie, so subsequent requests send it.
			});
			// We don't strictly fail registration if avatar upload fails, 
			// but we could log it.
		} catch (err) {
			console.error("Avatar upload failed during registration", err);
		}
	}

	// All good
	return {
		ok: true,
		user: data.result as ApiUser,
		message: "Registration successful",
	};
}