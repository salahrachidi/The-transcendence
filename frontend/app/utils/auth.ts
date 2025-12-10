const BACKEND_URL = "http://localhost:5555";

export async function checkAuth(): Promise<boolean> {
	try {
		// 🍪 COOKIE FIX: Relative path ensures this request goes through the Next.js proxy.
		// This allows the "token" cookie (which is HttpOnly) to be sent with the request.
		// If we used "http://localhost:5555", the browser would block the cookie due to cross-port restrictions.
		const res = await fetch("/user/my_data", {
			cache: "no-store",
			credentials: "include",
		});
		return res.ok;
	} catch (err) {
		console.error("Auth check failed:", err);
		return false;
	}
}
