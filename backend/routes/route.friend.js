import friendControllers from '../controllers/controller.friend.js'


// Common schema for routes that require an ID parameter
const idParamSchema = {
	params: {
		type: 'object',
		properties: {
			id: {
				type: 'integer'
			}
		},
		required: ['id']
	}
}

function friendRoutes(server) {

	// check if friendship exist
	server.get('/check/:id', {
		onRequest: [server.auth],
		schema: idParamSchema,
	}, friendControllers.checkFriend_C)

	server.get('/get_all', {
		onRequest: [server.auth],
	}, friendControllers.getFriends_C)

	server.post('/create/:id', {
		onRequest: [server.auth],
		schema: idParamSchema,
	}, friendControllers.createFriend_C)

}

export default friendRoutes