"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchMyData, MyDataPayload } from "../lib/auth/fetchMyData";

type AuthContextType = {
	user: MyDataPayload["profile"] | null;
	stats: MyDataPayload["gaming"] | null;
	loading: boolean;
	error: string | null;
	refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<MyDataPayload["profile"] | null>(null);
	const [stats, setStats] = useState<MyDataPayload["gaming"] | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const router = useRouter(); // You need to add import { useRouter } from "next/navigation"; at top

	const refreshUser = async () => {
		try {
			setLoading(true);
			const data = await fetchMyData();
			//console.log("AuthContext: fetchMyData result:", data); // DEBUG
			if (data) {
				setUser(data.profile);
				setStats(data.gaming);
				setError(null);
			} else {
				setUser(null);
				setStats(null);
				// If we expected data (token exists per middleware) but got none, the token is likely invalid.
				// Redirect to login to clear state.
				router.push("/login");
			}
		} catch (err) {
			console.error("AuthContext error:", err);
			setError("Failed to fetch user data");
			setUser(null);
			setStats(null);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		refreshUser();
	}, []);

	return (
		<AuthContext.Provider value={{ user, stats, loading, error, refreshUser }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
