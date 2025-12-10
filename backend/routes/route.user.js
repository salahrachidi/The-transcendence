import userControllers from '../controllers/controller.user.js'

function userRoutes(server) {

	// gets one user by id
	server.get('/id/:id', {
		onRequest: [server.auth],
		schema: {
			params: {
				type: 'object',
				required: ['id'],
				properties: {
					id: { type: 'integer' }
				}
			}
		}
	}, userControllers.getUserById_C)

	//added by xeloda: verified by mel-houd
	server.get('/me', {
		onRequest: [server.auth]
	}, userControllers.getMe_C)

	// gets one user by nickname
	server.get('/nickname/:nickname', {
		onRequest: [server.auth],
		schema: {
			params: {
				type: 'object',
				required: ['nickname'],
				properties: {
					nickname: { type: 'string', minLength: 1, maxLength: 15, pattern: '^[a-zA-Z0-9_.]+$' }
				}
			}
		}
	}, userControllers.getUserByName_C)

	server.post('/:id', {
		onRequest: [server.auth],
		schema: {
			params: {
				type: 'object',
				properties: {
					id: { type: 'integer' }
				}
			},
			body: {
				type: 'object',
				properties: {
					nickname: { type: 'string', minLength: 1, maxLength: 15, pattern: '^[a-zA-Z0-9_.]+$' },
					new_password: { type: 'string', minLength: 8, maxLength: 30 },
					current_password: { type: 'string', minLength: 8, maxLength: 30 },
					email: { type: 'string', format: 'email' },
				}
			}
		}
	}, userControllers.updateUser_C)

	// this path is to set/update the user avatar
	server.post('/avatar', {
		onRequest: [server.auth],
		schema: {
			consumes: ['multipart/form-data'],
		}
	}, userControllers.uploadAvatar_C)



	// not ready yet:
	server.get('/my_data', {
		onRequest: [server.auth]
	}, userControllers.exposeUserData_C)

	server.post('/anonymize', {
		onRequest: [server.auth]
	}, userControllers.requestAnonymization_C)

	server.post('/delete', {
		onRequest: [server.auth]
	}, userControllers.requestAccountDeletion_C)

}

export default userRoutes