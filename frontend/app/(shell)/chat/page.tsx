// app/(shell)/chat/page.tsx
import type { Metadata } from "next";
import ChatPageClient from "./ChatPageClient";

export const metadata: Metadata = {
	title: "Chat",
};

export default function ChatPage() {
	return <ChatPageClient />;
}