// app/(auth)/login/page.tsx
"use client";

import "./login.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useThemeMode, useTypewriter, submitLogin } from "./login";
import Globe from "../../components/Globe";
import { useAuth } from "@/app/context/AuthContext";
import { useLanguage } from "@/app/context/LanguageContext";
import AuthLanguageSelector from "@/app/components/AuthLanguageSelector";
import AccessibilityMenu from "@/app/components/AccessibilityMenu";

import Toast, { ToastStatus } from "../../components/Toast";

export default function LoginPage() {
	const router = useRouter();
	const { refreshUser } = useAuth();
	const { t } = useLanguage();
	// form state (minimal)
	const [email, setEmail] = useState("");
	const [pwd, setPwd] = useState("");
	const [showPwd, setShowPwd] = useState(false);
	const [rememberMe, setRememberMe] = useState(false);
	const [busy, setBusy] = useState(false);

	// Toast state
	const [toastStatus, setToastStatus] = useState<ToastStatus>("idle");
	const [toastMessage, setToastMessage] = useState<string | null>(null);

	const btnRef = useRef<HTMLButtonElement | null>(null);

	// slogan & canvas refs
	const sloganRef = useRef<HTMLSpanElement | null>(null);
	// Theme setup + hotkeys (Ctrl+G / Ctrl+N)
	const { toggleTheme } = useThemeMode();

	// Load saved email on mount
	useEffect(() => {
		const savedEmail = localStorage.getItem("remembered_email");
		if (savedEmail) {
			setEmail(savedEmail);
			setRememberMe(true);
		}
	}, []);

	// Simple validation toggle (email required + pwd required)
	const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
	const isValid = validEmail && pwd.length > 0;

	// Canvas globe
	// useGlobe(canvasRef);
	// Typewriter
	useTypewriter(sloganRef, [
		"Insert Coin to Transcend.",
		"You vs You.",
		"No Pain, No Pong.",
		"Glass on. Neon ready.",
	]);

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!isValid) return;

		// Remember Me
		if (rememberMe) {
			localStorage.setItem("remembered_email", email);
		} else {
			localStorage.removeItem("remembered_email");
		}

		setBusy(true);
		setToastStatus("idle");
		setToastMessage(null);

		const result = await submitLogin(email, pwd);

		if (!result.ok) {

			setToastStatus("error");
			setToastMessage(result.error);
			setBusy(false);
			// Removed manual DOM manipulation
			setTimeout(() => {
				setToastStatus("idle");
				setToastMessage(null);
			}, 5000);
			return;
		}

		// ✅ success: handle 2FA vs normal login
		if ("twoFactorRequired" in result && result.twoFactorRequired) {
			setToastMessage(t("auth.login.twoFactorRequired"));
			router.push(`/2fa?userId=${result.userId}`);
			return;
		}

		const { user } = result as { ok: true; user: any };

		setToastStatus("success");
		setToastMessage(t("auth.login.welcomeBack").replace("{{name}}", user.nickname));
		await refreshUser(); // Update global auth state
		router.push("/dashboard");

		// setBusy(false); // Keep busy during redirect
		// Removed manual DOM manipulation

		setTimeout(() => {
			setToastStatus("idle");
			setToastMessage(null);
		}, 5000);
	};

	return (
		<>
			<Toast status={toastStatus} message={toastMessage} />
			{/* subtle grid background */}
			<div className="log_scene" aria-hidden="true">
				<div className="log_bg_grid" />
			</div>

			<div className="log_scope">
				<motion.main
					className="log_wrap"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, ease: "easeOut" }}
				>
					<section className="log_shell mx-auto">
						<div className="log_topbar">
							<div className="log_brand">
								<span className="log_dot" />
								ft_transcendence
							</div>
							<div className="flex items-center gap-3">
								<AccessibilityMenu />
								<AuthLanguageSelector />
								<button
									id="themeToggle"
									type="button"
									aria-label="Toggle theme"
									onClick={toggleTheme}
								>
									{/* moon/sun swap handled by classes */}
									<svg id="iconMoon" viewBox="0 0 24 24" aria-hidden="true" className="">
										<path fill="#fff" d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 1 0 9.8 9.8Z" />
									</svg>
									<svg id="iconSun" viewBox="0 0 24 24" className="hidden">
										<circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
										<path
											d="M12 2v3M12 19v3M2 12h3M19 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
										/>
									</svg>
								</button>
							</div>
						</div>

						<article className="log_card" id="formCard">
							<h1 className="log_title">
								<span>{t("auth.login.title")}</span>
								<span className="log_badge" style={{ marginLeft: "auto" }}>
									{t("auth.login.badge")}
								</span>
							</h1>

							<div className="log_card_split">
								{/* Form */}
								<form id="form-login" noValidate onSubmit={onSubmit}>
									<div className="log_field" id="f_email">
										<label htmlFor="email">{t("auth.login.email")}</label>
										<input
											className="log_ctl"
											id="email"
											name="email"
											type="email"
											placeholder={t("auth.login.emailPlaceholder")}
											autoComplete="email"
											required
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											aria-invalid={email.length > 0 && !validEmail ? "true" : "false"}
										/>
										<div className={`log_hint ${email.length > 0 && !validEmail ? "err" : ""}`} data-hint="">
											{email.length > 0 && !validEmail ? t("auth.login.hintEmail") : ""}
										</div>
									</div>

									<div className="log_field" id="f_password" style={{ marginTop: 12 }}>
										<label htmlFor="password">{t("auth.login.password")}</label>
										<div style={{ position: "relative" }}>
											<input
												className="log_ctl"
												id="password"
												name="password"
												type={showPwd ? "text" : "password"}
												placeholder={t("auth.login.passwordPlaceholder")}
												autoComplete="current-password"
												required
												value={pwd}
												onChange={(e) => setPwd(e.target.value)}
											/>
											<button
												type="button"
												id="togglePwd"
												className="log_peek"
												aria-label={showPwd ? "Hide password" : "Show password"}
												onClick={() => setShowPwd((s) => !s)}
											>
												<svg id="iconEye" viewBox="0 0 24 24" className={`w-5 h-5 ${showPwd ? "hidden" : ""}`} fill="none" stroke="#fff" strokeWidth="2">
													<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
													<circle cx="12" cy="12" r="3" />
												</svg>
												<svg id="iconEyeOff" viewBox="0 0 24 24" className={`w-5 h-5 ${showPwd ? "" : "hidden"}`} fill="none" stroke="#fff" strokeWidth="2">
													<path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a20.83 20.83 0 0 1 5.06-5.94" />
													<path d="M9.9 4.24A10.94 10.94 0 0 1 12 5c7 0 11 7 11 7a20.83 20.83 0 0 1-3.17 4.17" />
													<line x1="1" y1="1" x2="23" y2="23" />
												</svg>
											</button>
										</div>
										<div className="log_hint" data-hint=""></div>
									</div>

									<div className="log_flex_between" style={{ marginTop: 12 }}>
										<label className="log_muted" style={{ display: "flex", gap: 6, alignItems: "center" }}>
											<input
												type="checkbox"
												id="remember"
												checked={rememberMe}
												onChange={(e) => setRememberMe(e.target.checked)}
											/> {t("auth.login.rememberMe")}
										</label>
										{/*<a className="log_muted" href="#">Forgot password?</a>*/}
									</div>

									<button
										id="btnLogin"
										ref={btnRef}
										type="submit"
										className="log_btn"
										style={{ marginTop: 16 }}
										disabled={!isValid || busy}
									>
										{busy ? (
											<span className="flex items-center justify-center gap-2">
												<svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
													<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
													<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
												</svg>
												{t("auth.login.signInLoading")}
											</span>
										) : (
											t("auth.login.signIn")
										)}
									</button>

									<div className="flex gap-3" style={{ marginTop: 12 }}>


										<button
											type="button"
											id="btnGithub"
											className="log_btn oauth flex-1 flex items-center justify-center gap-2"
											aria-label="Continue with GitHub"
											onClick={() => {
												const el = document.getElementById("btnGithub");
												el && (el.textContent = t("auth.login.redirecting"));
												(el as HTMLButtonElement | null)?.setAttribute("aria-busy", "true");
												setTimeout(() => (window.location.href = "/auth/github"), 600);
											}}
										>
											<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="#fff">
												<path d="M12 .5C5.7.5.9 5.3.9 11.6c0 4.9 3.2 9.1 7.6 10.6.6.1.8-.3.8-.6v-2c-3.1.7-3.8-1.3-3.8-1.3-.6-1.4-1.4-1.8-1.4-1.8-1.1-.8.1-.8.1-.8 1.2.1 1.9 1.2 1.9 1.2 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.7-1.6-2.5-.3-5.1-1.3-5.1-5.9 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.6.1-3.3 0 0 1-.3 3.2 1.2.9-.2 1.9-.4 2.9-.4s2 .1 2.9.4c2.2-1.5 3.2-1.2 3.2-1.2.6 1.7.2 3 .1 3.3.8.8 1.2 1.8 1.2 3.1 0 4.6-2.6 5.6-5.1 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.8.8.6 4.4-1.5 7.6-5.7 7.6-10.6C23.1 5.3 18.3.5 12 .5z" />
											</svg>
											<span>{t("auth.login.github")}</span>
										</button>
									</div>

									<p className="log_muted" style={{ marginTop: 8, textAlign: "center" }}>
										{t("auth.login.newHere")} <Link href="/register">{t("auth.login.createAccount")}</Link>
									</p>
								</form>

								{/* Visual module */}
								<div className="log_side_hero">
									<div className="log_crt">
										<Globe className="mx-auto mt-2" />
										<div className="log_type_line">
											<span id="slogan" ref={sloganRef} className="pl-2" />
											<span className="log_caret" aria-hidden="true" />
										</div>
										<div className="log_hint_keys pl-2 pb-2">
											Tip: press <kbd>Ctrl</kbd>+<kbd>G</kbd> to toggle theme
										</div>
									</div>
								</div>
							</div>
						</article>
					</section>
				</motion.main>
			</div>
		</>
	);
}

