"use client";

import "./register.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useThemeMode } from "../login/login";
import {
	isEmail,
	validateNickname,
	avatarIsValid,
	avatarHintText,
	submitRegister,
} from "./register";
import Avatar from "@/app/components/Avatar";
import ConfirmationSlider from "./ConfirmationSlider";
import { useAuth } from "@/app/context/AuthContext";
import { useLanguage } from "@/app/context/LanguageContext";
import AuthLanguageSelector from "@/app/components/AuthLanguageSelector";
import AccessibilityMenu from "@/app/components/AccessibilityMenu";

import Toast, { ToastStatus } from "../../components/Toast";

export default function RegisterClient() {
	const router = useRouter();
	const { toggleTheme } = useThemeMode();
	const { refreshUser } = useAuth();
	const { t } = useLanguage();

	// form state
	const [nickname, setNickname] = useState("");
	const [email, setEmail] = useState("");
	const [pwd, setPwd] = useState("");
	const [pwd2, setPwd2] = useState("");
	const [tos, setTos] = useState(false);
	const [busy, setBusy] = useState(false);

	// Toast state
	const [toastStatus, setToastStatus] = useState<ToastStatus>("idle");
	const [toastMessage, setToastMessage] = useState<string | null>(null);

	// avatar preview
	const [avatar, setAvatar] = useState<File | null>(null);
	const preview = useMemo(() => (avatar ? URL.createObjectURL(avatar) : ""), [avatar]);
	useEffect(() => {
		if (!preview) return;
		return () => URL.revokeObjectURL(preview);
	}, [preview]);

	const nicknameOk = validateNickname(nickname);
	const emailOk = isEmail(email);
	const pwdOk = pwd.length >= 8;
	const confirmOk = pwd === pwd2 && pwd2.length > 0;
	const valid = nicknameOk && emailOk && pwdOk && confirmOk && tos;

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		//setToastStatus(null);
		setToastMessage("");
		setBusy(true);

		// build FormData from form or from your state
		const formData = new FormData(e.currentTarget);
		if (avatar) {
			formData.set("avatar", avatar);
		}

		const result = await submitRegister(formData);

		if (!result.ok) {
			// JUST UI handling, no throw → no error page
			setToastStatus("error");
			setToastMessage(result.error);
			setBusy(false);
			setTimeout(() => {
				setToastStatus("idle");
				setToastMessage(null);
			}, 5000);
			return;
		}

		// success
		setToastStatus("success");
		setToastMessage(result.message || t("auth.register.success"));

		// e.g. redirect after a short delay
		await refreshUser(); // Update global auth state
		router.push("/dashboard");
	}

	// drag & drop handlers
	const dropRef = useRef<HTMLDivElement | null>(null);
	useEffect(() => {
		const el = dropRef.current;
		if (!el) return;
		const handleEnter = (event: DragEvent) => {
			event.preventDefault();
			el.classList.add("dragover");
		};
		const handleLeave = (event: DragEvent) => {
			event.preventDefault();
			el.classList.remove("dragover");
		};
		const handleDrop = (event: DragEvent) => {
			event.preventDefault();
			el.classList.remove("dragover");
			const file = event.dataTransfer?.files?.[0];
			if (file) setAvatar(file);
		};
		el.addEventListener("dragenter", handleEnter);
		el.addEventListener("dragover", handleEnter);
		el.addEventListener("dragleave", handleLeave);
		el.addEventListener("drop", handleDrop);
		return () => {
			el.removeEventListener("dragenter", handleEnter);
			el.removeEventListener("dragover", handleEnter);
			el.removeEventListener("dragleave", handleLeave);
			el.removeEventListener("drop", handleDrop);
		};
	}, []);

	const avatarValid = avatarIsValid(avatar);
	const avatarHasError = Boolean(avatar) && !avatarValid;
	// We might want to translate avatarHintText helper too, or return keys from it.
	// For now, let's leave it or check if we can pass t.
	const avatarHint = avatarHintText(avatar);

	return (
		<>
			<Toast status={toastStatus} message={toastMessage} />
			<div className="reg_scene" aria-hidden="true">
				<div className="reg_bg_grid" />
			</div>

			<main className="reg_wrap text-white reg_scope">
				<motion.section
					className="reg_shell mx-auto"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, ease: "easeOut" }}
				>
					<div className="reg_topbar">
						<div className="reg_brand">
							<span className="reg_dot" />
							ft_transcendence
						</div>
						<div className="flex items-center gap-3">
							<AccessibilityMenu />
							<AuthLanguageSelector />
							<button id="themeToggle" type="button" aria-label="Toggle theme" onClick={toggleTheme}>
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

					<article className="reg_card" id="formCard">
						<h1 className="reg_title flex items-center">
							<span>{t("auth.register.title")}</span>
							<span className="reg_badge ml-auto">{t("auth.register.badge")}</span>
						</h1>

						<form className="reg_form" onSubmit={onSubmit}>
							<div className="reg_row">
								<div
									className="reg_field"
									id="f_nickname"
									aria-invalid={nickname && !nicknameOk ? "true" : "false"}
								>
									<label htmlFor="nickname">{t("auth.register.nickname")}</label>
									<input
										className="reg_ctl"
										id="nickname"
										name="nickname"
										type="text"
										placeholder={t("auth.register.nicknamePlaceholder")}
										pattern="^[a-zA-Z0-9_.]{1,15}$"
										required
										value={nickname}
										onChange={(event) => setNickname(event.target.value)}
									/>
									<div className={`reg_hint${nickname && !nicknameOk ? " err" : ""}`} data-hint>
										{t("auth.register.nicknameHint")}
									</div>
								</div>

								<div
									className="reg_field"
									id="f_email"
									aria-invalid={email && !emailOk ? "true" : "false"}
								>
									<label htmlFor="email">{t("auth.register.email")}</label>
									<input
										className="reg_ctl"
										id="email"
										name="email"
										type="email"
										placeholder={t("auth.register.emailPlaceholder")}
										autoComplete="email"
										required
										value={email}
										onChange={(event) => setEmail(event.target.value)}
									/>
									<div className={`reg_hint${email && !emailOk ? " err" : ""}`} data-hint>
										{email && !emailOk ? t("auth.register.emailHint") : ""}
									</div>
								</div>
							</div>

							<div className="reg_row">
								<div
									className="reg_field"
									id="f_password"
									aria-invalid={pwd.length > 0 && !pwdOk ? "true" : "false"}
								>
									<label htmlFor="password">{t("auth.register.password")}</label>
									<input
										className="reg_ctl"
										id="password"
										name="password"
										type="password"
										placeholder={t("auth.register.passwordPlaceholder")}
										required
										minLength={8}
										autoComplete="new-password"
										value={pwd}
										onChange={(event) => setPwd(event.target.value)}
									/>
									<div className="reg_hint" data-hint>
										{t("auth.register.passwordHint")}
									</div>
								</div>
								<div
									className="reg_field"
									id="f_confirm"
									aria-invalid={pwd2.length > 0 && !confirmOk ? "true" : "false"}
								>
									<label htmlFor="confirm">{t("auth.register.confirmPassword")}</label>
									<input
										className="reg_ctl"
										id="confirm"
										name="confirm"
										type="password"
										placeholder={t("auth.register.confirmPasswordPlaceholder")}
										required
										autoComplete="new-password"
										value={pwd2}
										onChange={(event) => setPwd2(event.target.value)}
									/>
									<div className={`reg_hint${pwd2 && !confirmOk ? " err" : ""}`} data-hint>
										{pwd2 && !confirmOk ? t("auth.register.confirmHint") : ""}
									</div>
								</div>
							</div>

							<div className="reg_row">
								<div
									className="reg_field"
									id="f_avatar"
									aria-invalid={avatarHasError ? "true" : "false"}
								>
									<label htmlFor="avatarFile">{t("auth.register.avatar")}</label>
									<div ref={dropRef} className="reg_upload_wrap">
										<input
											className="reg_upload_file"
											id="avatarFile"
											name="avatarFile"
											type="file"
											accept="image/png,image/jpeg,image/webp,image/gif"
											onChange={(event) => setAvatar(event.target.files?.[0] ?? null)}
										/>
										<div className="reg_upload_ui">
											<div
												className="reg_avatar_preview"
												style={{
													backgroundImage: preview ? `url("${preview}")` : "",
												}}
											/>
											<div className="reg_upload_text">
												<strong>{t("auth.register.dropImage")}</strong> {t("auth.register.orChoose")} <span className="reg_linkish">{t("auth.register.chooseFile")}</span> {t("auth.register.maxSize")}
											</div>
										</div>
									</div>
									<div className={`reg_hint${avatarHasError ? " err" : ""}`} data-hint>
										{avatarHint}
									</div>
								</div>
								<div className="reg_field">
									<label className="mb-0">{t("auth.register.ready")}</label>
									<div className="">
										<ConfirmationSlider confirmed={tos} onConfirm={setTos} />
									</div>
								</div>
							</div>

							<div className="reg_actions">
								<button className="reg_btn w-full" id="submitBtn" type="submit" disabled={!valid || busy} aria-busy={busy}>
									{busy ? (
										<span className="flex items-center justify-center gap-2">
											<svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
												<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
												<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
											</svg>
											{t("auth.register.signUpLoading")}
										</span>
									) : (
										t("auth.register.signUp")
									)}
								</button>
							</div>

							<p className="reg_muted mt-2">
								{t("auth.register.alreadyAccount")}{" "}
								<Link href="/login" className="reg_linkish">
									{t("auth.register.logIn")}
								</Link>
							</p>
						</form>
					</article>
				</motion.section>
			</main >
		</>
	);
}

