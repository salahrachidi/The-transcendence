import { Play, X } from "lucide-react";

type MiniScoreboardProps = {
	p1Name: string;
	p2Name: string;
	score: { p1: number; p2: number };
	onClose: () => void;
};

import { useLanguage } from "@/app/context/LanguageContext";

export default function MiniScoreboard({ p1Name, p2Name, score, onClose }: MiniScoreboardProps) {
	const { t } = useLanguage();
	return (
		<div className="w-full bg-white/5 border-b border-white/10 py-2 s-4 relative min-h-[60px] flex items-center justify-center">
			{/* Top Bar */}
			<div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
				<div className="text-[10px] uppercase tracking-widest text-white/50 font-bold bg-white/10 px-2 py-0.5 rounded border border-white/10">
					{t("tournament.scoreboard.bestOf")} 3
				</div>
			</div>

			<div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
				<button
					onClick={onClose}
					className="w-8 h-8 rounded-full bg-white/10 border border-white/10 grid place-items-center hover:bg-white/20 hover:border-white/30 transition-all text-white/70 hover:text-white cursor-pointer"
				>
					<X className="w-4 h-4" />
				</button>
			</div>

			<div className="flex items-center justify-between w-full max-w-2xl mx-auto px-12">
				{/* Player 1 */}
				<div className="flex-1 text-right min-w-0">
					<div className="font-bold text-base md:text-lg truncate text-sky-400">
						{p1Name}
					</div>
				</div>

				{/* Score */}
				<div className="px-6 font-mono text-2xl md:text-4xl font-bold tracking-wider leading-none text-white drop-shadow-lg">
					{score.p1}<span className="text-white/20 mx-2">:</span>{score.p2}
				</div>

				{/* Player 2 */}
				<div className="flex-1 text-left min-w-0">
					<div className="font-bold text-base md:text-lg truncate text-pink-400">
						{p2Name}
					</div>
				</div>
			</div>
		</div>
	);
}
