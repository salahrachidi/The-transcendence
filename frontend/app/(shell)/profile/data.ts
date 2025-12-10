// app/(shell)/profile/data.ts

import type {
	UserProfile,
	MatchHistoryItem,
	RadarStats,
} from "../dashboard/data";

// Public profile info (what anyone can see)
export type PublicProfile = {
	id: string;
	nickname: string;
	avatarUrl: string;
	createdAt: string;
	lastSeenAt?: string;
};

// Extra stuff only the owner sees (settings page)
export type ProfileSettings = {
	allowFriendRequests: boolean;
	isProfilePrivate: boolean;
	showOnlineStatus: boolean;
	matchHistoryPublic: boolean;
	themePreference: "glass" | "dark-neon";
	//   language: "en" | "fr" | "ar" | string;
};

export type SelfProfile = PublicProfile & {
	email: string;
	settings: ProfileSettings;
};

// Everything the profile *overview tab* might need in one shape
export type ProfileOverview = {
	profile: PublicProfile;
	userStats: UserProfile;
	radar: RadarStats;
	recentMatches: MatchHistoryItem[];
};