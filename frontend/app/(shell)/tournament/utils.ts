export async function sendTournamentNotification(receiverNickname: string, content: string): Promise<boolean> {
	try {
		const res = await fetch("/chat/messages", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				receiver: receiverNickname,
				message: `TRN_MSG::${content}`,
			}),
		});

		const data = await res.json();
		return data.success;
	} catch (error) {
		console.error("Failed to send tournament notification", error);
		return false;
	}
}
