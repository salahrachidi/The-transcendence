
import type { Metadata } from "next";
import ProfilePageClient from "../ProfilePageClient";

export const metadata: Metadata = {
	title: "User Profile",
};

export const dynamic = "force-dynamic";

export default async function OtherProfilePage({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams?: Promise<{ tab?: string }>;
}) {
	const resolvedParams = await params;
	const userId = resolvedParams.id;

	const resolvedSearchParams = (await searchParams) ?? {};
	const tabParam = resolvedSearchParams.tab;
	const initialTab = tabParam === "settings" ? "settings" : "info";

	return <ProfilePageClient initialTab={initialTab} viewingUserId={userId} />;
}
