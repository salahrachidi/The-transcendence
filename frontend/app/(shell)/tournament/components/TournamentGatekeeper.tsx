"use client";

import { useRouter } from "next/navigation";
import { Trophy, ArrowLeft, Play } from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";

export default function TournamentGatekeeper() {
	const router = useRouter();
	const { t } = useLanguage();

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			{/* Backdrop with heavy blur */}
			<div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

			{/* Modal Content */}
			<div className="relative z-10 w-full max-w-md bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
				<div className="w-16 h-16 rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center mb-6 shadow-lg shadow-pink-500/25">
					<Trophy className="w-8 h-8 text-white" />
				</div>

				<h2 className="text-2xl font-bold text-white mb-2">{t("tournament.gatekeeper.title")}</h2>
				<p className="text-white/60 mb-8 leading-relaxed">
					{t("tournament.gatekeeper.message")}
				</p>

				<div className="flex flex-col gap-3 w-full">
					<button
						onClick={() => router.push("/dashboard?action=new-tournament")}
						className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-medium transition-colors shadow-lg shadow-fuchsia-500/20 group cursor-pointer"
					>
						<Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
						{t("tournament.gatekeeper.create")}
					</button>

					<button
						onClick={() => router.push("/dashboard")}
						className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white font-medium transition-colors border border-white/5 hover:border-white/20 cursor-pointer"
					>
						<ArrowLeft className="w-4 h-4" />
						{t("tournament.gatekeeper.back")}
					</button>
				</div>
			</div>
		</div>
	);
}
