"use client";
import { useCallback, useEffect, RefObject } from "react";

/* --- Theme --- */
export function useThemeMode() {
	const syncThemeVisuals = useCallback(() => {
		const html = document.documentElement;
		const moon = document.getElementById("iconMoon");
		const sun = document.getElementById("iconSun");
		const isGlass = html.classList.contains("has-glass");
		moon?.classList.toggle("hidden", !isGlass);
		sun?.classList.toggle("hidden", isGlass);
		const toggle = document.getElementById("themeToggle");
		toggle?.setAttribute(
			"aria-label",
			isGlass ? "Switch to neon theme" : "Switch to glass theme"
		);
	}, []);

	const toggleTheme = useCallback(() => {
		const html = document.documentElement;
		const supportsGlass =
			CSS.supports("backdrop-filter", "blur(1px)") ||
			CSS.supports("-webkit-backdrop-filter", "blur(1px)");
		if (!supportsGlass) return;
		const toBlack = html.classList.contains("has-glass");
		html.classList.toggle("has-glass", !toBlack);
		html.classList.toggle("no-glass", toBlack);
		html.classList.toggle("neon", toBlack);
		localStorage.setItem("themeMode", toBlack ? "black" : "glass");
		syncThemeVisuals();
	}, [syncThemeVisuals]);

	useEffect(() => {
		const html = document.documentElement;
		const supportsGlass =
			CSS.supports("backdrop-filter", "blur(1px)") ||
			CSS.supports("-webkit-backdrop-filter", "blur(1px)");
		const saved = localStorage.getItem("themeMode");

		if (saved === "black" || (!supportsGlass && !saved)) {
			html.classList.remove("has-glass");
			html.classList.add("no-glass", "neon");
		} else {
			html.classList.remove("no-glass", "neon");
			html.classList.add("has-glass");
			if (!supportsGlass) {
				html.classList.remove("has-glass");
				html.classList.add("no-glass", "neon");
				localStorage.setItem("themeMode", "black");
			}
		}
		syncThemeVisuals();

		function onKey(e: KeyboardEvent) {
			const tag = (document.activeElement?.tagName || "").toLowerCase();
			const isComposing = Boolean(
				(e as KeyboardEvent & { isComposing?: boolean }).isComposing
			);
			if (["input", "textarea", "select"].includes(tag) || isComposing) return;

			if (e.ctrlKey && /g/i.test(e.key)) {
				e.preventDefault();
				if (!supportsGlass) return;
				const toBlack = html.classList.contains("has-glass");
				html.classList.toggle("has-glass", !toBlack);
				html.classList.toggle("no-glass", toBlack);
				html.classList.toggle("neon", toBlack);
				localStorage.setItem("themeMode", toBlack ? "black" : "glass");
				syncThemeVisuals();
			}
			if (e.ctrlKey && /n/i.test(e.key)) {
				e.preventDefault();
				html.classList.toggle("neon");
				syncThemeVisuals();
			}
		}
		const listenerOptions: AddEventListenerOptions = { capture: true };
		window.addEventListener("keydown", onKey, listenerOptions);
		return () => window.removeEventListener("keydown", onKey, listenerOptions);
	}, [syncThemeVisuals]);

	return { syncThemeVisuals, toggleTheme };
}

