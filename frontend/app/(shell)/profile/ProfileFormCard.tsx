import React, {
	useState,
	useEffect,
	ChangeEvent,
	FocusEvent,
	FormEvent,
} from "react";
import Avatar from "@/app/components/Avatar";
import {
	fetchUserData,
	requestAccountDeletion,
	requestAccountAnonymization,
	generate2FA,
	verify2FA,
	disable2FA,
	fetchMe,
} from "./api";
import { useLanguage } from "@/app/context/LanguageContext";


const inputBase =
	"w-full rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm " +
	"placeholder:text-white/60 text-white outline-none " +
	"focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40 " +
	"transition-colors transition-shadow";

const labelBase = "text-sm text-white/90";
const hintBase = "text-[11px] text-white/70";

type FormValues = {
	nickname: string;
	currentPassword: string;
	password: string;
	confirm: string;
	email: string;
	avatarFile: File | null;
};

type FormErrors = {
	nickname?: string;
	currentPassword?: string;
	password?: string;
	confirm?: string;
	email?: string;
	avatar?: string;
};

type TextField = "nickname" | "currentPassword" | "password" | "confirm" | "email";

type ProfileFormCardProps = {
	initialNickname: string;
	initialEmail: string;
	initialAvatarUrl: string;
	onProfileChange: (patch: {
		nickname?: string;
		email?: string;
		avatarUrl?: string;
	}) => void;
	onSubmit?: (payload: FormValues) => Promise<void> | void;
};

