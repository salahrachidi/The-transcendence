import gameStateModel from "../models/model.gameState.js"
import userModel from "../models/model.user.js"

const gameStatesControllers = {

	async getMyGameStates_C(request, reply) {
		const user_id = request.user.id

		const result = await gameStateModel.getUserGameStates(this.db, user_id)
		return reply.status(200).send({
			success: true,
			result: result
		})
	},

	async getUserGameStates_C(request, reply) {
		const user_id = request.params.user_id

		const check_user = await userModel.getUserById(this.db, user_id)

		if (!check_user) {
			return reply.status(404).send({
				success: false,
				result: 'user id not found'
			})
		}

		const result = await gameStateModel.getUserGameStates(this.db, user_id)
		return reply.status(200).send({
			success: true,
			result: result
		})
	},

	async getLeaderboard_C(request, reply) {
		// added by xeloda: use query params instead of path params for limit
		let limit = request.query.limit
		limit = limit ? limit : 10
		const result = await gameStateModel.getLeaderboard(this.db, limit)
		return reply.status(200).send({
			success: true,
			result: result
		})
	}

}



export default gameStatesControllers