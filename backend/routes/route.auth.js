import authController from "../controllers/controller.auth.js"

function authRoutes(server) {
	server.post('/login', {
		schema: {
			body: {
				type: 'object',
				required: ['email', 'password'],
				properties: {
					email: { type: 'string', format: 'email' },
					password: { type: 'string', minLength: 8, maxLength: 30 }
				}
			}
		}

	}, authController.login_C)

	server.post('/verify', {
		schema: {
			body: {
				type: 'object',
				required: ['nickname', 'password'],
				properties: {
					nickname: { type: 'string', minLength: 1, maxLength: 15 },
					password: { type: 'string', minLength: 8, maxLength: 30 }
				}
			}
		}
	}, authController.verify_C)

	server.post('/signup', {
		schema: {
			body: {
				type: 'object',
				required: ['nickname', 'email', 'password'],
				properties: {
					nickname: { type: 'string', minLength: 1, maxLength: 15, pattern: '^[a-zA-Z0-9_.]+$' },
					email: { type: 'string', format: 'email' },
					password: { type: 'string', minLength: 8, maxLength: 30 },
				}
			}
		}

	}, authController.signup_C)

	server.post('/login/2fa', {
		schema: {
			body: {
				type: 'object',
				required: ['id', 'token_2fa'],
				properties: {
					id: { type: 'integer' },
					token_2fa: { type: 'string' }
				}
			}
		}

	}, authController.login2FA_C)

	server.get('/2fa/generate', {
		onRequest: [server.auth]
	}, authController.generate2FA_C)

	server.post('/2fa/verify', {
		onRequest: [server.auth],
		schema: {
			body: {
				type: 'object',
				required: ['token_2fa'],
				properties: {
					token_2fa: { type: 'string' }
				}
			}
		}
	}, authController.verify2FA_C)

	server.get('/2fa/disable', {
		onRequest: [server.auth],
	}, authController.disable2FA_C)

	server.post('/logout', {
		onRequest: [server.auth]
	}, authController.logout_C)

	server.get('/github/callback', authController.githubCallback_C)

}


export default authRoutes