import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "images.unsplash.com",
			},
		],
	},
	// -------------------------------------------------------------------------
	// 🍪 COOKIE FIX & DOCKER NETWORKING EXPLANATION
	// -------------------------------------------------------------------------
	// Problem: Browsers reject "SameSite=Lax" cookies when sent from a different port (3000 -> 5555).
	// Solution: We use Next.js Rewrites to "proxy" requests.
	// 1. The browser sends requests to the frontend (localhost:3000/auth/...).
	// 2. Next.js forwards them to the backend (http://backend:5555/auth/...).
	// 3. To the browser, it looks like a "same-origin" request, so cookies are accepted.
	//
	// Note: We use "http://backend:5555" because inside Docker, "localhost" refers to the container itself.
	// We must use the service name "backend" to reach the other container.
	async rewrites() {
		return [
			{
				source: "/auth/:path*",
				destination: "http://backend:5555/auth/:path*",
			},
			{
				source: "/user/:path*",
				destination: "http://backend:5555/user/:path*",
			},
			{
				source: "/social/:path*",
				destination: "http://backend:5555/social/:path*",
			},
			{
				source: "/chat/:path*",
				destination: "http://backend:5555/chat/:path*",
			},
			{
				source: "/ws/chat",
				destination: "http://backend:5555/chat",
			},
			//added by exloda: add game websocket proxy
			{
				source: "/ws/game",
				destination: "http://backend:5555/ws",
			},
			{
				source: "/ws",
				destination: "http://backend:5555/ws",
			},
			{
				source: "/uploads/:path*",
				destination: "http://backend:5555/uploads/:path*",
			},
			{
				source: "/friend/:path*",
				destination: "http://backend:5555/friend/:path*",
			},
			{
				source: "/api/gameState/:path*",
				destination: "http://backend:5555/gameState/:path*",
			},
			{
				source: "/match/:path*",
				destination: "http://backend:5555/match/:path*",
			},
		];
	},
};

//! DON'T TOUCH THIS UNLESS YOU KNOW WHAT YOU ARE DOING
//module.exports = {
//	typescript: {
//		ignoreBuildErrors: true,
//	},
//};

module.exports = nextConfig;
