
export type MatchData = {
	id?: number;
	created_at?: string;
	finished_at?: string;
	player1_id: number;
	player2_id: number;
	player1_score: number;
	player2_score: number;
	winner_id: number;
	bestOf: number;
	delta?: number;
	mode: string;
};

export async function createMatch(data: MatchData) {
	const res = await fetch('/match/', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	});
	if (!res.ok) throw new Error('Failed to create match');
	return res.json();
}

export async function getMatchById(id: number) {
	const res = await fetch(`/match/${id}`);
	if (!res.ok) throw new Error('Failed to fetch match');
	return res.json();
}

export async function getUserMatches(userId: number, limit = 10) {
	const res = await fetch(`/match/user/${userId}?limit=${limit}`, {
		//added by xeloda: fetch call wasn't sending your login cookies.
		credentials: 'include'
	});
	if (!res.ok) throw new Error('Failed to fetch user matches');
	const data = await res.json();
	return data.result;
}
