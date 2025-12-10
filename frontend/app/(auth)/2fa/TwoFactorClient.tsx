"use client";

import "../login/login.css";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, Suspense } from "react";
import { useThemeMode, useTypewriter, submitLogin2FA } from "../login/login";
import Globe from "../../components/Globe";
import Toast, { ToastStatus } from "../../components/Toast";
import { useLanguage } from "@/app/context/LanguageContext";
import AuthLanguageSelector from "@/app/components/AuthLanguageSelector";
import AccessibilityMenu from "@/app/components/AccessibilityMenu";

function TwoFactorContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const userId = searchParams.get("userId") || "";
	const { t } = useLanguage();

	// State
	const [code, setCode] = useState("");
	const [busy, setBusy] = useState(false);
	const [toastStatus, setToastStatus] = useState<ToastStatus>("idle");
	const [toastMessage, setToastMessage] = useState<string | null>(null);

	// Refs
	const btnRef = useRef<HTMLButtonElement | null>(null);
	const sloganRef = useRef<HTMLSpanElement | null>(null);

	// Theme & Visuals
	const { toggleTheme } = useThemeMode();
	// useGlobe(canvasRef);
	useTypewriter(sloganRef, [
		"Security Check.",
		"Verify Identity.",
		"Two Steps Ahead.",
		"Locked & Loaded.",
	]);

	const isValid = code.length >= 6; // Assume 6-digit code

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!isValid || !userId) return;

		setBusy(true);
		setToastStatus("idle");
		setToastMessage(null);

		const btn = btnRef.current;
		// Removed manual DOM manipulation

		const result = await submitLogin2FA(Number(userId), code);

		if (!result.ok) {
			setToastStatus("error");
			setToastMessage(result.error || t("auth.twoFactor.invalid"));
			setBusy(false);
			setBusy(false);
			// Removed manual DOM manipulation
			return;
		}

		// Success
		setToastStatus("success");
		// @ts-ignore
		setToastMessage(t("auth.twoFactor.verified").replace("{{name}}", result.user.nickname));

		// Redirect
		router.push("/dashboard");

		// Cleanup (though we redirect)
		// Cleanup (though we redirect)
		// setBusy(false); // Keep busy during redirect
	};

	return (
		<>
			<Toast status={toastStatus} message={toastMessage} />
			<div className="log_scene" aria-hidden="true">
				<div className="log_bg_grid" />
			</div>

			<div className="log_scope">
				<main className="log_wrap">
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
									<svg id="iconMoon" viewBox="0 0 24 24" aria-hidden="true">
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
								<span>{t("auth.twoFactor.title")}</span>
								<span className="log_badge" style={{ marginLeft: "auto" }}>
									{t("auth.twoFactor.badge")}
								</span>
							</h1>

							<div className="log_card_split">
								{/* Form */}
								<form id="form-2fa" noValidate onSubmit={onSubmit}>
									<p className="log_muted" style={{ marginBottom: 20 }}>
										{t("auth.twoFactor.description")}
									</p>

									<div className="log_field">
										<label htmlFor="code">{t("auth.twoFactor.code")}</label>
										<input
											className="log_ctl"
											id="code"
											name="code"
											type="text"
											placeholder={t("auth.twoFactor.codePlaceholder")}
											autoComplete="one-time-code"
											required
											value={code}
											onChange={(e) => setCode(e.target.value.trim())}
											style={{ letterSpacing: "2px", textAlign: "center", fontSize: "18px" }}
										/>
									</div>

									<button
										id="btnVerify"
										ref={btnRef}
										type="submit"
										className="log_btn"
										style={{ marginTop: 24 }}
										disabled={!isValid || busy}
									>
										{busy ? (
											<span className="flex items-center justify-center gap-2">
												<svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
													<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
													<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
												</svg>
												{t("auth.twoFactor.verifying")}
											</span>
										) : (
											t("auth.twoFactor.verify")
										)}
									</button>

									<div className="log_muted" style={{ marginTop: 16, textAlign: "center" }}>
										<button type="button" className="log_muted" onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
											{t("auth.twoFactor.backToLogin")}
										</button>
									</div>
								</form>

								{/* Visual module */}
								<div className="log_side_hero">
									<div className="log_crt">
										<Globe className="mx-auto" />
										<div className="log_type_line">
											<span id="slogan" ref={sloganRef} className="pl-2" />
											<span className="log_caret" aria-hidden="true" />
										</div>
										<div className="log_hint_keys pl-2 pb-2">
											{t("auth.twoFactor.spamHint")}
										</div>
									</div>
								</div>
							</div>
						</article>
					</section>
				</main>
			</div>
		</>
	);
}

export default function TwoFactorClient() {
	return (
		<Suspense fallback={<div className="log_wrap">Loading...</div>}>
			<TwoFactorContent />
		</Suspense>
	);
}

