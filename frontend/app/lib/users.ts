
export interface PublicProfile {
	id: number;
	nickname: string;
	avatar: string | null;
}

export async function getUserProfile(userId: number): Promise<PublicProfile | null> {
	try {
		const res = await fetch(`/user/id/${userId}`, { credentials: 'include' });
		if (!res.ok) {
			console.warn(`Failed to fetch user ${userId}: ${res.status}`);
			return null;
		}
		const data = await res.json();
		// The backend returns { success: true, result: { ...user } }
		if (data.success && data.result) {
			return data.result as PublicProfile;
		}
		return null;
	} catch (error) {
		console.error(`Error fetching user profile ${userId}:`, error);
		return null;
	}
}