/* --- Globe canvas --- */
export function useGlobe(canvasRef: RefObject<HTMLCanvasElement | null>) {
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d", { alpha: true });
		if (!ctx) return;

		let W = canvas.width, H = canvas.height, r = Math.min(W, H) * 0.38;
		const t0 = performance.now();

		// Pre-calculate 3D points
		const longs = 24, lats = 12;
		const latSegments = 60; // Reduced from 120
		const lonSegments = 30; // Reduced from 60

		type Point3D = { x: number, y: number, z: number };
		const latPaths: Point3D[][] = [];
		const lonPaths: Point3D[][] = [];

		// Generate latitude lines (rings)
		for (let j = 1; j < lats; j++) {
			const lat = -Math.PI / 2 + (j / lats) * Math.PI;
			const path: Point3D[] = [];
			const y = Math.sin(lat);
			const rLat = Math.cos(lat);

			for (let i = 0; i <= latSegments; i++) {
				const th = (i / latSegments) * Math.PI * 2;
				path.push({
					x: rLat * Math.cos(th),
					y: y,
					z: rLat * Math.sin(th)
				});
			}
			latPaths.push(path);
		}

		// Generate longitude lines (meridians)
		for (let i = 0; i < longs; i++) {
			const lon = (i / longs) * Math.PI * 2;
			const path: Point3D[] = [];
			const cosLon = Math.cos(lon);
			const sinLon = Math.sin(lon);

			for (let j = 0; j <= lonSegments; j++) {
				const ph = -Math.PI / 2 + (j / lonSegments) * Math.PI;
				path.push({
					x: Math.cos(ph) * cosLon,
					y: Math.sin(ph),
					z: Math.cos(ph) * sinLon
				});
			}
			lonPaths.push(path);
		}

		let raf = 0;
		const draw = (now: number) => {
			const angle = ((now - t0) * 0.001) * 0.4; // Slower rotation
			const cy = Math.cos(angle);
			const sy = Math.sin(angle);

			ctx.clearRect(0, 0, W, H);
			ctx.lineWidth = 1.2;

			const isNoGlass = document.documentElement.classList.contains("no-glass");
			const s = isNoGlass ? "rgba(255,63,179,.85)" : "rgba(255,255,255,.88)";

			ctx.strokeStyle = s;
			ctx.shadowColor = s;
			ctx.shadowBlur = 8;

			// Helper to project and draw a path
			const drawPath = (path: Point3D[], alpha: number) => {
				ctx.globalAlpha = alpha;
				ctx.beginPath();
				let first = true;

				for (let i = 0; i < path.length; i++) {
					const p = path[i];
					// Rotate around Y axis
					const X = p.x * cy + p.z * sy;
					const Z = -p.x * sy + p.z * cy;

					// Perspective projection
					// Z ranges from -1 to 1 roughly. 
					// We want points in front (Z > 0) to be larger? 
					// Original code: s = 1 / (1 + Z * 0.9) where Z was calculated differently.
					// Let's match the original projection logic roughly but optimized.

					const scale = 1 / (1 - Z * 0.3); // Simple perspective
					const x2d = W / 2 + X * r * scale;
					const y2d = H / 2 + p.y * r * scale;

					if (first) {
						ctx.moveTo(x2d, y2d);
						first = false;
					} else {
						ctx.lineTo(x2d, y2d);
					}
				}
				ctx.stroke();
			};

			for (const path of latPaths) drawPath(path, 0.65);
			for (const path of lonPaths) drawPath(path, 0.9);

			// Glow
			const grd = ctx.createRadialGradient(W / 2, H / 2, r * .05, W / 2, H / 2, r * 1.0);
			grd.addColorStop(0, isNoGlass ? "rgba(255,63,179,.35)" : "rgba(255,255,255,.25)");
			grd.addColorStop(1, "rgba(0,0,0,0)");
			ctx.fillStyle = grd;
			ctx.globalAlpha = 1;
			ctx.beginPath();
			ctx.arc(W / 2, H / 2, r * .95, 0, Math.PI * 2);
			ctx.fill();

			raf = requestAnimationFrame(draw);
		};
		raf = requestAnimationFrame(draw);

		const resize = () => {
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			const box = canvas.getBoundingClientRect();
			if (canvas.width !== Math.floor(box.width * dpr) || canvas.height !== Math.floor(box.height * dpr)) {
				canvas.width = Math.floor(box.width * dpr);
				canvas.height = Math.floor(box.height * dpr);
				ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			}
			W = canvas.width / dpr;
			H = canvas.height / dpr;
			r = Math.min(W, H) * .38;
		};
		resize();
		const ro = new ResizeObserver(resize); ro.observe(canvas);

		return () => { cancelAnimationFrame(raf); ro.disconnect(); };
	}, [canvasRef]);
}

/* --- Typewriter --- */
export function useTypewriter(slotRef: RefObject<HTMLElement | null>, texts: string[]) {
	useEffect(() => {
		const slot = slotRef.current;
		if (!slot) return;

		let i = 0, pos = 0, dir: 1 | -1 = 1, stop = false;
		const pause = (ms: number) => new Promise(r => setTimeout(r, ms));

		(async function run() {
			while (!stop) {
				const txt = texts[i];
				if (dir === 1) {
					slot.textContent = txt.slice(0, ++pos);
					if (pos === txt.length) { dir = -1; await pause(1100); }
					else { await pause(38); }
				} else {
					slot.textContent = txt.slice(0, --pos);
					if (pos === 0) { dir = 1; i = (i + 1) % texts.length; await pause(380); }
					else { await pause(22); }
				}
			}
		})();

		return () => { stop = true; };
	}, [slotRef, texts]);
}



const BACKEND_URL = "http://localhost:5555";

type ApiUser = {
	id: number;
	nickname: string;
	email: string;
	avatar: string;
	is_two_factor_enabled: number;
	created_at: string;
};

