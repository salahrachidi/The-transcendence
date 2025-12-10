import userModel from '../models/model.user.js'
import jwtModel from '../models/model.jwt.js'
import sanitizer from '../utils/utils.sanitize.js'
import twoFactorService from "../utils/utils.2fa.js"
import jwtCookieParams from '../utils/utils.jwtCookie.js'
import gameStateModel from '../models/model.gameState.js'
import axios from 'axios'

// for the 2fa flow chart :
// generate -> verify -> 2faLogin -> disable2fa

const authController = {
	async verify_C(request, reply) {
		const { nickname, password } = request.body
		const user = await userModel.getUserByName(this.db, nickname)

		if (user === undefined ||
			!await sanitizer.checkPassword(user.password, password)) {
			return reply.status(200).send({
				success: false,
				result: 'invalid credentials'
			})
		}

		const safe_user = sanitizer.sanitizeUser(user)
		return reply.status(200).send({
			success: true,
			result: safe_user
		})
	},

	async login_C(request, reply) {

		const { email, password } = request.body
		const user = await userModel.getUserByEmail(this.db, email)

		if (user === undefined ||
			!await sanitizer.checkPassword(user.password, password)) {
			return reply.status(404).send({
				success: false,
				result: 'invalid credentials'
			})
		}

		if (user.is_two_factor_enabled) {
			return reply.status(200).send({
				success: true,
				result: {
					userId: user.id,
					twoFactorRequired: true,
				}
			})
		}

		const safe_user = sanitizer.sanitizeUser(user)
		const token = await this.generateToken(safe_user)

		return reply.setCookie('token', token, jwtCookieParams.cookie).status(200).send({
			success: true,
			result: safe_user
		})
	},

	async signup_C(request, reply) {

		const { nickname, email, password } = request.body

		if (!await userModel.checkNameDup(this.db, nickname) || !await userModel.checkEmailDup(this.db, email)) {
			return reply.status(409).send({
				success: false,
				result: 'email or nickname duplicated'
			})
		}

		const hashed_password = await sanitizer.hashPassword(password)
		await userModel.addUser(this.db, nickname, email, hashed_password)
		const safe_user = sanitizer.sanitizeUser(await userModel.getUserByEmail(this.db, email))
		await gameStateModel.createGameStates(this.db, safe_user.id)

		const token = await this.generateToken(safe_user)

		return reply.setCookie('token', token, jwtCookieParams.cookie).status(200).send({
			success: true,
			result: safe_user
		})
	},

	async login2FA_C(request, reply) {

		const { id, token_2fa } = request.body
		const user = await userModel.getUserById(this.db, id)

		if (!user) {
			return reply.status(400).send({
				success: false,
				result: 'user not found'
			})
		}

		if (!user.two_factor_secret) {
			return reply.status(403).send({
				success: false,
				result: '2FA not setuped'
			})
		}

		const isTokenValid = twoFactorService.verifyToken(user.two_factor_secret, token_2fa)

		if (!isTokenValid) {
			return reply.status(401).send({
				success: false,
				result: 'invalid 2FA token'
			})
		}

		const safe_user = sanitizer.sanitizeUser(user)
		const payload = {
			id: safe_user.id,
			nickname: safe_user.nickname
		}
		const token = await this.generateToken(payload)

		return reply.setCookie('token', token, jwtCookieParams.cookie).status(200).send({
			success: true,
			result: safe_user
		})
	},

	async generate2FA_C(request, reply) {

		const { id, nickname } = request.user

		const secret = twoFactorService.generateUniqueSecret()
		const user = await userModel.getUserById(this.db, id)

		if (!user) {
			return reply.status(400).send({
				success: false,
				result: 'user not found'
			})
		}

		await userModel.setTwoFactorSecret(this.db, id, secret)
		const otpauthUrl = twoFactorService.generateOtpAuthUrl(nickname, secret)
		const qrCodeDataUrl = await twoFactorService.generateQrCodeDataURL(otpauthUrl)

		return reply.status(200).send({
			success: true,
			result: qrCodeDataUrl
		})
	},

	async verify2FA_C(request, reply) {

		const { id } = request.user
		const { token_2fa } = request.body

		const user = await userModel.getUserById(this.db, id)

		if (!user) {
			return reply.status(400).send({
				success: false,
				result: 'user not found'
			})
		}

		if (!user.two_factor_secret) {
			return reply.status(403).send({
				success: false,
				result: '2FA not setuped'
			})
		}

		const isTokenValid = twoFactorService.verifyToken(user.two_factor_secret, token_2fa);

		if (!isTokenValid) {
			return reply.status(401).send({
				success: false,
				result: 'invalid 2FA token'
			})
		}
		//added by xeloda: verified by mel-houd
		await userModel.enable2FA(this.db, id)

		return reply.status(200).send({
			success: true,
			result: '2FA enabled successfully'
		})
	},

	async disable2FA_C(request, reply) {

		const id = request.user.id
		const result = await userModel.disable2FA(this.db, id)
		return reply.status(200).send({
			success: true,
			result: result
		})
	},

	async logout_C(request, reply) {

		const token = request.cookies.token

		if (token === undefined) {
			return reply.status(401).send({
				success: false,
				result: 'not auth token provided'
			})
		}

		const decodedToken = await request.jwtVerify()
		const expirationDate = new Date(decodedToken.exp * 1000)
		const expires_at_iso = expirationDate.toISOString()

		await jwtModel.addJwt(this.db, token, expires_at_iso)

		return reply.clearCookie('token', jwtCookieParams.cookie).status(200).send({
			success: true,
			result: 'successfully logged out'
		})
	},

	async githubCallback_C(request, reply) {
		try {
			//console.log("GitHub Callback hit. Code:", request.query.code); // DEBUG
			//console.log("this.githubOAuth2 exists?", !!this.githubOAuth2); // DEBUG

			const { token } = await this.githubOAuth2.getAccessTokenFromAuthorizationCodeFlow(request)
			//console.log("Token received"); // DEBUG

			const githubUserResponse = await axios.get('https://api.github.com/user', {
				headers: {
					'Authorization': `token ${token.access_token}`
				}
			})
			//console.log("GitHub User fetched:", githubUserResponse.data.login); // DEBUG

			const githubUser = githubUserResponse.data
			const githubEmailsResponse = await axios.get('https://api.github.com/user/emails', {
				headers: {
					'Authorization': `token ${token.access_token}`
				}
			})

			const primaryEmail = githubEmailsResponse.data.find(email => email.primary).email
			//console.log("Primary Email:", primaryEmail); // DEBUG

			let user = await userModel.getUserByEmail(this.db, primaryEmail)

			if (!user) {
				//console.log("Creating new user..."); // DEBUG
				const newUser = {
					nickname: githubUser.login,
					password: await sanitizer.hashPassword(Math.random().toString(36).slice(-8)),
					email: primaryEmail,
					avatar: githubUser.avatar_url,
				}
				// Check for nickname dup just in case
				if (!await userModel.checkNameDup(this.db, newUser.nickname)) {
					newUser.nickname = newUser.nickname + '_' + Math.floor(Math.random() * 1000);
				}

				const newUserId = await userModel.addUser(this.db, newUser.nickname, newUser.email, newUser.password, newUser.avatar)
				await userModel.updateAvatar(this.db, newUserId, newUser.avatar)
				await gameStateModel.createGameStates(this.db, newUserId)
				user = await userModel.getUserById(this.db, newUserId)
			}

			const safe_user = sanitizer.sanitizeUser(user)
			const jwt_token = await this.generateToken(safe_user)

			// added by xeloda: add FRONTEND_URL env var check with localhost fallback for redirect
			const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001'
			//console.log("Redirecting to:", `${frontendUrl}/dashboard`); // DEBUG
			// added by xeloda: replace JSON response with redirect to dashboard
			return reply.setCookie('token', jwt_token, jwtCookieParams.cookie).redirect(`${frontendUrl}/dashboard`)
		} catch (error) {
			console.error("GitHub Callback Error:", error);
			return reply.status(500).send({
				success: false,
				result: 'GitHub Login Failed: ' + error.message
			})
		}
	}
}

export default authController