const ProfileFormCard: React.FC<ProfileFormCardProps> = ({
	initialNickname,
	initialEmail,
	initialAvatarUrl,
	onProfileChange,
	onSubmit,
}) => {
	const { t } = useLanguage();
	const initial: FormValues = {
		nickname: initialNickname,
		currentPassword: "",
		password: "",
		confirm: "",
		email: initialEmail,
		avatarFile: null,
	};
	const [values, setValues] = useState<FormValues>(initial);
	const [initialValues] = useState<FormValues>(initial);

	const [errors, setErrors] = useState<FormErrors>({});
	const [avatarPreview, setAvatarPreview] = useState<string>(
		initialAvatarUrl || ""
	);

	// Fetch 2FA status on mount
	useEffect(() => {
		fetchMe().then(res => {
			if (res.ok && res.data.is_two_factor_enabled) {
				setIs2FAEnabled(true);
			}
		});
	}, []);

	// Sync state with props when they change (e.g. after fetch)
	useEffect(() => {
		setValues((prev) => ({
			...prev,
			nickname: initialNickname || prev.nickname,
			email: initialEmail || prev.email,
		}));
	}, [initialNickname, initialEmail]);

	// Data & Privacy State
	const [privacyStatus, setPrivacyStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
	const [privacyMessage, setPrivacyMessage] = useState<string | null>(null);

	// 2FA State
	const [is2FAEnabled, setIs2FAEnabled] = useState(false); // Ideally this should come from props or API
	const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
	const [twoFaCode, setTwoFaCode] = useState("");
	const [twoFaStatus, setTwoFaStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
	const [twoFaMessage, setTwoFaMessage] = useState<string | null>(null);

	const handleDownloadData = async () => {
		setPrivacyStatus("loading");
		const res = await fetchUserData();
		if (res.ok) {
			const url = window.URL.createObjectURL(res.data);
			const a = document.createElement("a");
			a.href = url;
			a.download = "my_data.json";
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
			setPrivacyStatus("success");
			setPrivacyMessage(t("profile.successDataDownload"));
		} else {
			setPrivacyStatus("error");
			setPrivacyMessage(res.error);
		}
		setTimeout(() => { setPrivacyStatus("idle"); setPrivacyMessage(null); }, 3000);
	};

	const handleDeleteAccount = async () => {
		if (!confirm(t("profile.confirmDelete"))) return;

		setPrivacyStatus("loading");
		const res = await requestAccountDeletion();
		if (res.ok) {
			setPrivacyStatus("success");
			setPrivacyMessage(t("profile.successDelete"));
			// Ideally redirect to logout or home
			setTimeout(() => window.location.href = "/", 2000);
		} else {
			setPrivacyStatus("error");
			setPrivacyMessage(res.error);
			setTimeout(() => { setPrivacyStatus("idle"); setPrivacyMessage(null); }, 3000);
		}
	};

	const handleAnonymizeAccount = async () => {
		if (!confirm(t("profile.confirmAnonymize"))) return;

		setPrivacyStatus("loading");
		const res = await requestAccountAnonymization();
		if (res.ok) {
			setPrivacyStatus("success");
			setPrivacyMessage(t("profile.successAnonymize"));
			setTimeout(() => window.location.href = "/", 2000);
		} else {
			setPrivacyStatus("error");
			setPrivacyMessage(res.error);
			setTimeout(() => { setPrivacyStatus("idle"); setPrivacyMessage(null); }, 3000);
		}
	};

	const handleSetup2FA = async () => {
		setTwoFaStatus("loading");
		const res = await generate2FA();
		if (res.ok) {
			setQrCodeUrl(res.data);
			setTwoFaStatus("idle");
		} else {
			setTwoFaStatus("error");
			setTwoFaMessage(res.error);
		}
	};

	const handleVerify2FA = async () => {
		if (!twoFaCode) return;
		setTwoFaStatus("loading");
		const res = await verify2FA(twoFaCode);
		if (res.ok) {
			setTwoFaStatus("success");
			setTwoFaMessage(t("profile.success2FAEnabled"));
			setIs2FAEnabled(true);
			setQrCodeUrl(null);
			setTwoFaCode("");
		} else {
			setTwoFaStatus("error");
			setTwoFaMessage(res.error);
		}
		setTimeout(() => { if (res.ok) setTwoFaMessage(null); }, 3000);
	};

	const handleDisable2FA = async () => {
		if (!confirm(t("profile.confirmDisable2FA"))) return;
		setTwoFaStatus("loading");
		const res = await disable2FA();
		if (res.ok) {
			setTwoFaStatus("success");
			setTwoFaMessage(t("profile.success2FADisabled"));
			setIs2FAEnabled(false);
		} else {
			setTwoFaStatus("error");
			setTwoFaMessage(res.error);
		}
		setTimeout(() => { setTwoFaMessage(null); }, 3000);
	};


	const validateField = (
		field: TextField,
		v: FormValues = values
	): string | undefined => {
		const raw = v[field] ?? "";
		const value = raw.trim();

		switch (field) {
			case "nickname": {
				if (!value) return t("profile.nicknameRequired");
				if (value.length > 15) {
					return t("profile.nicknameTooLong");
				}
				// letters, numbers, _ or . , length 1–15
				if (!/^[A-Za-z0-9_.]{1,15}$/.test(value)) {
					return t("profile.nicknameInvalid");
				}
				return;
			}
			case "currentPassword": {
				// required if setting a new password
				if (v.password && !value) {
					return t("profile.currentPasswordRequired");
				}
				return;
			}
			case "password": {
				// only validate if user typed something
				if (!value) return;
				if (value.length < 8) {
					return t("profile.passwordTooShort");
				}
				return;
			}
			case "confirm": {
				if (v.password && value !== v.password) {
					return t("profile.passwordsNoMatch");
				}
				return;
			}
			case "email": {
				if (!value) return t("profile.emailRequired");
				if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
					return t("profile.emailInvalid");
				}
				return;
			}
		}
	};

	const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		const field = e.target.name as TextField;
		const value = e.target.value;

		setValues(prev => {
			const next: FormValues = { ...prev, [field]: value };

			setErrors(prevErr => {
				const updated: FormErrors = {
					...prevErr,
					[field]: validateField(field, next),
				};

				// keep confirm/password in sync in real-time
				if (field === "password" || field === "confirm") {
					updated.confirm = validateField("confirm", next);
					updated.currentPassword = validateField("currentPassword", next);
				}

				return updated;
			});

			return next;
		});

		// notify parent so header/cover can update live
		if (field === "nickname") {
			onProfileChange({ nickname: value });
		} else if (field === "email") {
			onProfileChange({ email: value });
		}
	};

	const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
		const field = e.target.name as TextField;
		setErrors(prev => ({
			...prev,
			[field]: validateField(field),
		}));
	};

	const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0] || null;

		setValues(prev => ({ ...prev, avatarFile: file }));

		if (!file) {
			setAvatarPreview("");
			setErrors(prev => ({ ...prev, avatar: undefined }));
			return;
		}

		let msg: string | undefined;

		if (!file.type.startsWith("image/")) {
			msg = t("profile.avatarInvalidType");
		} else if (file.size > 2 * 1024 * 1024) {
			msg = t("profile.avatarTooBig");
		}

		setErrors(prev => ({ ...prev, avatar: msg }));

		if (!msg) {
			const url = URL.createObjectURL(file);
			setAvatarPreview(url);
			onProfileChange({ avatarUrl: url });
		}
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();

		const fields: TextField[] = [
			"nickname",
			"currentPassword",
			"password",
			"confirm",
			"email",
		];

		const newErrors: FormErrors = {};

		fields.forEach(f => {
			const msg = validateField(f);
			if (msg) newErrors[f] = msg;
		});

		const file = values.avatarFile;
		if (file) {
			if (!file.type.startsWith("image/")) {
				newErrors.avatar = t("profile.avatarInvalidType");
			} else if (file.size > 2 * 1024 * 1024) {
				newErrors.avatar = t("profile.avatarTooBig");
			}
		}

		setErrors(newErrors);

		if (Object.keys(newErrors).length > 0) {
			// invalid, don't submit yet
			return;
		}

		if (onSubmit) {
			await onSubmit(values);
		}
	};

	const inputClass = (field: TextField) =>
		inputBase +
		(errors[field]
			? " border-pink-400 ring-2 ring-pink-500/40"
			: "");

	const hintClass = (field: keyof FormErrors) =>
		hintBase + (errors[field] ? " text-pink-300" : "");

	const isDirty =
		values.nickname !== initialValues.nickname ||
		values.currentPassword !== initialValues.currentPassword ||
		values.password !== initialValues.password ||
		values.confirm !== initialValues.confirm ||
		values.email !== initialValues.email ||
		values.avatarFile !== initialValues.avatarFile;

	return (
		<div className="glass card-radius mt-2 p-5 sm:p-6">
			<form noValidate className="space-y-4" onSubmit={handleSubmit}>
				{/* Main Grid: 3 columns on LG (2 for inputs, 1 for extras) */}
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

					{/* LEFT COLUMN: Inputs (spans 2) */}
					<div className="lg:col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-6">


						{/* Nickname */}
						<div className="flex flex-col gap-1 sm:col-span-3">
							<label className={labelBase} htmlFor="nickname">
								{t("profile.nickname")}
							</label>
							<input
								className={inputClass("nickname")}
								id="nickname"
								name="nickname"
								type="text"
								placeholder={t("profile.nicknamePlaceholder")}
								value={values.nickname}
								onChange={handleInputChange}
								onBlur={handleBlur}
								aria-invalid={!!errors.nickname || undefined}
								maxLength={16}
							/>
							<p className={hintClass("nickname")}>
								{errors.nickname ||
									t("profile.nicknameHint")}
							</p>
						</div>

						{/* Email */}
						<div className="flex flex-col gap-1 sm:col-span-3">
							<label className={labelBase} htmlFor="email">
								{t("profile.email")}
							</label>
							<input
								className={inputClass("email")}
								id="email"
								name="email"
								type="email"
								placeholder={t("profile.emailPlaceholder")}
								value={values.email}
								onChange={handleInputChange}
								onBlur={handleBlur}
								aria-invalid={!!errors.email || undefined}
							/>
							<p className={hintClass("email")}>
								{errors.email || "\u00a0"}
							</p>
						</div>

						{/* Current password */}
						<div className="flex flex-col gap-1 sm:col-span-2">
							<label className={labelBase} htmlFor="currentPassword">
								{t("profile.currentPassword")}
							</label>
							<input
								className={inputClass("currentPassword")}
								id="currentPassword"
								name="currentPassword"
								type="password"
								placeholder={t("profile.currentPasswordPlaceholder")}
								autoComplete="current-password"
								value={values.currentPassword}
								onChange={handleInputChange}
								onBlur={handleBlur}
								aria-invalid={!!errors.currentPassword || undefined}
							/>
							<p className={hintClass("currentPassword")}>
								{errors.currentPassword || t("profile.currentPasswordHint")}
							</p>
						</div>

						{/* New password */}
						<div className="flex flex-col gap-1 sm:col-span-2">
							<label className={labelBase} htmlFor="password">
								{t("profile.newPassword")}
							</label>
							<input
								className={inputClass("password")}
								id="password"
								name="password"
								type="password"
								placeholder={t("profile.newPasswordPlaceholder")}
								autoComplete="new-password"
								value={values.password}
								onChange={handleInputChange}
								onBlur={handleBlur}
								aria-invalid={!!errors.password || undefined}
							/>
							<p className={hintClass("password")}>
								{errors.password ||
									t("profile.newPasswordHint")}
							</p>
						</div>

						{/* Confirm password */}
						<div className="flex flex-col gap-1 sm:col-span-2">
							<label className={labelBase} htmlFor="confirm">
								{t("profile.confirmPassword")}
							</label>
							<input
								className={inputClass("confirm")}
								id="confirm"
								name="confirm"
								type="password"
								placeholder={t("profile.confirmPasswordPlaceholder")}
								autoComplete="new-password"
								value={values.confirm}
								onChange={handleInputChange}
								onBlur={handleBlur}
								aria-invalid={!!errors.confirm || undefined}
							/>
							<p className={hintClass("confirm")}>
								{errors.confirm || "\u00a0"}
							</p>
						</div>

						{/* Avatar Preview */}
						<div className="flex flex-col gap-1 sm:col-span-3">
							<span className={labelBase}>{t("profile.avatar")}</span>
							<div className="flex items-center gap-4">
								<div className="w-20 h-20 rounded-full border border-white/20 bg-white/10 overflow-hidden shrink-0">
									<Avatar
										src={avatarPreview}
										alt={t("profile.avatar")}
										className="w-full h-full object-cover"
										size={32}
									/>
								</div>
								<div className="flex flex-col gap-2">
									<label className="cursor-pointer inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-medium transition-colors">
										<span>{t("profile.chooseImage")}</span>
										<input
											type="file"
											accept="image/*"
											className="hidden"
											onChange={handleAvatarChange}
										/>
									</label>
									<p className={hintClass("avatar")}>
										{errors.avatar || t("profile.avatarHint")}
									</p>
								</div>
							</div>
						</div>

						{/* Data & Privacy (Moved here) */}
						<div className="flex flex-col gap-1 sm:col-span-3">
							<label className={labelBase}>{t("profile.dataPrivacy")}</label>
							<div className="flex flex-col gap-2 h-full justify-center">
								<div className="grid grid-cols-2 gap-2">
									<button
										type="button"
										className="chip cursor-pointer flex items-center justify-center gap-2 px-3 py-2 text-sm hover:bg-white/25 transition-colors w-full"
										onClick={handleDownloadData}
										disabled={privacyStatus === "loading"}
									>
										<svg
											viewBox="0 0 24 24"
											className="h-4 w-4"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
										>
											<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
											<path d="M7 10l5 5 5-5" />
											<path d="M12 15V3" />
										</svg>
										{privacyStatus === "loading" ? "..." : t("profile.download")}
									</button>
									<button
										type="button"
										className="chip cursor-pointer flex items-center justify-center gap-2 px-3 py-2 text-sm text-pink-400 hover:bg-pink-500/10 hover:text-pink-300 transition-colors border border-pink-500/30 w-full"
										onClick={handleDeleteAccount}
										disabled={privacyStatus === "loading"}
									>
										<svg
											viewBox="0 0 24 24"
											className="h-4 w-4"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
										>
											<path d="M3 6h18" />
											<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2v2" />
										</svg>
										{t("profile.delete")}
									</button>
									<button
										type="button"
										className="chip cursor-pointer flex items-center justify-center gap-2 px-3 py-2 text-sm text-orange-400 hover:bg-orange-500/10 hover:text-orange-300 transition-colors border border-orange-500/30 w-full col-span-2"
										onClick={handleAnonymizeAccount}
										disabled={privacyStatus === "loading"}
									>
										<svg
											viewBox="0 0 24 24"
											className="h-4 w-4"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
										>
											<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
											<circle cx="12" cy="7" r="4" />
										</svg>
										{t("profile.anonymize")}
									</button>
								</div>
								{privacyMessage && (
									<p className={`text-xs text-center mt-2 ${privacyStatus === "error" ? "text-pink-400" : "text-green-400"}`}>
										{privacyMessage}
									</p>
								)}
							</div>
						</div>
					</div>

					{/* RIGHT COLUMN: Extras (spans 1) */}
					<div className="flex flex-col gap-6 h-full">
						{/* 2FA Section - Expanded */}
						<div className="flex flex-col gap-1 h-full">
							<label className={labelBase}>{t("profile.twoFactorAuth")}</label>
							<div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-4 h-full">
								<div className="flex flex-col items-center gap-4 h-full">
									{/* QR Placeholder - Expanded */}
									<div className="flex-1 w-full min-h-0 flex items-center justify-center relative" style={{ containerType: "size" }}>
										<div className="w-[100cqmin] h-[100cqmin] flex items-center justify-center rounded-lg border-2 border-dashed border-white/20 bg-black/20 overflow-hidden">
											{qrCodeUrl ? (
												<img
													src={qrCodeUrl}
													alt={t("profile.qrCode")}
													className="w-full h-full object-contain p-2 bg-white"
												/>
											) : (
												<div className="text-center text-xs text-white/40">
													<svg
														viewBox="0 0 24 24"
														className="mx-auto mb-1 h-12 w-12 opacity-50"
														fill="none"
														stroke="currentColor"
														strokeWidth="1.5"
													>
														<path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM14 14h1v1h-1zM17 17h1v1h-1zM14 17h1v1h-1zM17 14h1v1h-1z" />
													</svg>
													<span className="text-lg font-medium block mt-2">
														{is2FAEnabled ? t("profile.active") : t("profile.qrCode")}
													</span>
												</div>
											)}
										</div>
									</div>
									<div className="w-full text-center mt-3">
										{is2FAEnabled ? (
											<>
												<p className="text-sm text-green-400 leading-tight mb-3">
													{t("profile.twoFAEnabled")}
												</p>
												<button
													type="button"
													className="chip cursor-pointer px-4 py-2 text-sm hover:bg-red-500/20 text-red-300 border border-red-500/30 transition-colors w-fit mx-auto"
													onClick={handleDisable2FA}
													disabled={twoFaStatus === "loading"}
												>
													{twoFaStatus === "loading" ? t("profile.disabling") : t("profile.disable2FA")}
												</button>
											</>
										) : qrCodeUrl ? (
											<div className="flex flex-col gap-2">
												<p className="text-xs text-white/70">
													{t("profile.scanQrCode")}
												</p>
												<input
													type="text"
													placeholder={t("profile.enterCodePlaceholder")}
													className="w-full rounded border border-white/20 bg-white/10 px-3 py-2 text-center text-sm outline-none focus:border-cyan-400"
													value={twoFaCode}
													onChange={(e) => setTwoFaCode(e.target.value)}
													maxLength={6}
												/>
												<button
													type="button"
													className="chip cursor-pointer px-4 py-2 text-sm bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 transition-colors w-fit self-center"
													onClick={handleVerify2FA}
													disabled={twoFaStatus === "loading" || twoFaCode.length < 6}
												>
													{twoFaStatus === "loading" ? t("profile.verifying") : t("profile.verifyEnable")}
												</button>
											</div>
										) : (
											<>
												<p className="text-sm text-white/70 leading-tight mb-3">
													{t("profile.scanToEnable")}
												</p>
												<button
													type="button"
													className="chip cursor-pointer px-4 py-2 text-sm hover:bg-white/25 transition-colors w-fit mx-auto bg-white/10 border border-white/20"
													onClick={handleSetup2FA}
													disabled={twoFaStatus === "loading"}
												>
													{twoFaStatus === "loading" ? t("profile.generating") : t("profile.setup2FA")}
												</button>
											</>
										)}
										{twoFaMessage && (
											<p className={`text-xs mt-2 ${twoFaStatus === "error" ? "text-pink-400" : "text-green-400"}`}>
												{twoFaMessage}
											</p>
										)}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Submit */}
				<div className="flex justify-end pt-4 border-t border-white/10 mt-2">
					<button
						className={
							"cursor-pointer chip flex items-center gap-2 px-5 py-2 text-sm transition-colors " +
							(isDirty ? "hover:bg-white/25" : "opacity-40 cursor-not-allowed")
						}
						type="submit"
						disabled={!isDirty}
					>
						<svg
							viewBox="0 0 24 24"
							className="h-4 w-4"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						>
							<path d="M5 12h14" />
							<path d="M12 5l7 7-7 7" />
						</svg>
						<span>{t("profile.saveChanges")}</span>
					</button>
				</div>
			</form>


		</div>
	);
};

export default ProfileFormCard;
