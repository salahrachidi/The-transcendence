"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Navbar.module.css";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
	Gamepad2,
	LayoutDashboard,
	LogOut,
	MessageCircle,
	Moon,
	Settings,
	Sun,
	Trophy,
	User,
	UserRound,
	Languages,
} from "lucide-react";
import Globe from "./Globe";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import AccessibilityMenu from "./AccessibilityMenu";
type NavbarProps = {
	theme: "glass" | "dark-neon";
	onToggleTheme: () => void;
};

const BACKEND_URL = "http://localhost:5555";

export default function Navbar({ theme, onToggleTheme }: NavbarProps) {
	const router = useRouter();
	const { refreshUser } = useAuth();
	const { language: currentLang, setLanguage, t } = useLanguage();
	const [mobileOpen, setMobileOpen] = useState(false);
	const [langOpen, setLangOpen] = useState(false);
	const [profileOpen, setProfileOpen] = useState(false);
	const langButtonRef = useRef<HTMLButtonElement | null>(null);
	const profileButtonRef = useRef<HTMLButtonElement | null>(null);
	const langMenuRef = useRef<HTMLDivElement | null>(null);
	const profileMenuRef = useRef<HTMLDivElement | null>(null);

	const pathname = usePathname();

	const isActive = (href: string) => {
		if (!pathname) return false;
		if (href === "/profile") {
			return pathname === "/profile" || pathname.startsWith("/profile");
		}
		return pathname === href || pathname.startsWith(href + "/");
	};

	const navLinks = [
		{
			href: "/dashboard",
			label: t("navbar.dashboard"),
			icon: (
				<LayoutDashboard className="w-4 h-4" />
			),
		},
		{
			href: "/profile",
			label: t("navbar.profile"),
			icon: (
				<UserRound className="w-4 h-4" />
			),
		},
		{
			href: "/chat",
			label: t("navbar.chat"),
			icon: (
				<MessageCircle className="w-4 h-4" />
			),
		},
		{
			href: "/game",
			label: t("navbar.game"),
			icon: (
				<Gamepad2 className="w-4 h-4" />
			),
		},
		{
			href: "/tournament",
			label: t("navbar.tournament"),
			icon: (
				<Trophy className="w-4 h-4" />
			),
		},
	];

	const toggleMobile = () => {
		setMobileOpen(open => !open);
		setLangOpen(false);
		setProfileOpen(false);
	};

	const toggleLang = () => {
		setLangOpen(open => !open);
		setProfileOpen(false);
	};

	const toggleProfile = () => {
		setProfileOpen(open => !open);
		setLangOpen(false);
	};

	const closeDropdowns = () => {
		setLangOpen(false);
		setProfileOpen(false);
	};

	const handleLogout = async () => {
		try {
			await fetch("/auth/logout", {
				method: "POST",
				credentials: "include",
			});
		} catch (error) {
			console.error("Logout failed", error); // DEBUG
		} finally {
			// Always redirect to login, even if server fails
			await refreshUser(); // Clear global auth state
			router.push("/login");
			closeDropdowns();
		}
	};

	useEffect(() => {
		if (!langOpen && !profileOpen) {
			return;
		}

		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Node;

			if (
				langOpen &&
				!langMenuRef.current?.contains(target) &&
				!langButtonRef.current?.contains(target)
			) {
				setLangOpen(false);
			}

			if (
				profileOpen &&
				!profileMenuRef.current?.contains(target) &&
				!profileButtonRef.current?.contains(target)
			) {
				setProfileOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [langOpen, profileOpen]);

	return (
		<nav className="sticky top-6 z-50 mx-auto w-full max-w-[min(2100px,92vw)] min-[2560px]:max-w-[2200px]">
			{/* Top bar */}
			<div className="glass rounded-full h-16 px-4 sm:px-6 flex items-center justify-between shadow-lg relative">
				{/* Left: logo + brand */}
				<div className="flex items-center gap-3 min-w-0">
					{/*<div>
						<Globe className="w-12 h-12" />
					</div>*/}
					<span className={`font-semibold tracking-wide ${styles.clamp1}`}>ft_transcendence</span>
				</div>

				{/* Center: navigation chips (desktop) */}
				<div className={`hidden lg:block max-w-[70vw] 2xl:max-w-[1200px] overflow-x-auto ${styles.noScrollbar}`}>
					<ul className="flex items-center gap-2 px-1">
						{navLinks.map(link => (
							<li key={link.href}>
								<Link
									href={link.href}
									className="chip nav-chip"
									data-active={isActive(link.href)}
								>
									{link.icon}
									<span>{link.label}</span>
								</Link>
							</li>
						))}
					</ul>
				</div>
				<div className="flex items-center gap-2 relative">
					{/* Theme toggle */}
					<button
						type="button"
						aria-label="Toggle theme"
						className="cursor-pointer w-9 h-9 rounded-full bg-white/20 border border-white/30 grid place-items-center"
						onClick={onToggleTheme}
					>
						{theme === "dark-neon" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
					</button>

					{/* Accessibility Menu (desktop) */}
					<div className="hidden sm:block">
						<AccessibilityMenu variant="navbar" />
					</div>

					{/* Language Switcher (desktop) */}
					<button
						type="button"
						aria-label="Change language"
						className="cursor-pointer hidden sm:grid w-9 h-9 rounded-full bg-white/10 border border-white/28 place-items-center relative"
						onClick={toggleLang}
						ref={langButtonRef}
					>
						<Languages className="w-5 h-5" />
						<span className="absolute -bottom-1 -right-1 text-[10px] font-bold bg-black/50 text-white px-1 rounded">
							{currentLang}
						</span>
					</button>

					{/* Profile (desktop) */}
					<button
						type="button"
						aria-label="Open profile menu"
						className="cursor-pointer hidden sm:grid w-9 h-9 rounded-full bg-white/25 border border-white/40 place-items-center font-semibold text-xs"
						onClick={toggleProfile}
						ref={profileButtonRef}
					>
						<User className="w-5 h-5" />
					</button>

					{/* Mobile nav toggle */}
					<button
						type="button"
						aria-label="Toggle navigation"
						className="cursor-pointer lg:hidden w-9 h-9 rounded-full bg-white/20 border border-white/30 grid place-items-center"
						onClick={toggleMobile}
					>
						<svg
							viewBox="0 0 24 24"
							className="w-5 h-5"
							fill="none"
							stroke="currentColor"
							strokeWidth={2}
						>
							<path d="M3 6h18M3 12h18M3 18h18" />
						</svg>
					</button>

					{/* Language dropdown */}
					{langOpen && (
						<div
							ref={langMenuRef}
							className="menu-panel absolute right-0 top-[calc(100%+0.5rem)] w-40 max-w-[min(92vw,10rem)] z-50"
						>
							<div className="menu-panel-header">
								<span className="menu-panel-title">{t("navbar.language")}</span>
							</div>
							<div className="menu-panel-list p-1">
								{["EN", "FR", "AR"].map((lang) => (
									<button
										key={lang}
										type="button"
										className={`menu-item-button w-full text-left px-3 py-2 rounded-md transition-colors ${currentLang === lang ? "bg-white/10 font-bold" : "hover:bg-white/5"
											}`}
										onClick={() => {
											setLanguage(lang as any);
											closeDropdowns();
										}}
									>
										{lang === "EN" && "English"}
										{lang === "FR" && "Français"}
										{lang === "AR" && "العربية"}
									</button>
								))}
							</div>
						</div>
					)}

					{/* Profile dropdown */}
					{profileOpen && (
						<div
							ref={profileMenuRef}
							className="menu-panel absolute right-0 top-[calc(100%+0.5rem)] w-56 max-w-[min(92vw,14rem)] z-50"
						>
							<div className="menu-panel-header">
								<span className="menu-panel-title">{t("navbar.profile")}</span>
							</div>
							<div className="menu-panel-list">
								<Link
									href="/profile?tab=info"
									className="cursor-pointer menu-item-button flex items-center gap-2"
									role="button"
									onClick={closeDropdowns}
								>
									<UserRound className="w-4 h-4" />
									{t("navbar.viewProfile")}
								</Link>
								<Link
									href="/profile?tab=settings"
									className="cursor-pointer menu-item-button flex items-center gap-2"
									role="button"
									onClick={closeDropdowns}
								>
									<Settings className="w-4 h-4" />
									{t("navbar.settings")}
								</Link>
								<button
									type="button"
									className="cursor-pointer menu-item-button text-red-300 flex items-center gap-2 w-full text-left"
									onClick={handleLogout}
								>
									<LogOut className="w-4 h-4" />
									{t("navbar.logout")}
								</button>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Mobile menu */}
			<div
				className={`lg:hidden mt-2 origin-top transition-all duration-300 ease-out ${mobileOpen ? "scale-y-100 max-h-[480px] opacity-100" : "scale-y-0 max-h-0 opacity-0"
					}`}
			>
				<div className="glass rounded-2xl p-3 border border-white/30">
					{/* Mobile Controls Row */}
					<div className="flex items-center justify-between mb-4 px-2 pb-3 border-b border-white/10">
						<AccessibilityMenu variant="navbar" />
						<div className="flex items-center gap-3">
							<button
								type="button"
								aria-label="Toggle theme"
								className="cursor-pointer w-9 h-9 rounded-full bg-white/10 border border-white/20 grid place-items-center"
								onClick={onToggleTheme}
							>
								{theme === "dark-neon" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
							</button>
							<button
								type="button"
								aria-label="Change language"
								className="cursor-pointer w-9 h-9 rounded-full bg-white/10 border border-white/20 grid place-items-center text-xs font-bold"
								onClick={() => {
									const langs = ["EN", "FR", "AR"] as const;
									const next = langs[(langs.indexOf(currentLang) + 1) % langs.length];
									setLanguage(next);
								}}
							>
								{currentLang}
							</button>
						</div>
					</div>

					<ul className="flex flex-col gap-2">
						{navLinks.map(link => (
							<li key={`mobile-${link.href}`}>
								<Link
									href={link.href}
									className="cursor-pointer chip nav-chip"
									data-active={isActive(link.href)}
									onClick={closeDropdowns}
								>
									{link.label}
								</Link>
							</li>
						))}
					</ul>
				</div>
			</div>
		</nav>
	);
}
