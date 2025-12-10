import friendModel from '../models/model.friend.js'
import userModel from '../models/model.user.js'

async function validateInteraction(db, reply, user_id, friend_id) {

	// 1. Check Self
	if (user_id == friend_id) {
		reply.status(400).send({
			success: false,
			result: 'you cannot interact with yourself'
		});
		return false; // Failed
	}

	// 2. Check User Exists
	if (!await userModel.getUserById(db, friend_id)) {
		reply.status(404).send({
			success: false,
			result: 'id not found'
		});
		return false; // Failed
	}

	return true; // All checks passed
}

const friendControllers = {

	async checkFriend_C(request, reply) {
		const user_id = request.user.id
		const friend_id = request.params.id

		if (!validateInteraction(this.db, reply, user_id, friend_id)) {
			return
		}

		// dont double check !! i insert two rows per friendship in the db this is enough
		const result = await friendModel.checkFriend(this.db, user_id, friend_id)
		if (result) {
			return reply.status(200).send({
				success: true,
				result: 'friendship found'
			})
		}
		return reply.status(404).send({
			success: false,
			resultL: 'friendship not found'
		})
	},

	async createFriend_C(request, reply) {
		const user_id = request.user.id
		const friend_id = request.params.id

		if (!validateInteraction(this.db, reply, user_id, friend_id)) {
			return 
		}

		const check = await friendModel.checkFriend(this.db, user_id, friend_id)

		if (check) {
			return reply.status(400).send({
				success: false,
				result: 'you are already friends with this user !'
			})
		}

		await friendModel.createFriend(this.db, user_id, friend_id)

		return reply.status(201).send({
			success: true,
			result: 'friendship created'
		})
	},

	async getFriends_C(request, reply) {
		const user_id = request.user.id

		const result = await friendModel.getFriends(this.db, user_id)

		return reply.status(200).send({
			success: true,
			result: result
		})
	}
}


export default friendControllers