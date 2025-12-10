import userModel from '../models/model.user.js'
import jwtModel from '../models/model.jwt.js'
import blockModel from "../models/model.blocks.js"
import friendModel from '../models/model.friend.js'
import gameStateModel from '../models/model.gameState.js'
import sanitizer from '../utils/utils.sanitize.js'
import jwtCookieParams from '../utils/utils.jwtCookie.js'
import uploadUtils from '../utils/utils.upload.js'
import { unlink } from 'fs/promises';


const userControlers = {

	async getAllUsers_C(request, reply) {

		const all_users = await userModel.getAllUsers(this.db)
		return reply.status(200).send({
			success: true,
			result: all_users
		})
	},

	async getUserById_C(request, reply) {

		const user_id = request.params.id
		const user = await userModel.getUserById(this.db, user_id)
		if (user === undefined) {
			return reply.status(400).send({
				success: false,
				result: 'user not found'
			})
		}
		const gameStats = await gameStateModel.getUserGameStates(this.db, user_id)
		const safe_user = sanitizer.sanitizeUser(user)
		//added by xeloda: front-end expects number_of_loses instead of n_loses and number_of_wins instead of n_wins
		safe_user.gameStats = {
			total_games: gameStats.total_games,
			number_of_wins: gameStats.n_wins,
			number_of_loses: gameStats.n_loses,
			total_delta: gameStats.total_delta
		}
		return reply.status(200).send({
			success: true,
			result: safe_user
		})
	},

	// added by xeloda: verified by mel-houd
	async getMe_C(request, reply) {
		const user_id = request.user.id
		const user = await userModel.getUserById(this.db, user_id)
		if (!user) {
			return reply.status(400).send({
				success: false,
				result: 'user not found'
			})
		}
		const gameStats = await gameStateModel.getUserGameStates(this.db, user_id)
		const safe_user = sanitizer.sanitizeUser(user)
		safe_user.gameStats = {
			total_games: gameStats.total_games,
			number_of_wins: gameStats.n_wins,
			number_of_loses: gameStats.n_loses,
			total_delta: gameStats.total_delta
		}
		return reply.status(200).send({
			success: true,
			result: safe_user
		})
	},

	async getUserByName_C(request, reply) {

		const nickname = request.params.nickname
		const user = await userModel.getUserByName(this.db, nickname)
		if (user === undefined) {
			return reply.status(400).send({
				success: false,
				result: 'user not found'
			})
		}

		const gameStats = await gameStateModel.getUserGameStates(this.db, user.id)
		const safe_user = sanitizer.sanitizeUser(user)
		safe_user.gameStats = {
			total_games: gameStats.total_games,
			number_of_wins: gameStats.n_wins,
			number_of_loses: gameStats.n_loses,
			total_delta: gameStats.total_delta
		}
		return reply.status(200).send({
			success: true,
			result: safe_user
		})
	},

	async deleteUser_C(request, reply) {

		const user_id = request.params.id
		const result = await userModel.deleteUser(this.db, user_id)
		return reply.status(200).send({
			success: true,
			result: result
		})
	},

	async deleteAllUsers_C(request, reply) {
		const result = await userModel.deleteAllUsers(this.db)
		return reply.status(200).send({
			success: true,
			result: result
		})
	},

	// added by xeloda: add controller method to trigger user anonymization
	async requestAnonymization_C(request, reply) {
		const user_id = request.user.id
		await userModel.anonymizeUser(this.db, user_id)

		// Clear cookie
		return reply.clearCookie('token', jwtCookieParams.cookie).status(200).send({
			success: true,
			result: 'Account anonymized successfully'
		})
	},

	async updateUser_C(request, reply) {

		const id = request.user.id
		const { nickname, new_password, current_password, email } = request.body

		if ((new_password && !current_password) || (!new_password && current_password)) {
			return reply.status(400).send({
				success: false,
				result: 'provide both or none, the new_password and current_password'
			})
		}

		const user = await userModel.getUserById(this.db, id)
		if (user === undefined) {
			return reply.status(400).send({
				success: false,
				result: 'no user found to update'
			})
		}

		const new_nick = nickname ? nickname : user.nickname
		const new_email = email ? email : user.email
		let new_pass = user.password
		if (new_password && current_password) {

			// check current_password for the password of the user
			try {
				await sanitizer.checkPassword(user.password, current_password)
			} catch (error) {
				return reply.status(401).send({
					success: false,
					result: 'wrong current_password'
				})
			}
			new_pass = await sanitizer.hashPassword(new_password)
		}

		// added by xeloda: verified by mel-houd
		if (!await userModel.checkNameDup(this.db, new_nick, id)) {
			return reply.status(409).send({
				success: false,
				result: 'nickname is duplicated'
			})
		}

		if (!await userModel.checkEmailDup(this.db, new_email, id)) {
			return reply.status(409).send({
				success: false,
				result: 'email is duplicated'
			})
		}

		const result = await userModel.updateUser(this.db, id, new_nick, new_pass, new_email)

		return reply.status(200).send({
			success: true,
			result: result
		})
	},

	async uploadAvatar_C(request, reply) {
		const id = request.user.id
		const data = await request.file()

		if (!data) {
			return reply.status(400).send({
				success: false,
				result: 'no file uploaded'
			})
		}

		if (!uploadUtils.checkMimeTypes(data.mimetype)) {
			return reply.status(400).send({
				success: false,
				result: 'invalid file type. Only JPG, PNG, and WEBP are allowed.'
			})
		}

		// this function returns an object with :
		//{
		//    success: false/true,
		//    result: avatar_url/err.message
		//}
		const avatar_url_data = await uploadUtils.uploadFileHandler(data, id)

		if (avatar_url_data.success) {
			await userModel.updateAvatar(this.db, id, avatar_url_data.result)
			return reply.status(200).send(avatar_url_data)
		}

		return reply.status(400).send(avatar_url_data)
	},

	//--------------GDPR CONTROLLERS (dont touch !) -------------------//

	// this need to include EVERYTHING related to the user except secrets (password, 2fa secret)
	async exposeUserData_C(request, reply) {

		const id = request.user.id

		const user = await userModel.getUserById(this.db, id)

		if (!user) {
			reply.status(404).send({
				success: false,
				result: 'user not found'
			})
		}

		const gameStats = await gameStateModel.getUserGameStates(this.db, id)
		const blockedUsers = await blockModel.getBlocks(this.db, id)
		const userFriends = await friendModel.getFriendsNicknames(this.db, id)

		const payload = {
			profile: {
				id: user.id,
				nickname: user.nickname,
				email: user.email,
				avatar: user.avatar,
				created_at: user.created_at
			},
			social: {
				friends: userFriends,
				blocked: blockedUsers,
			},
			gaming: {
				total_games: gameStats.total_games,
				number_of_wins: gameStats.n_wins,
				number_of_loses: gameStats.n_loses,
				total_delta: gameStats.total_delta
			}
		}

		reply.header('Content-Disposition', 'attachment; filename="user_data.json"')
		reply.status(200).send(payload)
	},

	async requestAnonymization_C(request, reply) {

		const id = request.user.id
		const user = await userModel.getUserById(this.db, id)

		if (!user) {
			reply.status(404).send({
				success: false,
				result: 'user not found'
			})
		}

		// delete user avatar

		const default_avatar = '/uploads/default.png'

		if (user.avatar && user.avatar !== default_avatar) {
			try {
				await unlink('/app' + user.avatar);
			} catch (err) {
				console.error('Error deleting avatar:', err);
			}
		}

		const anon_nickname = 'anon_' + sanitizer.generateRandomString(10)
		const anon_email = sanitizer.generateRandomString(7) + '@anon.user'
		const anon_pass = sanitizer.generateRandomString(20)
		const anon_avatar = '/uploads/default.png'

		await userModel.updateUser(this.db, id, anon_nickname, anon_pass, anon_email, anon_avatar)

		await userModel.disable2FA(this.db, id)
		await userModel.updateAvatar(this.db, id, anon_avatar)


		// add token to be deleted after 1 hour
		const token = request.cookies.token
		const decodedToken = await request.jwtVerify()
		const expirationDate = new Date(decodedToken.exp * 1000)
		const expires_at_iso = expirationDate.toISOString()
		await jwtModel.addJwt(this.db, token, expires_at_iso)

		// frontend need to redirect the user to login page after this
		reply.clearCookie('token', jwtCookieParams.cookie).status(410).send({
			success: true,
			result: 'account anonymization done'
		})
	},

	// this one is gonna delete ALL user data because of CASCADE in db tables
	async requestAccountDeletion_C(request, reply) {

		const id = request.user.id
		const user = await userModel.getUserById(this.db, id)
		const default_avatar = '/uploads/default.png'

		if (!user) {
			reply.status(404).send({
				success: false,
				result: 'user not found'
			})
		}

		if (user.avatar && user.avatar !== default_avatar) {
			try {
				await unlink('/app' + user.avatar);
			} catch (err) {
				console.error('Error deleting avatar:', err);
			}
		}

		await userModel.deleteUser(this.db, id)

		// sinse the account is deleted the CASCADE gonna trigger and erase all the rows
		// the user is on them

		const token = request.cookies.token
		const decodedToken = await request.jwtVerify()
		const expirationDate = new Date(decodedToken.exp * 1000)
		await jwtModel.addJwt(this.db, token, expirationDate.toISOString())

		// frontend need to redirect the user to login page after this
		reply.clearCookie('token', jwtCookieParams.cookie).status(410).send({
			success: true,
			result: 'account deletion done'
		})
	},
}

export default userControlers