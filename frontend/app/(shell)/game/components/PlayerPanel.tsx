import Avatar from "@/app/components/Avatar";

type PlayerPanelProps = {
	side: "left" | "right";
	name?: string;
	avatarUrl?: string;
	keys?: [string, string]; // e.g. ["W","S"] or ["↑","↓"]
};

export default function PlayerPanel({
	side,
	name = "Player",
	avatarUrl,
	keys = ["W", "S"],
}: PlayerPanelProps) {
	return (
		<div className="flex items-center justify-center gap-3 md:gap-4">
			{/* Avatar */}
			<div className="shrink-0">
				<div className="w-16 h-16 md:w-[72px] md:h-[72px] rounded-full overflow-hidden border border-white/25 bg-white/10">
					<Avatar
						src={avatarUrl}
						alt={`${name} avatar`}
						className="w-full h-full object-cover"
						size={24}
					/>
				</div>
			</div>

			{/* Name + controls */}
			<div className="flex flex-col gap-1.5">
				<div className="text-sm md:text-base font-medium text-white/90">{name}</div>
				<div className="flex items-center gap-2">
					{keys.map((k, i) => (
						<div
							key={`${side}-key-${i}`}
							className="w-11 h-11 grid place-items-center text-sm md:text-base
						   rounded-md border border-white/25 bg-white/10"
						>
							{k}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}