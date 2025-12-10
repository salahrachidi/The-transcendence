"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import Avatar from "@/app/components/Avatar";
import { useLanguage } from "../../context/LanguageContext";
import { fetchFriends, Friend } from "../chat/api";

export default function OnlinePanel() {
	const { t } = useLanguage();
	const [friends, setFriends] = useState<Friend[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function loadFriends() {
			try {
				const data = await fetchFriends();
				setFriends(data);
			} catch (error) {
				console.error("Failed to load friends", error);
			} finally {
				setLoading(false);
			}
		}
		loadFriends();
	}, []);

	return (
		<div className="glass card-radius shadow-xl p-3 w-full h-full flex flex-col">
			{/* Header */}
			<div className="flex flex-col items-center gap-1">
				<div className="w-8 h-8 rounded-full bg-white/30 grid place-items-center">
					<Users className="w-5 h-5" />
				</div>
				<p className="text-[11px] uppercase tracking-[0.18em] text-white/70">
					{t("dashboard.friendsList")}
				</p>
				<p className="text-[11px] text-white/60">
					{friends.length} {friends.length === 1 ? t("dashboard.friend") : t("dashboard.friends")}
				</p>
			</div>

			{/* List */}
			<div className="mt-3 flex-1 min-h-0">
				<ul
					className="
            w-full
            grid gap-3
            grid-cols-4
            sm:grid-cols-5
            lg:grid-cols-6
            xl:grid-cols-1
          "
				>
					{loading && Array.from({ length: 3 }).map((_, i) => (
						<li key={i} className="flex flex-col items-center gap-1 text-center animate-pulse opacity-50">
							<div className="w-10 h-10 rounded-full bg-white/20" />
							<div className="h-2 w-12 bg-white/20 rounded" />
						</li>
					))}

					{!loading && friends.map(friend => (
						<li
							key={friend.id}
							className="flex flex-col items-center gap-1 text-center"
						>
							<div className="w-10 h-10 min-[1600px]:w-11 min-[1600px]:h-11 rounded-full overflow-hidden border border-white/40 bg-white/30">
								<Avatar
									src={friend.avatar}
									alt={friend.nickname}
									className="w-full h-full object-cover"
									size={20}
								/>
							</div>
							<div className="cursor-pointer text-[11px] truncate w-full">
								{friend.nickname}
							</div>
							<div className="flex items-center justify-center gap-1 text-[10px] text-white/70">
								<span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
								<span>Friend</span>
							</div>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}
