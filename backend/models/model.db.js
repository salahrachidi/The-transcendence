import userModel from './model.user.js'
import jwtModel from './model.jwt.js'
import blockModel from './model.blocks.js'
import gameStateModel from './model.gameState.js'
import chatModel from './model.chat.js'
import friendModel from './model.friend.js'
import matchModel from './model.match.js'


async function initDb(server) {
	await userModel.initUser(server.db)
	await jwtModel.initJwt(server.db)
	await blockModel.initBlock(server.db)
	await gameStateModel.initGameStates(server.db)
	await chatModel.initChat(server.db)
	await friendModel.initFriend(server.db)
	await matchModel.initMatch(server.db)
}


export default initDb