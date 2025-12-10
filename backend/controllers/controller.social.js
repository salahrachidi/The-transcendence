import userModel from "../models/model.user.js"
import blockModel from "../models/model.blocks.js"

/**
 * added by xeloda : Refactor to use a standalone validateInteraction function.
 */
async function validateInteraction(db, reply, user_id, friend_id, bypassBlockCheck = false) {

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
			result: 'friend not found'
		});
		return false; // Failed
	}

	// 3. Check Block (Bidirectional)
	if (!bypassBlockCheck && (await blockModel.checkBlock(db, user_id, friend_id) ||
		await blockModel.checkBlock(db, friend_id, user_id))) {
		reply.status(403).send({
			success: false,
			result: 'you blocked this user or they blocked you'
		});
		return false; // Failed
	}

	return true; // All checks passed
};

// some repetetive tasks here...
const socialControllers = {

	async blockUser_C(request, reply) {
		const user_id = request.user.id
		const friend_id = Number(request.params.id) // Ensure number

		// Check if blocking myself (covered by validateInteraction) or if already blocked
		// If I already blocked them, we can just return success or check first.
		const existingBlock = await blockModel.checkBlock(this.db, user_id, friend_id);

		if (existingBlock) {
			// Already blocked, treat as success (Idempotent)
			return reply.status(200).send({
				success: true,
				result: 'user is already blocked'
			})
		}

		if (!await validateInteraction(this.db, reply, user_id, friend_id, true)) {
			return;
		}

		await blockModel.createBlock(this.db, user_id, friend_id)

		return reply.status(201).send({
			success: true,
			result: 'you successfully blocked the user !'
		})
	},

	async unblockUser_C(request, reply) {

		const user_id = request.user.id
		const friend_id = request.params.id

		if (user_id == friend_id) {
			return reply.status(400).send({
				success: false,
				result: 'you cannot interact with yourself'
			})
		}

		if (!await userModel.getUserById(this.db, friend_id)) {
			return reply.status(404).send({
				success: false,
				result: 'friend not found'
			})
		}

		if (!await blockModel.checkBlock(this.db, user_id, friend_id)) {
			return reply.status(404).send({
				success: false,
				result: 'you didnt block this user !'
			})
		}

		await blockModel.removeBlock(this.db, user_id, friend_id)

		return reply.status(200).send({
			success: true,
			result: 'user has been unblocked'
		})
	}


}

export default socialControllers
