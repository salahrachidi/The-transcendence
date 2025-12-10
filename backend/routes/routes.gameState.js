import gameStateControllers from "../controllers/controller.gameState.js"

function gameStateRoutes(server) {

	server.get('/leaderboard', {
		onRequest: [server.auth],
		schema: {
			// added by xeloda: validate querystring instead of params
			querystring: {
				type: 'object',
				properties: {
					limit: { type: 'integer' }
				}
			}
		}
	}, gameStateControllers.getLeaderboard_C)

	server.get('/', {
		onRequest: [server.auth],
		schema: {
			// added by xeloda: explicitly add query logic if needed, but keeping default
		}
	}, gameStateControllers.getMyGameStates_C)

	server.get('/:user_id', {
		onRequest: [server.auth],
		schema: {
			params: {
				type: 'object',
				required: ['user_id'],
				properties: {
					user_id: { type: 'integer' }
				}
			}
		}
	}, gameStateControllers.getUserGameStates_C)

}

export default gameStateRoutes