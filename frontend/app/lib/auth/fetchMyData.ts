export type UserProfile = {
	id: number;
	nickname: string;
	email: string;
	avatar: string | null;
	created_at: string;
};

export type UserSocial = {
	friends: any[];
	blocked: any[];
	friend_requests: any[];
};

export type UserGaming = {
	total_games: number;
	number_of_wins: number;
	number_of_loses: number;
	total_delta: number;
};

export type MyDataPayload = {
	profile: UserProfile;
	social: UserSocial;
	gaming: UserGaming;
};

const BACKEND_URL = "http://localhost:5555";

export async function fetchMyData(): Promise<MyDataPayload | null> {
	try {
		// Use relative path for client-side fetching via proxy
		// Also fixed endpoint from /users/my_data to /user/my_data per docs
		const res = await fetch("/user/my_data", {
			method: "GET",
			credentials: "include",
		});

		if (!res.ok) {
			return null;
		}

		const data = await res.json();
		return data as MyDataPayload;
	} catch (error) {
		console.error("Error fetching my data:", error); // DEBUG
		return null;
	}
}
