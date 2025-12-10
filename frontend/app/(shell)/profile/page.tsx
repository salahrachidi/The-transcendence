// app/(shell)/profile/page.tsx
import type { Metadata } from "next";
import ProfilePageClient from "./ProfilePageClient";

export const metadata: Metadata = {
	title: "Profile",
};

// This page needs the latest search params (tab) on every navigation,
// otherwise Next.js would reuse a cached HTML version and ignore ?tab=.
export const dynamic = "force-dynamic";

export default async function ProfilePage({
	searchParams,
}: {
	searchParams?: Promise<{ tab?: string }>;
}) {
	const params = (await searchParams) ?? {};
	const tabParam = params.tab;
	const initialTab = tabParam === "settings" ? "settings" : "info";

	return <ProfilePageClient initialTab={initialTab} />;
}