type LoginResult =
	| { ok: true; user: ApiUser }
	| { ok: true; twoFactorRequired: true; userId: number }
	| { ok: false; error: string };

export async function submitLogin(email: string, pwd: string): Promise<LoginResult> {
	let res: Response;

	try {
		// 🍪 COOKIE FIX: Use a relative path ("/auth/login") instead of absolute ("http://localhost:5555...").
		// This forces the request to go through the Next.js proxy (defined in next.config.ts).
		// The proxy forwards it to the backend, making the browser treat it as same-origin.
		res = await fetch("/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password: pwd }),
			credentials: "include",          // For middleware
		});
	} catch (e) {
		// REAL network error (server down, DNS, etc.)
		return { ok: false, error: "Network error while logging in" };
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

	// HTTP error (e.g. 400, 500) → show backend message if exists
	if (!res.ok) {
		const msg =
			data?.result || data?.message || `Server error (${res.status})`;
		return { ok: false, error: msg };
	}

	// Backend logical failure: success: false
	if (!data.success) {
		// e.g. "invalid credentials"
		return {
			ok: false,
			error: data.result || "Login failed",
		};
	}

	// Check for 2FA requirement
	if (data.result && data.result.twoFactorRequired) {
		return {
			ok: true,
			twoFactorRequired: true,
			userId: data.result.userId,
		};
	}

	// Success
	return {
		ok: true,
		user: data.result as ApiUser,
	};
}

export async function submitLogin2FA(userId: number, code: string): Promise<LoginResult> {
	let res: Response;
	try {
		res = await fetch("/auth/login/2fa", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id: userId, token_2fa: code }),
		});
	} catch (e) {
		return { ok: false, error: "Network error during 2FA" };
	}

	let data: any = null;
	try {
		data = await res.json();
	} catch {
		if (!res.ok) return { ok: false, error: `Server error (${res.status})` };
		return { ok: false, error: "Unexpected server response" };
	}

	if (!res.ok) {
		const msg = data?.result || data?.message || `Server error (${res.status})`;
		return { ok: false, error: msg };
	}

	if (!data.success) {
		return { ok: false, error: data.result || "Invalid code" };
	}

	return { ok: true, user: data.result as ApiUser };
}

// Keep this for enabling 2FA from settings
export async function submit2FAVerify(email: string, code: string): Promise<LoginResult> {
	let res: Response;
	try {
		res = await fetch("/auth/2fa/verify", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, code }),
		});
	} catch (e) {
		return { ok: false, error: "Network error during 2FA" };
	}

	let data: any = null;
	try {
		data = await res.json();
	} catch {
		if (!res.ok) return { ok: false, error: `Server error (${res.status})` };
		return { ok: false, error: "Unexpected server response" };
	}

	if (!res.ok) {
		const msg = data?.result || data?.message || `Server error (${res.status})`;
		return { ok: false, error: msg };
	}

	if (!data.success) {
		return { ok: false, error: data.result || "Invalid code" };
	}

	return { ok: true, user: data.result as ApiUser };
}


//simulate 2FA is true
//export async function submitLogin(email: string, pwd: string): Promise<LoginResult> {
//	let res: Response;

//	try {
//		res = await fetch(`${BACKEND_URL}/auth/login`, {
//			method: "POST",
//			headers: { "Content-Type": "application/json" },
//			body: JSON.stringify({ email, password: pwd }),
//		});
//	} catch (e) {
//		// REAL network error (server down, DNS, etc.)
//		return { ok: false, error: "Network error while logging in" };
//	}

//	let data: any = null;
//	try {
//		data = await res.json();
//	} catch {
//		if (!res.ok) {
//			return { ok: false, error: `Server error (${res.status})` };
//		}
//		return { ok: false, error: "Unexpected server response" };
//	}

//	// HTTP error (e.g. 400, 500) → show backend message if exists
//	if (!res.ok) {
//		const msg =
//			data?.result || data?.message || `Server error (${res.status})`;
//		return { ok: false, error: msg };
//	}

//	// Backend logical failure: success: false
//	if (!data.success) {
//		// e.g. "invalid credentials"
//		return {
//			ok: false,
//			error: data.result || "Login failed",
//		};
//	}

//	// ✅ Success
//	const user = data.result as ApiUser;

//	// 🔴 TEMP DEV HACK: force 2FA ON for this account so you can test the flow
//	if (user.email === "test@gmail.com") {
//		user.is_two_factor_enabled = 1;
//	}

//	return {
//		ok: true,
//		user,
//	};
//}