import matchControllers from "../controllers/controller.match.js"

function matchRoutes(server) {
	server.get('/:match_id', {
		onRequest: [server.auth],
		schema: {
			params: {
				type: 'object',
				required: ['match_id'],
				properties: {
					match_id: { type: 'integer' }
				}
			}
		}
	}, matchControllers.getMatchById_C)

	server.get('/user/:user_id', {
		onRequest: [server.auth],
		schema: {
			params: {
				type: 'object',
				required: ['user_id'],
				properties: {
					user_id: { type: 'integer' }
				}
			},
			querystring: {
				type: 'object',
				properties: {
					limit: { type: 'integer' }
				}
			}
		}
	}, matchControllers.getUserMatches_C)
}

export default matchRoutes