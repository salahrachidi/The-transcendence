"use client";

import { useState, useEffect } from "react";
import ProfileCover from "./ProfileCover";
import ProfileFormCard from "./ProfileFormCard";
import StatisticsPanel from "../dashboard/StatisticsPanel";
import MatchesPanel from "../dashboard/MatchesPanel";
import Toast, { ToastStatus } from "../../components/Toast";
import { fetchMe, fetchUserById, updateUserProfile, uploadUserAvatar } from "./api";
import { useAuth } from "@/app/context/AuthContext";
import { useLanguage } from "@/app/context/LanguageContext";
import { UserGaming } from "@/app/lib/auth/fetchMyData";

type ProfilePageClientProps = {
	initialTab?: "info" | "settings";
	viewingUserId?: string;
};

export default function ProfilePageClient({ initialTab = "info", viewingUserId }: ProfilePageClientProps) {
	const { refreshUser } = useAuth();
	const { t } = useLanguage();
	const [profile, setProfile] = useState({
		nickname: "",
		email: "",
		avatarUrl: "",
	});
	const [stats, setStats] = useState<UserGaming | null>(null);
	const [userId, setUserId] = useState<number | null>(null);
	const [activeTab, setActiveTab] = useState<"info" | "settings">(initialTab);
	const [submitStatus, setSubmitStatus] = useState<ToastStatus>("idle");
	const [submitMessage, setSubmitMessage] = useState<string | null>(null);

	// Fetch user data on mount
	useEffect(() => {
		async function loadProfile() {
			try {
				// Always fetch "me" first to know who I am (for permission checks)
				const meRes = await fetchMe();
				let myId = null;
				if (meRes.ok) {
					myId = meRes.data.id;
				}

				// If we differ explicitly
				if (viewingUserId && String(viewingUserId) !== String(myId)) {
					// Fetch other user
					const otherRes = await fetchUserById(viewingUserId);
					if (otherRes.ok) {
						setProfile({
							nickname: otherRes.data.nickname,
							email: otherRes.data.email,
							avatarUrl: otherRes.data.avatar,
						});
						setStats(otherRes.data.gameStats || null);
						setUserId(otherRes.data.id);
					}
				} else {
					// Fallback to me
					if (meRes.ok) {
						setProfile({
							nickname: meRes.data.nickname,
							email: meRes.data.email,
							avatarUrl: meRes.data.avatar,
						});
						setStats(meRes.data.gameStats || null);
						setUserId(meRes.data.id);
					}
				}
			} catch (err) {
				console.error("Failed to load profile", err);
			}
		}
		loadProfile();
	}, [viewingUserId]);

	useEffect(() => {
		setActiveTab(initialTab);
	}, [initialTab]);

	useEffect(() => {
		if (submitStatus === "success" || submitStatus === "error") {
			const timeout = setTimeout(() => {
				setSubmitStatus("idle");
				setSubmitMessage(null);
			}, 4000);

			return () => clearTimeout(timeout);
		}
	}, [submitStatus]);
	const [isMe, setIsMe] = useState(true);

	useEffect(() => {
		if (!viewingUserId) {
			setIsMe(true);
			return;
		}

		fetchMe().then(res => {
			if (res.ok) {
				setIsMe(String(res.data.id) === String(viewingUserId));
			}
		});
	}, [viewingUserId]);

	const canEdit = isMe;

	const handleProfileSubmit = async (payload: any) => {
		const { avatarFile, ...rest } = payload ?? {};

		setSubmitStatus("loading");
		setSubmitMessage(null);

		try {
			// 1. Upload Avatar if present
			if (avatarFile instanceof File) {
				const formData = new FormData();
				formData.append("avatar", avatarFile);
				const avatarRes = await uploadUserAvatar(formData);
				if (!avatarRes.ok) {
					setSubmitStatus("error");
					setSubmitMessage(avatarRes.error || t("profile.errorUpdate"));
					return;
				}
				// Update local state with new avatar URL (assuming backend returns it, or we refetch)
				// For now, let's assume we refetch or just trust the upload
			}

			// 2. Update Profile Data (nickname, email, password)
			// Only proceed if there are changes to update
			if (Object.keys(rest).length > 0 && userId) {
				// Map frontend keys to backend keys
				const apiPayload: any = {
					nickname: rest.nickname,
					email: rest.email,
				};
				if (rest.password && rest.currentPassword) {
					apiPayload.new_password = rest.password;
					apiPayload.current_password = rest.currentPassword;
				}

				const updateRes = await updateUserProfile(userId, apiPayload);
				if (!updateRes.ok) {
					setSubmitStatus("error");
					setSubmitMessage(updateRes.error || t("profile.errorUpdate"));
					return;
				}
			}

			// Refetch to get latest state (cleanest way)
			const meRes = await fetchMe();
			if (meRes.ok) {
				setProfile({
					nickname: meRes.data.nickname,
					email: meRes.data.email,
					avatarUrl: meRes.data.avatar,
				});
				// Update global auth context so dashboard reflects changes immediately
				await refreshUser();
			}

			console.log("Profile update succeeded"); // DEBUG
			setSubmitStatus("success");
			setSubmitMessage(t("profile.successUpdate"));
		} catch (err) {
			console.error("Profile update error:", err); // DEBUG
			setSubmitStatus("error");
			setSubmitMessage(t("profile.errorUpdate"));
		}
	};

	return (
		<>
			{/* ========== ROW 1: Cover + Header ========== */}
			<div className="grid grid-cols-12 sm:gap-4 md:gap-5 lg:gap-6 2xl:gap-8 min-w-0 h-auto">
				<section className="col-span-12 min-w-0 h-auto">
					<ProfileCover nickname={profile.nickname} avatarUrl={profile.avatarUrl} stats={stats} />
				</section>
			</div>
			{/* ========== TABS: Profile / Settings ========== */}
			<div className="mt-2 flex gap-2 border-b border-white/10 text-sm pb-2">
				<button
					type="button"
					onClick={() => setActiveTab("info")}
					className={
						"chip cursor-pointer px-4 py-1.5 transition-colors " +
						(activeTab === "info"
							? "bg-white/25 border-white/60"
							: "bg-transparent border-white/25 opacity-75")
					}
				>
					{t("profile.tabInfo")}
				</button>

				{canEdit && (
					<button
						type="button"
						onClick={() => setActiveTab("settings")}
						className={
							"chip cursor-pointer px-4 py-1.5 transition-colors " +
							(activeTab === "settings"
								? "bg-white/25 border-white/60"
								: "bg-transparent border-white/25 opacity-75")
						}
					>
						{t("profile.tabSettings")}
					</button>
				)}
			</div>
			{/* ========== ROW 2: Profile / Settings content ========== */}
			<div className="grid grid-cols-12 sm:gap-4 md:gap-5 lg:gap-6 2xl:gap-8 min-w-0 h-auto mt-6" style={{ backdropFilter: "var(--glass-blur)", WebkitBackdropFilter: "var(--glass-blur)" }}>
				<section className="col-span-12 min-w-0 h-auto">
					{activeTab === "info" && (
						<div className="grid grid-cols-12 sm:gap-4 md:gap-5 lg:gap-6 2xl:gap-8 min-w-0 h-auto animate-fade-in">
							{/* Statistics (left) */}
							<section className="col-span-12 xl:col-span-6 min-w-0 h-auto">
								<StatisticsPanel className="h-[29rem]!" stats={stats} />
							</section>

							{/* Matches (right) */}
							<section className="col-span-12 xl:col-span-6 min-w-0 h-auto">
								<MatchesPanel className="h-[29rem]!" userId={userId ?? undefined} />
							</section>
						</div>
					)}

					{activeTab === "settings" && canEdit && (
						<div className="animate-fade-in">
							<ProfileFormCard
								initialNickname={profile.nickname}
								initialEmail={profile.email}
								initialAvatarUrl={profile.avatarUrl}
								onProfileChange={patch =>
									setProfile(prev => ({ ...prev, ...patch }))
								}
								onSubmit={handleProfileSubmit}
							/>
						</div>
					)}
				</section>
			</div>
			<Toast status={submitStatus} message={submitMessage} />
		</>
	);
}