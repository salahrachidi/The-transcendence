import matchModel from "../models/model.match.js"

const matchControllers = {
	async getMatchById_C(request, reply) {
		const { match_id } = request.params

		const match = await matchModel.getMatchById(this.db, match_id)

		if (!match) {
			return reply.status(404).send({
				success: false,
				result: 'Match not found'
			})
		}

		return reply.status(200).send({
			success: true,
			result: match
		})
	},

	async getUserMatches_C(request, reply) {
		const { user_id } = request.params
		const limit = request.query.limit || 10

		const matches = await matchModel.getUserMatches(this.db, user_id, limit)

		return reply.status(200).send({
			success: true,
			result: matches
		})
	}
}

export default matchControllers