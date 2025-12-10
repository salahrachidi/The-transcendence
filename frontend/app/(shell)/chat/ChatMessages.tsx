import type { ChatMessage } from "./data";
import { Trophy } from "lucide-react";

type ChatMessagesProps = {
	messages: ChatMessage[];
};

export default function ChatMessages({ messages }: ChatMessagesProps) {
	return (
		<>
			{messages.map((message) => {
				// Check for Tournament Notification
				const isTournament = message.text.startsWith("TRN_MSG::");

				if (isTournament) {
					const content = message.text.replace("TRN_MSG::", "");
					return (
						<div key={message.id} className="flex justify-center my-4 animate-in fade-in zoom-in duration-300">
							<div className="bg-gradient-to-br from-amber-500/20 to-yellow-600/20 border border-yellow-500/50 rounded-xl p-3 max-w-[85%] backdrop-blur-sm shadow-[0_0_15px_rgba(234,179,8,0.2)]">
								<div className="flex items-center gap-3 text-yellow-200 mb-1">
									<Trophy className="w-4 h-4 text-yellow-400" />
									<span className="text-xs font-bold uppercase tracking-widest text-yellow-500">Tournament Update</span>
								</div>
								<p className="text-sm font-medium text-white/90 text-center leading-relaxed">
									{content}
								</p>
								<div className="mt-2 text-[10px] text-yellow-500/50 text-center border-t border-yellow-500/10 pt-1">
									{message.time}
								</div>
							</div>
						</div>
					);
				}

				return (
					<div key={message.id}>
						<div className={`msg-row ${message.direction}`}>
							<div className={`bubble ${message.direction}`}>{message.text}</div>
						</div>
						{message.time && (
							<p className={`timestamp ${message.direction === "out" ? "text-right pr-2" : "pl-2"}`}>
								{message.time}
							</p>
						)}
					</div>
				);
			})}
		</>
	);
}
