import { RotateCw } from "lucide-react";

export default function LoadingOverlay({ isVisible }: { isVisible: boolean }) {
	if (!isVisible) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
			<div className="flex flex-col items-center gap-4 text-white">
				<RotateCw className="w-12 h-12 animate-spin text-emerald-400" />
				<p className="text-lg font-medium tracking-wide animate-pulse">Loading...</p>
			</div>
		</div>
	);
}
