export type VerifiedUser = {
	id: number;
	nickname: string;
	avatar: string;
};

export async function verifyPlayerCredentials(nickname: string, password: string): Promise<VerifiedUser | null> {
	try {
		const res = await fetch("/auth/verify", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ nickname, password }),
		});

		if (!res.ok) {
			return null;
		}

		const data = await res.json();
		if (data.success) {
			return data.result as VerifiedUser;
		}
		return null;
	} catch (error) {
		console.error("Error verifying player:", error);
		return null;
	}
}
