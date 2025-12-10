import socialControllers from "../controllers/controller.social.js"

function socialRoutes(server) {

	// Common schema for routes that require an ID parameter
	const idParamSchema = {
		params: {
			type: 'object',
			/**
			 * added by xeloda: 
			 * Update idParamSchema to require  id instead of 
			 * 	friend_id to match the route parameter definition (:id).
			 *  Cuz the controller expects "request.params.id"
			 */
			required: ['id'],
			properties: {
				id: { type: 'integer' }
			}
		}
	}

	// ================= BLOCKING =================
	/**
	 * added by xeloda: Preserved cuz it is used by the Chat feature.
	 */
	// POST /social/block/:id -> Block a user
	server.post('/block/:id', {
		onRequest: [server.auth],
		schema: idParamSchema
	}, socialControllers.blockUser_C)

	// POST /social/unblock/:id -> Unblock a user
	server.post('/unblock/:id', { // Using POST because we are creating a "change", though DELETE /block/:id is also valid
		onRequest: [server.auth],
		schema: idParamSchema
	}, socialControllers.unblockUser_C)

}

export default socialRoutes
