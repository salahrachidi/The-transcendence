import authPlugin from './plugin.auth.js'
import fastifyRateLimit from '@fastify/rate-limit'
import oauthPlugin from '@fastify/oauth2'
import cookie from '@fastify/cookie'
import websocketPlugin from '@fastify/websocket'
import Database from 'better-sqlite3'
import multipart from '@fastify/multipart'
import cors from '@fastify/cors'
import metrics from '../utils/utils.prometheus.js'
// added by xeloda: import fastify-static for file serving
import fastifyStatic from '@fastify/static'


async function registerPlugins(server) {

	// database init and decorations
	const db_name = process.env.DB_PATH ? process.env.DB_PATH : "/app/database/db"
	const db = new Database(db_name, { verbose: console.log })
	db.pragma('foreign_keys = ON')
	server.decorate('db', db)

	// rate limit init
	// await server.register(fastifyRateLimit, {
	// 	max: 60,
	// 	timeWindow: '1 minute'
	// })


	await server.register(cookie)
	await server.register(authPlugin)
	await server.register(websocketPlugin)

	// register multipart with 5mb max file
	await server.register(multipart, {
		limits: {
			fileSize: 5 * 1024 * 1024, // 5MB limit
		}
	})

	// register cors
	await server.register(cors, {
		origin: true, // Allow all origins (dev) or set specific URL (prod)
		credentials: true, // Important for Cookies!
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
	})


	// registring oauth plugin (github)
	await server.register(oauthPlugin, {
		name: 'githubOAuth2',
		scope: ['user:email', 'read:user'],
		credentials: {
			client: {
				id: process.env.OAUTH_ID,
				secret: process.env.OAUTH_SECRET
			},
			auth: oauthPlugin.GITHUB_CONFIGURATION
		},
		startRedirectPath: '/auth/github',
		//callbackUri: 'http://localhost:3000/auth/github/callback'
		// added by xeloda: update callbackUri to use FRONTEND_URL env var
		callbackUri: `${process.env.PUBLIC_URL || 'https://localhost'}/auth/github/callback`,
		// added by xeloda: add cookie configuration for development environment
		cookie: {
			secure: true, //!!!!! important Set to true in production with HTTPS
			sameSite: 'lax',
			path: '/',
			httpOnly: true
		}
	})


	// error handling for 404 and 500 (questionable ?)
	server.setErrorHandler((error, request, reply) => {
		server.log.error(error);

		if (error.validation) {
			return reply.status(400).send({
				success: false,
				result: 'Validation error: ' + error.message
			})
		}

		if (error.code === 'FST_REQ_FILE_TOO_LARGE') {
			return reply.status(413).send({
				success: false,
				result: 'File size too large (max 5MB)'
			})
		}

		reply.status(500).send({
			success: false,
			result: 'An internal server error occurred: ' + error.message
		})
	})

	// file upload configuration


	// mehdi's monitoring system config
	server.addHook('onRequest', (request, reply, done) => {
		metrics.trackRequest(request, reply)
		done()
	})

	server.get('/metrics', async (request, reply) => {
		const metricsData = await metrics.getMetrics()
		reply.type(metrics.getContentType())
		return reply.send(metricsData)
	});

	server.decorate('metrics', metrics);

	// added by xeloda: register fastify-static to serve uploaded avatars
	await server.register(fastifyStatic, {
		root: '/app/uploads',
		prefix: '/uploads/', // optional: default '/'
	})
}

export default registerPlugins