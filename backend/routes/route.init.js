import userRoutes from './route.user.js'
import authRoutes from './route.auth.js'
import socialRoutes from './route.social.js'
import gameStateRoutes from './routes.gameState.js'
import chatRoutes from './route.chat.js'
import friendRoutes from './route.friend.js'
import gameRoutes from './route.game.js'
import matchRoutes from './route.match.js'
import { registerWebSocketRoutes } from '../utils/game/utils.wsGame.js'

async function initRoutes(server) {
	server.register(userRoutes, { prefix: '/user' })
	server.register(authRoutes, { prefix: '/auth' })
	server.register(socialRoutes, { prefix: '/social' })
	server.register(gameStateRoutes, { prefix: '/gameState' })
	server.register(chatRoutes, { prefix: '/chat' })
	server.register(friendRoutes, { prefix: '/friend' })
	server.register(gameRoutes, { prefix: '/game' })
	server.register(matchRoutes, { prefix: '/match' })
	registerWebSocketRoutes(server)
}

export default initRoutes